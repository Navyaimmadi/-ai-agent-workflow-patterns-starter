import "dotenv/config";
import { createOpenAI } from "@ai-sdk/openai";

const placeholderKey = "replace_with_your_sharedllm_api_key";
const defaultBaseURL = "https://api.sharedllm.com/openai/v1";

/**
 * Creates the AI SDK model connection used by every workflow pattern.
 * Keeping this in one file prevents us from repeating setup code five times.
 */
export function getModel() {
  const apiKey = process.env.SHAREDLLM_API_KEY?.trim();

  if (!apiKey || apiKey === placeholderKey) {
    throw new Error(
      "SHAREDLLM_API_KEY is missing. Add your real SharedLLM key to .env.",
    );
  }

  const baseURL = process.env.SHAREDLLM_BASE_URL?.trim() || defaultBaseURL;
  const modelName = process.env.MODEL_NAME?.trim() || "gpt-oss:20b";
  const fetchWithoutProviderAuthorization: typeof fetch = (input, init) => {
    const headers = new Headers(init?.headers);
    headers.delete("authorization");

    return fetch(input, { ...init, headers });
  };
  const sharedLLM = createOpenAI({
    name: "sharedllm",
    baseURL,
    // SharedLLM authenticates with X-SharedLLM-Key. The AI SDK still requires
    // a non-empty provider API key, but SharedLLM does not use this value.
    apiKey: "unused",
    headers: {
      "X-SharedLLM-Key": apiKey,
    },
    fetch: fetchWithoutProviderAuthorization,
  });

  return {
    model: sharedLLM.chat(modelName),
    modelName,
  };
}
