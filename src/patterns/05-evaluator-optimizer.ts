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
  "Explain prompt chaining to a beginner in under 130 words and include one concrete example.";

const qualityThreshold = 8;
const maximumEvaluations = 3;

const evaluationSchema = z.object({
  score: z.number().int().min(1).max(10),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});

export async function runEvaluatorOptimizer(input = defaultInput): Promise<string> {
  const { model, modelName } = getModel();
  const history: string[] = [];

  // First create an initial draft.
  const firstDraftResult = await generateText({
    model,
    system: "You are a clear technical writer for complete beginners.",
    prompt: input,
  });

  let draft = firstDraftResult.text;

  // The maximum prevents an infinite feedback loop.
  for (let evaluationNumber = 1; evaluationNumber <= maximumEvaluations; evaluationNumber += 1) {
    const evaluationResult = await generateText({
      model,
      system:
        "You are a strict evaluator. Score the draft from 1 to 10 for correctness, clarity, instruction-following, and usefulness. Give specific feedback.",
      prompt: `User request:\n${input}\n\nDraft to evaluate:\n${draft}`,
      output: Output.object({ schema: evaluationSchema }),
    });

    const evaluation = evaluationResult.output;
    history.push(
      `Evaluation ${evaluationNumber}\nDraft:\n${draft}\n\nEvaluation:\n${JSON.stringify(evaluation, null, 2)}`,
    );

    // TypeScript, not the LLM, decides whether the workflow stops.
    if (evaluation.score >= qualityThreshold) {
      break;
    }

    // Do not request another revision if no evaluation slot remains.
    if (evaluationNumber === maximumEvaluations) {
      break;
    }

    const revisionResult = await generateText({
      model,
      system:
        "You are an optimizer. Revise the draft using the evaluator feedback while still following the original request. Return only the improved draft.",
      prompt: `Original request:\n${input}\n\nCurrent draft:\n${draft}\n\nEvaluator feedback:\n${JSON.stringify(evaluation, null, 2)}`,
    });

    draft = revisionResult.text;
  }

  const sections = [
    { title: "Pattern", body: "Evaluator-Optimizer" },
    { title: "Model", body: modelName },
    { title: "Original Input", body: input },
    { title: "Quality Threshold", body: String(qualityThreshold) },
    { title: "Evaluation History", body: history.join("\n\n---\n\n") },
    { title: "Final Draft", body: draft },
  ];

  sections.forEach(({ title, body }) => printSection(title, body));
  const logPath = await saveExecutionLog("05-evaluator-optimizer", sections);
  printSection("Saved Log", logPath);

  return draft;
}

if (isDirectRun(import.meta.url)) {
  runEvaluatorOptimizer(getCliInput(defaultInput)).catch(handleRunError);
}
