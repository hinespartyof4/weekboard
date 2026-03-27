import type { User } from "@supabase/supabase-js";

export type ActiveMembership = {
  id: string;
  householdId: string;
  role: "owner" | "admin" | "member";
  status: "active" | "paused" | "removed";
};

export type ActiveHousehold = {
  id: string;
  name: string;
  timezone: string;
  weekStartsOn: number;
  resetDay: number;
};

export type ActiveSubscription = {
  planTier: "free" | "plus" | "home_pro";
  status:
    | "free"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "unpaid";
};

export type AppContextSnapshot = {
  user: User;
  household: ActiveHousehold;
  membership: ActiveMembership;
  subscription: ActiveSubscription | null;
  memberCount: number;
  isPreview: boolean;
};

export type DashboardSummaryCard = {
  title: string;
  value: number;
  href: string;
  detail: string;
  emptyDetail: string;
};

export type DashboardAttentionItem = {
  id: string;
  primary: string;
  secondary: string;
};

export type DashboardSummary = {
  cards: DashboardSummaryCard[];
  hasAnyData: boolean;
  householdName: string;
  totalItemsTracked: number;
  latestWeeklyReset: {
    weekStart: string;
    status: "draft" | "ready" | "sent" | "archived";
  } | null;
  overdueTasks: DashboardAttentionItem[];
  lowStockItems: DashboardAttentionItem[];
  expiringSoonItems: DashboardAttentionItem[];
  dueRecurringItems: DashboardAttentionItem[];
};
