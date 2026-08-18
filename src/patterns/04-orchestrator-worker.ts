import { generateText, Output } from "ai";
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

  // The orchestrator dynamically decides which subtasks are needed.
  const planResult = await generateText({
    model,
    system:
      "You are an orchestrator. Break the user's request into 2 to 4 independent subtasks that specialist workers can complete. Do not complete the task yourself.",
    prompt: input,
    output: Output.object({ schema: planSchema }),
  });

  const plan = planResult.output;

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
