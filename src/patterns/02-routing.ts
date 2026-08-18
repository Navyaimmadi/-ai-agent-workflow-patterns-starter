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

const defaultInput = "Explain why my TypeScript Promise is not returning a value.";

const routingSchema = z.object({
  route: z.enum(["technical", "creative", "general"]),
  reason: z.string(),
});

type Route = z.infer<typeof routingSchema>["route"];

const specialistInstructions: Record<Route, string> = {
  technical:
    "You are a patient programming tutor. Explain the technical answer step by step and include a small example.",
  creative:
    "You are a creative-writing assistant. Respond imaginatively while following the user's request.",
  general:
    "You are a clear general assistant. Give a concise, practical answer for a beginner.",
};

export async function runRouting(input = defaultInput): Promise<string> {
  const { model, modelName } = getModel();

  // The first call classifies the request into one allowed route.
  const routerResult = await generateText({
    model,
    system:
      "Classify the user's request. Choose technical for coding/engineering, creative for imaginative writing, and general for everything else.",
    prompt: input,
    output: Output.object({ schema: routingSchema }),
  });

  const decision = routerResult.output;

  // TypeScript performs the route selection by indexing this object.
  const selectedInstructions = specialistInstructions[decision.route];

  const specialistResult = await generateText({
    model,
    system: selectedInstructions,
    prompt: input,
  });

  const sections = [
    { title: "Pattern", body: "Routing" },
    { title: "Model", body: modelName },
    { title: "Original Input", body: input },
    { title: "Selected Route", body: decision.route },
    { title: "Router Reason", body: decision.reason },
    { title: "Specialist Response", body: specialistResult.text },
  ];

  sections.forEach(({ title, body }) => printSection(title, body));
  const logPath = await saveExecutionLog("02-routing", sections);
  printSection("Saved Log", logPath);

  return specialistResult.text;
}

if (isDirectRun(import.meta.url)) {
  runRouting(getCliInput(defaultInput)).catch(handleRunError);
}
