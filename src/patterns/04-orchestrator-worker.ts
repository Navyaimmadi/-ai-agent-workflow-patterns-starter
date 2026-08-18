import {
  extractJsonMiddleware,
  generateText,
  NoObjectGeneratedError,
  Output,
  wrapLanguageModel,
} from "ai";
import { z } from "zod";
import { getModel } from "../lib/ai";
import {
  getCliInput,
  handleRunError,
  isDirectRun,
  printSection,
  saveExecutionLog,
} from "../lib/io";

const defaultInput =
  "Create a beginner study guide explaining AI workflows versus autonomous agents.";

const planSchema = z.object({
  goal: z.string(),
  subtasks: z
    .array(
      z.object({
        id: z.string(),
        workerRole: z.string(),
        task: z.string(),
      }),
    )
    .min(2)
    .max(4),
});

export async function runOrchestratorWorker(input = defaultInput): Promise<string> {
  const { model, modelName } = getModel();
  const structuredModel = wrapLanguageModel({
    model,
    middleware: extractJsonMiddleware(),
  });

  // The orchestrator dynamically decides which subtasks are needed.
  let plan: z.infer<typeof planSchema>;
  try {
    const planResult = await generateText({
      model: structuredModel,
      system:
        'You are an orchestrator. Return only a JSON object with exactly two properties: "goal" and "subtasks". The "goal" value must be a string. The "subtasks" value must be an array of 2 to 4 independent assignments. Every assignment must contain exactly three string properties: "id", "workerRole", and "task". Do not complete the tasks yourself, and do not add Markdown or extra text.',
      prompt: input,
      output: Output.object({
        name: "orchestrator_plan",
        description:
          "A goal and 2 to 4 independent subtasks with an id, worker role, and task.",
        schema: planSchema,
      }),
    });

    plan = planResult.output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      let parsedResponse: unknown;

      try {
        parsedResponse = JSON.parse(error.text ?? "");
      } catch {
        throw new Error(
          `Orchestrator returned JSON that could not be parsed. Raw response: ${error.text ?? "(no text returned)"}`,
        );
      }

      const validation = planSchema.safeParse(parsedResponse);
      if (validation.success) {
        plan = validation.data;
      } else {
        const issues = validation.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");

        throw new Error(
          `Orchestrator response failed schema validation: ${issues}. Raw response: ${error.text ?? "(no text returned)"}`,
        );
      }
    } else {
      throw error;
    }
  }

  // Each planned subtask becomes a worker call. The workers run in parallel.
  const workerOutputs = await Promise.all(
    plan.subtasks.map(async (subtask) => {
      const result = await generateText({
        model,
        system: `You are the ${subtask.workerRole}. Complete only the assigned subtask accurately and concisely.`,
        prompt: `Overall request:\n${input}\n\nAssigned subtask:\n${subtask.task}`,
      });

      return {
        id: subtask.id,
        workerRole: subtask.workerRole,
        task: subtask.task,
        output: result.text,
      };
    }),
  );

  // A final call merges the worker answers into one coherent response.
  const mergeResult = await generateText({
    model,
    system:
      "You are the final editor. Merge the worker results into one coherent answer. Remove repetition, preserve useful detail, and do not mention internal workers.",
    prompt: `Original request:\n${input}\n\nWorker results:\n${JSON.stringify(workerOutputs, null, 2)}`,
  });

  const planText = JSON.stringify(plan, null, 2);
  const workersText = workerOutputs
    .map(
      (worker) =>
        `${worker.id} - ${worker.workerRole}\nTask: ${worker.task}\nOutput: ${worker.output}`,
    )
    .join("\n\n");

  const sections = [
    { title: "Pattern", body: "Orchestrator-Worker" },
    { title: "Model", body: modelName },
    { title: "Original Input", body: input },
    { title: "Orchestrator Plan", body: planText },
    { title: "Worker Outputs", body: workersText },
    { title: "Merged Final Answer", body: mergeResult.text },
  ];

  sections.forEach(({ title, body }) => printSection(title, body));
  const logPath = await saveExecutionLog("04-orchestrator-worker", sections);
  printSection("Saved Log", logPath);

  return mergeResult.text;
}

if (isDirectRun(import.meta.url)) {
  runOrchestratorWorker(getCliInput(defaultInput)).catch(handleRunError);
}
