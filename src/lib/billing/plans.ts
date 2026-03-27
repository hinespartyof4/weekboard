import type { ActiveSubscription } from "@/lib/app/types";

export type WeekboardPlanTier = "free" | "plus" | "home_pro";

export type PlanFeatures = {
  inventoryItemLimit: number | null;
  taskLimit: number | null;
  recurringItemLimit: number | null;
  shoppingListLimit: number | null;
  aiRequestsPerMonth: number;
  weeklyDigest: boolean;
  multipleShoppingLists: boolean;
  enhancedRecurringSupport: boolean;
  barcodeScanning: boolean;
};

export type WeekboardPlanDefinition = {
  tier: WeekboardPlanTier;
  name: string;
  priceLabel: string;
  monthlyPrice: number;
  description: string;
  highlight: string;
  featured: boolean;
  features: string[];
  stripePriceIdEnv?: string;
  featuresConfig: PlanFeatures;
};

export const weekboardPlans: WeekboardPlanDefinition[] = [
  {
    tier: "free",
    name: "Free",
    priceLabel: "$0",
    monthlyPrice: 0,
    description: "A shared starter space for staying on top of household basics.",
    highlight: "Best for getting Weekboard into your routine.",
    featured: false,
    features: [
      "25 inventory items",
      "30 tasks",
      "12 recurring items",
      "10 AI requests per month",
      "1 shopping list",
    ],
    featuresConfig: {
      inventoryItemLimit: 25,
      taskLimit: 30,
      recurringItemLimit: 12,
      shoppingListLimit: 1,
      aiRequestsPerMonth: 10,
      weeklyDigest: false,
      multipleShoppingLists: false,
      enhancedRecurringSupport: false,
      barcodeScanning: false,
    },
  },
  {
    tier: "plus",
    name: "Plus",
    priceLabel: "$12",
    monthlyPrice: 12,
    description: "Unlimited day-to-day coordination for a busy home.",
    highlight: "Unlock the full weekly household rhythm.",
    featured: true,
    features: [
      "Unlimited inventory, tasks, and recurring items",
      "Weekly email digest",
      "Basic AI assistance",
      "1 shared shopping list",
      "Mobile barcode scanning",
    ],
    stripePriceIdEnv: "STRIPE_PRICE_PLUS_MONTHLY",
    featuresConfig: {
      inventoryItemLimit: null,
      taskLimit: null,
      recurringItemLimit: null,
      shoppingListLimit: 1,
      aiRequestsPerMonth: 60,
      weeklyDigest: true,
      multipleShoppingLists: false,
      enhancedRecurringSupport: false,
      barcodeScanning: true,
    },
  },
  {
    tier: "home_pro",
    name: "Home Pro",
    priceLabel: "$24",
    monthlyPrice: 24,
    description: "For high-traffic households that want deeper automation and control.",
    highlight: "Designed for the fullest Weekboard experience.",
    featured: false,
    features: [
      "Everything in Plus",
      "Multiple shopping lists",
      "Higher AI usage",
      "Enhanced recurring automation",
      "Mobile barcode scanning",
    ],
    stripePriceIdEnv: "STRIPE_PRICE_HOME_PRO_MONTHLY",
    featuresConfig: {
      inventoryItemLimit: null,
      taskLimit: null,
      recurringItemLimit: null,
      shoppingListLimit: null,
      aiRequestsPerMonth: 150,
      weeklyDigest: true,
      multipleShoppingLists: true,
      enhancedRecurringSupport: true,
      barcodeScanning: true,
    },
  },
];

const paidStatuses = new Set<ActiveSubscription["status"]>([
  "trialing",
  "active",
  "past_due",
]);

export function getPlanDefinition(tier: WeekboardPlanTier) {
  const match = weekboardPlans.find((plan) => plan.tier === tier);

  if (!match) {
    throw new Error(`Unknown plan tier: ${tier}`);
  }

  return match;
}

export function resolvePlanTier(
  subscription: ActiveSubscription | null | undefined,
): WeekboardPlanTier {
  if (!subscription) {
    return "free";
  }

  if (!paidStatuses.has(subscription.status)) {
    return "free";
  }

  return subscription.planTier;
}

export function isPaidPlan(tier: WeekboardPlanTier) {
  return tier === "plus" || tier === "home_pro";
}

export function getPlanPriceId(tier: Exclude<WeekboardPlanTier, "free">) {
  const definition = getPlanDefinition(tier);
  const envKey = definition.stripePriceIdEnv;

  if (!envKey) {
    throw new Error(`No Stripe price env key configured for ${tier}.`);
  }

  const priceId = process.env[envKey];

  if (!priceId) {
    throw new Error(`Missing ${envKey}.`);
  }

  return priceId;
}

export function resolvePlanTierFromPriceId(priceId: string | null | undefined) {
  if (!priceId) {
    return null;
  }

  const matched = weekboardPlans.find((plan) => {
    if (!plan.stripePriceIdEnv) {
      return false;
    }

    return process.env[plan.stripePriceIdEnv] === priceId;
  });

  return matched?.tier ?? null;
}
