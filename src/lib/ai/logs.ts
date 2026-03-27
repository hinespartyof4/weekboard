import { createClient } from "@/lib/supabase/server";

type AiFeature = "weekly_reset" | "use_what_we_have" | "inventory_suggestion" | "general";

export async function createAiRequestLog(args: {
  householdId: string;
  userId: string;
  feature: AiFeature;
  model: string;
  requestExcerpt: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_requests")
    .insert({
      household_id: args.householdId,
      user_id: args.userId,
      feature: args.feature,
      status: "pending",
      model: args.model,
      request_excerpt: args.requestExcerpt.slice(0, 1000),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

export async function completeAiRequestLog(args: {
  requestId: string;
  householdId: string;
  responseExcerpt: string;
  promptTokens?: number;
  completionTokens?: number;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ai_requests")
    .update({
      status: "completed",
      response_excerpt: args.responseExcerpt.slice(0, 2000),
      prompt_tokens: args.promptTokens ?? 0,
      completion_tokens: args.completionTokens ?? 0,
      completed_at: new Date().toISOString(),
    })
    .eq("id", args.requestId)
    .eq("household_id", args.householdId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function failAiRequestLog(args: {
  requestId: string;
  householdId: string;
  errorMessage: string;
  promptTokens?: number;
  completionTokens?: number;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ai_requests")
    .update({
      status: "failed",
      error_message: args.errorMessage.slice(0, 1000),
      prompt_tokens: args.promptTokens ?? 0,
      completion_tokens: args.completionTokens ?? 0,
      completed_at: new Date().toISOString(),
    })
    .eq("id", args.requestId)
    .eq("household_id", args.householdId);

  if (error) {
    throw new Error(error.message);
  }
}
