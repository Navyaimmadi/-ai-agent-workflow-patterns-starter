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
  const structuredModel = wrapLanguageModel({
    model,
    middleware: extractJsonMiddleware(),
  });

  // The first call classifies the request into one allowed route.
  let routerResult;
  try {
    routerResult = await generateText({
      model: structuredModel,
      system:
        'Classify the user\'s request. Return only a JSON object with exactly two properties: "route" and "reason". The "route" value must be "technical" for coding/engineering, "creative" for imaginative writing, or "general" for everything else. The "reason" value must be a brief string. Do not use a property named "classification" and do not add Markdown or extra text.',
      prompt: input,
      output: Output.object({
        name: "routing_decision",
        description:
          "A routing decision with a route and a brief reason for that route.",
        schema: routingSchema,
      }),
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error(
        `Router returned invalid structured data. Raw response: ${error.text ?? "(no text returned)"}`,
      );
    }

    throw error;
  }

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
