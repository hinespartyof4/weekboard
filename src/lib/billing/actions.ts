"use server";

import { redirect } from "next/navigation";

import { getActiveHouseholdContext } from "@/lib/app/context";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { assertWritesEnabled } from "@/lib/preview-mode";
import { getPlanPriceId, isPaidPlan, resolvePlanTier, type WeekboardPlanTier } from "@/lib/billing/plans";
import { createStripeClient } from "@/lib/stripe/client";
import { getAppUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function assertCanManageBilling(role: "owner" | "admin" | "member") {
  if (role === "owner" || role === "admin") {
    return;
  }

  throw new Error("Only household owners and admins can manage billing.");
}

type CheckoutPlanTier = Exclude<WeekboardPlanTier, "free">;

export async function createCheckoutSessionAction(planTier: CheckoutPlanTier) {
  assertWritesEnabled();

  const context = await getActiveHouseholdContext();
  assertCanManageBilling(context.membership.role);

  const currentPlanTier = resolvePlanTier(context.subscription);

  if (currentPlanTier === planTier && isPaidPlan(currentPlanTier)) {
    throw new Error("This household is already on that plan.");
  }

  if (isPaidPlan(currentPlanTier)) {
    throw new Error("Use the billing portal to change an existing paid subscription.");
  }

  const stripe = createStripeClient();
  const supabase = await createClient();
  const { data: currentSubscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("household_id", context.household.id)
    .maybeSingle();

  let customerId = currentSubscription?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: context.user.email ?? undefined,
      name: context.household.name,
      metadata: {
        householdId: context.household.id,
      },
    });

    customerId = customer.id;

    await supabase
      .from("subscriptions")
      .upsert(
        {
          household_id: context.household.id,
          plan_tier: "free",
          status: "free",
          stripe_customer_id: customerId,
        },
        {
          onConflict: "household_id",
        },
      );
  }

  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: `${appUrl}/app/billing?checkout=success`,
    cancel_url: `${appUrl}/app/billing?checkout=cancelled`,
    allow_promotion_codes: true,
    line_items: [
      {
        price: getPlanPriceId(planTier),
        quantity: 1,
      },
    ],
    metadata: {
      householdId: context.household.id,
      planTier,
    },
    subscription_data: {
      metadata: {
        householdId: context.household.id,
        planTier,
      },
    },
  });

  if (!session.url) {
    throw new Error("Unable to create a Stripe checkout session.");
  }

  await captureServerEvent({
    distinctId: context.user.id,
    event: analyticsEvents.checkoutStarted,
    properties: {
      household_id: context.household.id,
      plan_tier: planTier,
    },
  });

  redirect(session.url);
}

export async function createBillingPortalSessionAction() {
  assertWritesEnabled();

  const context = await getActiveHouseholdContext();
  assertCanManageBilling(context.membership.role);

  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("household_id", context.household.id)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    throw new Error("No Stripe customer is connected yet for this household.");
  }

  const stripe = createStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${getAppUrl()}/app/billing`,
  });

  redirect(session.url);
}
