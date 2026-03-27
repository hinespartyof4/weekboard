import type Stripe from "stripe";

import { analyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanTierFromPriceId } from "@/lib/billing/plans";

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "free" | "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "paused":
      return "past_due";
    default:
      return "free";
  }
}

async function findHouseholdIdByStripeSubscriptionId(stripeSubscriptionId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("household_id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  return data?.household_id ?? null;
}

export async function syncStripeSubscriptionToDatabase(
  subscription: Stripe.Subscription,
  householdIdOverride?: string | null,
  customerIdOverride?: string | null,
) {
  const supabase = createAdminClient();
  const subscriptionItem = subscription.items.data[0];
  const householdId =
    householdIdOverride ??
    subscription.metadata.householdId ??
    (await findHouseholdIdByStripeSubscriptionId(subscription.id));

  if (!householdId) {
    throw new Error("Unable to resolve household for Stripe subscription sync.");
  }

  const planTier =
    (subscription.metadata.planTier as "plus" | "home_pro" | undefined) ??
    resolvePlanTierFromPriceId(subscriptionItem?.price.id) ??
    "free";
  const nextStatus = mapStripeSubscriptionStatus(subscription.status);
  const currentPeriodStart = subscriptionItem?.current_period_start ?? null;
  const currentPeriodEnd = subscriptionItem?.current_period_end ?? null;
  const { data: previousSubscription } = await supabase
    .from("subscriptions")
    .select("status, plan_tier")
    .eq("household_id", householdId)
    .maybeSingle();

  const { error } = await supabase.from("subscriptions").upsert(
    {
      household_id: householdId,
      plan_tier: planTier,
      status: nextStatus,
      billing_interval:
        subscriptionItem?.price.recurring?.interval === "year" ? "year" : "month",
      stripe_customer_id:
        customerIdOverride ??
        (typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id) ??
        null,
      stripe_subscription_id: subscription.id,
      current_period_start: currentPeriodStart
        ? new Date(currentPeriodStart * 1000).toISOString()
        : null,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    },
    {
      onConflict: "household_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  const previousWasActive =
    previousSubscription?.status === "active" || previousSubscription?.status === "trialing";
  const nextIsActive = nextStatus === "active" || nextStatus === "trialing";

  if (nextIsActive && planTier !== "free" && (!previousWasActive || previousSubscription?.plan_tier !== planTier)) {
    await captureServerEvent({
      distinctId: `household:${householdId}`,
      event: analyticsEvents.subscriptionActivated,
      properties: {
        household_id: householdId,
        plan_tier: planTier,
        status: nextStatus,
      },
    });
  }
}
