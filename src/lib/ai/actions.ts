"use server";

import { analyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { getUseWhatWeHaveModel, getWeeklyResetModel, isOpenAiConfigured } from "@/lib/ai/config";
import { createAiRequestLog, completeAiRequestLog, failAiRequestLog } from "@/lib/ai/logs";
import { buildUseWhatWeHavePrompt, buildWeeklyResetPrompt } from "@/lib/ai/prompts";
import { generateUseWhatWeHaveIdeas, generateWeeklyResetSummary } from "@/lib/ai/service";
import { getActiveHouseholdContext } from "@/lib/app/context";
import { assertAiUsageAvailable } from "@/lib/billing/gates";
import { getPantryItemsByIds } from "@/lib/pantry/queries";
import { assertWritesEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase/server";
import { getWeeklyResetData } from "@/lib/weekly-reset/queries";

export async function generateWeeklyResetSummaryAction() {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  await assertAiUsageAvailable(context);

  if (!isOpenAiConfigured()) {
    throw new Error("OpenAI is not configured yet. Add OPENAI_API_KEY to continue.");
  }

  const data = await getWeeklyResetData({
    householdId: context.household.id,
    householdName: context.household.name,
    currentUserId: context.user.id,
    timeZone: context.household.timezone,
    weekStartsOn: context.household.weekStartsOn,
  });

  const model = getWeeklyResetModel();
  const prompt = buildWeeklyResetPrompt(data);
  const requestId = await createAiRequestLog({
    householdId: context.household.id,
    userId: context.user.id,
    feature: "weekly_reset",
    model,
    requestExcerpt: prompt.requestExcerpt,
  });

  try {
    const result = await generateWeeklyResetSummary({
      model,
      instructions: prompt.instructions,
      input: prompt.input,
    });

    const supabase = await createClient();
    const { error } = await supabase.from("weekly_resets").upsert(
      {
        household_id: context.household.id,
        week_start: data.weekStartDate,
        status: "ready",
        ai_summary: result.data.summary,
        generated_at: new Date().toISOString(),
        generated_by: context.user.id,
      },
      {
        onConflict: "household_id,week_start",
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    await completeAiRequestLog({
      requestId,
      householdId: context.household.id,
      responseExcerpt: result.data.summary,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    });

    await captureServerEvent({
      distinctId: context.user.id,
      event: analyticsEvents.aiHelperUsed,
      properties: {
        household_id: context.household.id,
        feature: "weekly_reset",
        model,
      },
    });

    return {
      summary: result.data.summary,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    await failAiRequestLog({
      requestId,
      householdId: context.household.id,
      errorMessage: error instanceof Error ? error.message : "AI summary failed.",
    });

    throw error;
  }
}

export async function generateUseWhatWeHaveIdeasAction(args: { itemIds: string[] }) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  await assertAiUsageAvailable(context);

  if (!isOpenAiConfigured()) {
    throw new Error("OpenAI is not configured yet. Add OPENAI_API_KEY to continue.");
  }

  const selectedItems = await getPantryItemsByIds({
    householdId: context.household.id,
    timeZone: context.household.timezone,
    itemIds: args.itemIds,
  });

  if (selectedItems.length === 0) {
    throw new Error("Choose a few pantry or fridge items first.");
  }

  const model = getUseWhatWeHaveModel();
  const prompt = buildUseWhatWeHavePrompt(selectedItems);
  const requestId = await createAiRequestLog({
    householdId: context.household.id,
    userId: context.user.id,
    feature: "use_what_we_have",
    model,
    requestExcerpt: prompt.requestExcerpt,
  });

  try {
    const result = await generateUseWhatWeHaveIdeas({
      model,
      instructions: prompt.instructions,
      input: prompt.input,
    });

    await completeAiRequestLog({
      requestId,
      householdId: context.household.id,
      responseExcerpt: JSON.stringify(result.data),
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    });

    await captureServerEvent({
      distinctId: context.user.id,
      event: analyticsEvents.aiHelperUsed,
      properties: {
        household_id: context.household.id,
        feature: "use_what_we_have",
        item_count: selectedItems.length,
        model,
      },
    });

    return result.data;
  } catch (error) {
    await failAiRequestLog({
      requestId,
      householdId: context.household.id,
      errorMessage: error instanceof Error ? error.message : "AI pantry ideas failed.",
    });

    throw error;
  }
}
