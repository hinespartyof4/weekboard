import type { WeekboardPlanTier } from "@/lib/billing/plans";

export type BillingSubscriptionSnapshot = {
  planTier: WeekboardPlanTier;
  status:
    | "free"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "unpaid";
  billingInterval: "month" | "year";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type BillingUsageSnapshot = {
  inventoryItems: number;
  tasks: number;
  recurringItems: number;
  shoppingLists: number;
  aiRequestsThisMonth: number;
};

export type BillingPageData = {
  householdName: string;
  isPreview: boolean;
  canManageBilling: boolean;
  currentPlanTier: WeekboardPlanTier;
  subscription: BillingSubscriptionSnapshot | null;
  usage: BillingUsageSnapshot;
};
