import OpenAI from "openai";

import { getOpenAiApiKey } from "@/lib/ai/config";

let openAiClient: OpenAI | null = null;

export function getOpenAiClient() {
  if (!openAiClient) {
    openAiClient = new OpenAI({
      apiKey: getOpenAiApiKey(),
    });
  }

  return openAiClient;
}
