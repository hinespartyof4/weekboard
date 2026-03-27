import { getActiveHouseholdContext } from "@/lib/app/context";
import { getPlanDefinition, resolvePlanTier } from "@/lib/billing/plans";
import type { BillingPageData } from "@/lib/billing/types";
import { createClient } from "@/lib/supabase/server";

type SubscriptionRow = {
  plan_tier: "free" | "plus" | "home_pro";
  status:
    | "free"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "unpaid";
  billing_interval: "month" | "year";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export async function getBillingPageData(): Promise<BillingPageData> {
  const context = await getActiveHouseholdContext();

  if (context.isPreview) {
    return {
      householdName: context.household.name,
      isPreview: true,
      canManageBilling: true,
      currentPlanTier: resolvePlanTier(context.subscription),
      subscription: {
        planTier: "plus",
        status: "trialing",
        billingInterval: "month",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
      usage: {
        inventoryItems: 8,
        tasks: 6,
        recurringItems: 6,
        shoppingLists: 1,
        aiRequestsThisMonth: 4,
      },
    };
  }

  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
  ).toISOString();

  const [subscriptionResult, inventoryCountResult, taskCountResult, recurringCountResult, shoppingListsResult, aiUsageResult] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select(
          "plan_tier, status, billing_interval, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, cancel_at_period_end",
        )
        .eq("household_id", context.household.id)
        .maybeSingle(),
      supabase
        .from("inventory_items")
        .select("*", { count: "exact", head: true })
        .eq("household_id", context.household.id)
        .eq("is_archived", false),
      supabase
        .from("household_tasks")
        .select("*", { count: "exact", head: true })
        .eq("household_id", context.household.id),
      supabase
        .from("recurring_items")
        .select("*", { count: "exact", head: true })
        .eq("household_id", context.household.id),
      supabase
        .from("shopping_lists")
        .select("*", { count: "exact", head: true })
        .eq("household_id", context.household.id)
        .eq("is_archived", false),
      supabase
        .from("ai_requests")
        .select("*", { count: "exact", head: true })
        .eq("household_id", context.household.id)
        .gte("created_at", monthStart),
    ]);

  const subscriptionRow = (subscriptionResult.data ?? null) as SubscriptionRow | null;
  const currentPlanTier = resolvePlanTier(
    subscriptionRow
      ? {
          planTier: subscriptionRow.plan_tier,
          status: subscriptionRow.status,
        }
      : null,
  );

  return {
    householdName: context.household.name,
    isPreview: false,
    canManageBilling: context.membership.role === "owner" || context.membership.role === "admin",
    currentPlanTier,
    subscription: subscriptionRow
      ? {
          planTier: subscriptionRow.plan_tier,
          status: subscriptionRow.status,
          billingInterval: subscriptionRow.billing_interval,
          stripeCustomerId: subscriptionRow.stripe_customer_id,
          stripeSubscriptionId: subscriptionRow.stripe_subscription_id,
          currentPeriodStart: subscriptionRow.current_period_start,
          currentPeriodEnd: subscriptionRow.current_period_end,
          cancelAtPeriodEnd: subscriptionRow.cancel_at_period_end,
        }
      : {
          planTier: "free",
          status: "free",
          billingInterval: "month",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
    usage: {
      inventoryItems: inventoryCountResult.count ?? 0,
      tasks: taskCountResult.count ?? 0,
      recurringItems: recurringCountResult.count ?? 0,
      shoppingLists: shoppingListsResult.count ?? 0,
      aiRequestsThisMonth: aiUsageResult.count ?? 0,
    },
  };
}

export function getUsageMeterRows(data: BillingPageData) {
  const plan = getPlanDefinition(data.currentPlanTier);

  return [
    {
      label: "Inventory items",
      used: data.usage.inventoryItems,
      limit: plan.featuresConfig.inventoryItemLimit,
    },
    {
      label: "Tasks",
      used: data.usage.tasks,
      limit: plan.featuresConfig.taskLimit,
    },
    {
      label: "Recurring items",
      used: data.usage.recurringItems,
      limit: plan.featuresConfig.recurringItemLimit,
    },
    {
      label: "Shopping lists",
      used: data.usage.shoppingLists,
      limit: plan.featuresConfig.shoppingListLimit,
    },
    {
      label: "AI requests this month",
      used: data.usage.aiRequestsThisMonth,
      limit: plan.featuresConfig.aiRequestsPerMonth,
    },
  ];
}
