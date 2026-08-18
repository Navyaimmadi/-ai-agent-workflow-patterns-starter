import { generateText } from "ai";
import { getModel } from "../lib/ai";
import {
  getCliInput,
  handleRunError,
  isDirectRun,
  printSection,
  saveExecutionLog,
} from "../lib/io";

const defaultInput =
  "AI assistants can help students learn, but their answers must be checked for accuracy and privacy risks.";

const workers = [
  {
    name: "Summary Worker",
    instruction: "Summarize the text in two concise bullet points.",
  },
  {
    name: "Risk Worker",
    instruction: "Identify the two most important risks or limitations in the text.",
  },
  {
    name: "Question Worker",
    instruction: "Write three useful follow-up questions about the text.",
  },
] as const;

export async function runParallelization(input = defaultInput): Promise<string> {
  const { model, modelName } = getModel();

  // map creates three promises. Promise.all starts/waits for them together.
  const results = await Promise.all(
    workers.map(async (worker) => {
      const result = await generateText({
        model,
        system: worker.instruction,
        prompt: input,
      });

      return { workerName: worker.name, output: result.text };
    }),
  );

  // Application code combines the independent worker results.
  const combinedOutput = results
    .map((result) => `## ${result.workerName}\n${result.output}`)
    .join("\n\n");

  const sections = [
    { title: "Pattern", body: "Parallelization" },
    { title: "Model", body: modelName },
    { title: "Original Input", body: input },
    { title: "Combined Parallel Results", body: combinedOutput },
  ];

  sections.forEach(({ title, body }) => printSection(title, body));
  const logPath = await saveExecutionLog("03-parallelization", sections);
  printSection("Saved Log", logPath);

  return combinedOutput;
}

if (isDirectRun(import.meta.url)) {
  runParallelization(getCliInput(defaultInput)).catch(handleRunError);
}
