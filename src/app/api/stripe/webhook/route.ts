import { NextResponse } from "next/server";

import { syncStripeSubscriptionToDatabase } from "@/lib/billing/sync";
import { createStripeClient, isStripeConfigured } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing Stripe webhook secret or signature." },
      { status: 400 },
    );
  }

  const body = await request.text();
  const stripe = createStripeClient();

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id,
          );

          await syncStripeSubscriptionToDatabase(
            subscription,
            session.metadata?.householdId ?? null,
            typeof session.customer === "string" ? session.customer : session.customer?.id,
          );
        }

        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncStripeSubscriptionToDatabase(event.data.object);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe sync failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
