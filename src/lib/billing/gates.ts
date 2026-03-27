import { createClient } from "@/lib/supabase/server";

import type { AppContextSnapshot } from "@/lib/app/types";
import { getBarcodeFeatureEntitlement } from "@/lib/barcode/entitlements";
import { getPlanDefinition, resolvePlanTier, type WeekboardPlanTier } from "@/lib/billing/plans";

type GatedRecord = "inventory_items" | "household_tasks" | "recurring_items" | "shopping_lists";

function getCurrentPlanTier(context: AppContextSnapshot): WeekboardPlanTier {
  return resolvePlanTier(context.subscription);
}

export function getPlanFeaturesForContext(context: AppContextSnapshot) {
  return getPlanDefinition(getCurrentPlanTier(context)).featuresConfig;
}

export function assertPlanFeature(
  context: AppContextSnapshot,
  feature:
    | "weeklyDigest"
    | "multipleShoppingLists"
    | "enhancedRecurringSupport"
    | "barcodeScanning",
) {
  const planTier = getCurrentPlanTier(context);
  const features = getPlanDefinition(planTier).featuresConfig;

  if (features[feature]) {
    return;
  }

  switch (feature) {
    case "weeklyDigest":
      throw new Error("Weekly email digest is available on Plus and Home Pro.");
    case "multipleShoppingLists":
      throw new Error("Multiple shopping lists are available on Home Pro.");
    case "enhancedRecurringSupport":
      throw new Error("Enhanced recurring automation is available on Home Pro.");
    case "barcodeScanning":
      throw new Error("Barcode scanning is included in Plus and Home Pro.");
    default:
      throw new Error("That feature is not available on the current plan.");
  }
}

export function assertBarcodeScanningAvailable(context: AppContextSnapshot) {
  const entitlement = getBarcodeFeatureEntitlement(context.subscription);

  if (entitlement.hasAccess) {
    return;
  }

  throw new Error("Barcode scanning is included in Plus and Home Pro.");
}

function getRecordLimit(context: AppContextSnapshot, table: GatedRecord) {
  const features = getPlanFeaturesForContext(context);

  switch (table) {
    case "inventory_items":
      return features.inventoryItemLimit;
    case "household_tasks":
      return features.taskLimit;
    case "recurring_items":
      return features.recurringItemLimit;
    case "shopping_lists":
      return features.shoppingListLimit;
    default:
      return null;
  }
}

function getLimitMessage(table: GatedRecord, limit: number) {
  switch (table) {
    case "inventory_items":
      return `Free includes up to ${limit} inventory items. Upgrade to Plus for unlimited pantry and household inventory.`;
    case "household_tasks":
      return `Free includes up to ${limit} tasks. Upgrade to Plus for unlimited shared task tracking.`;
    case "recurring_items":
      return `Free includes up to ${limit} recurring items. Upgrade to Plus for unlimited recurring household items.`;
    case "shopping_lists":
      return `This plan supports up to ${limit} shopping list${limit === 1 ? "" : "s"}. Upgrade to Home Pro for multiple lists.`;
    default:
      return "That action exceeds the current plan limit.";
  }
}

export async function assertCanCreateRecord(context: AppContextSnapshot, table: GatedRecord) {
  const limit = getRecordLimit(context, table);

  if (limit === null) {
    return;
  }

  const supabase = await createClient();
  let query = supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("household_id", context.household.id);

  if (table === "inventory_items") {
    query = query.eq("is_archived", false);
  }

  if (table === "shopping_lists") {
    query = query.eq("is_archived", false);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if ((count ?? 0) >= limit) {
    throw new Error(getLimitMessage(table, limit));
  }
}

export async function assertAiUsageAvailable(context: AppContextSnapshot) {
  const planTier = getCurrentPlanTier(context);
  const features = getPlanDefinition(planTier).featuresConfig;
  const supabase = await createClient();
  const now = new Date();
  const usageWindowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
  ).toISOString();

  const { count, error } = await supabase
    .from("ai_requests")
    .select("*", { count: "exact", head: true })
    .eq("household_id", context.household.id)
    .gte("created_at", usageWindowStart);

  if (error) {
    throw new Error(error.message);
  }

  if ((count ?? 0) >= features.aiRequestsPerMonth) {
    throw new Error(
      `${getPlanDefinition(planTier).name} includes up to ${features.aiRequestsPerMonth} AI requests per month. Upgrade for more AI usage.`,
    );
  }
}
