import { generateText } from "ai";
import { getModel } from "../lib/ai";
import {
  getCliInput,
  handleRunError,
  isDirectRun,
  printSection,
  saveExecutionLog,
} from "../lib/io";

const defaultInput = "Create a beginner lesson about what an AI agent workflow is.";

export async function runPromptChaining(input = defaultInput): Promise<string> {
  const { model, modelName } = getModel();

  // Call 1 turns the broad request into a structured outline.
  const outlineResult = await generateText({
    model,
    system:
      "You are an instructional designer. Create a short, accurate outline for a beginner.",
    prompt: input,
  });

  // Call 2 receives the text produced by Call 1. This handoff is the chain.
  const lessonResult = await generateText({
    model,
    system:
      "You are a patient teacher. Turn the supplied outline into a clear mini-lesson with one example.",
    prompt: `Original request:\n${input}\n\nOutline from step 1:\n${outlineResult.text}`,
  });

  const sections = [
    { title: "Pattern", body: "Prompt Chaining" },
    { title: "Model", body: modelName },
    { title: "Original Input", body: input },
    { title: "Step 1 - Outline", body: outlineResult.text },
    { title: "Step 2 - Final Lesson", body: lessonResult.text },
  ];

  sections.forEach(({ title, body }) => printSection(title, body));
  const logPath = await saveExecutionLog("01-prompt-chaining", sections);
  printSection("Saved Log", logPath);

  return lessonResult.text;
}

if (isDirectRun(import.meta.url)) {
  runPromptChaining(getCliInput(defaultInput)).catch(handleRunError);
}
