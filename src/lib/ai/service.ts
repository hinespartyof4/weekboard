import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { getOpenAiClient } from "@/lib/ai/client";

const WeeklyResetSummarySchema = z.object({
  summary: z.string().min(1).max(500),
});

const UseWhatWeHaveIdeasSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        summary: z.string().min(1).max(260),
        uses: z.array(z.string().min(1).max(80)).min(1).max(6),
        missing_items: z.array(z.string().min(1).max(80)).max(6),
      }),
    )
    .min(3)
    .max(5),
});

type Usage = {
  promptTokens: number;
  completionTokens: number;
};

function getUsage(response: { usage?: { input_tokens?: number; output_tokens?: number } }): Usage {
  return {
    promptTokens: response.usage?.input_tokens ?? 0,
    completionTokens: response.usage?.output_tokens ?? 0,
  };
}

export async function generateWeeklyResetSummary(args: {
  model: string;
  instructions: string;
  input: string;
}) {
  const client = getOpenAiClient();
  const response = await client.responses.parse({
    model: args.model,
    instructions: args.instructions,
    input: args.input,
    max_output_tokens: 220,
    text: {
      format: zodTextFormat(WeeklyResetSummarySchema, "weekly_reset_summary"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("The weekly reset summary could not be parsed.");
  }

  return {
    data: response.output_parsed,
    ...getUsage(response),
  };
}

export async function generateUseWhatWeHaveIdeas(args: {
  model: string;
  instructions: string;
  input: string;
}) {
  const client = getOpenAiClient();
  const response = await client.responses.parse({
    model: args.model,
    instructions: args.instructions,
    input: args.input,
    max_output_tokens: 700,
    text: {
      format: zodTextFormat(UseWhatWeHaveIdeasSchema, "use_what_we_have_ideas"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("The pantry ideas could not be parsed.");
  }

  return {
    data: response.output_parsed,
    ...getUsage(response),
  };
}
