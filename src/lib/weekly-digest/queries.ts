import { getAppUrl } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanDefinition, resolvePlanTier } from "@/lib/billing/plans";
import { addDays, formatShortDate, getTodayInTimeZone, getWeekStartDate } from "@/lib/date";
import type { WeeklyDigestData } from "@/lib/weekly-digest/types";

type DigestHouseholdRow = {
  id: string;
  name: string;
  timezone: string;
  week_starts_on: number;
  reset_day: number;
  weekly_digest_enabled: boolean;
  weekly_digest_recipient_email: string | null;
  is_archived: boolean;
};

type MemberRow = {
  user_id: string;
  role: "owner" | "admin" | "member";
  display_name: string | null;
  created_at: string;
};

type InventoryRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  low_stock_threshold: number | null;
  storage_location: string;
  expiration_date: string | null;
};

type RecurringRow = {
  id: string;
  name: string;
  default_quantity: number;
  unit: string | null;
  preferred_store: string | null;
  next_due_date: string;
  frequency_type: "day" | "week" | "month";
  frequency_interval: number;
};

type TaskRow = {
  id: string;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
};

function getWeekday(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`).getUTCDay();
}

function formatFrequencyLabel(type: "day" | "week" | "month", interval: number) {
  const unit = interval === 1 ? type : `${type}s`;
  return `Every ${interval} ${unit}`;
}

function getMemberLabel(member: MemberRow) {
  const displayName = member.display_name?.trim();

  if (displayName) {
    return displayName;
  }

  switch (member.role) {
    case "owner":
      return "Household owner";
    case "admin":
      return "Household admin";
    default:
      return "Household member";
  }
}

async function resolveRecipientEmail(args: {
  household: DigestHouseholdRow;
  members: MemberRow[];
}) {
  if (args.household.weekly_digest_recipient_email) {
    return args.household.weekly_digest_recipient_email;
  }

  const supabase = createAdminClient();
  const preferredMembers = [...args.members].sort((left, right) => {
    const roleRank = { owner: 0, admin: 1, member: 2 };
    return roleRank[left.role] - roleRank[right.role];
  });

  for (const member of preferredMembers) {
    const { data, error } = await supabase.auth.admin.getUserById(member.user_id);

    if (error || !data.user.email) {
      continue;
    }

    return data.user.email;
  }

  return null;
}

async function getAlreadyDeliveredWeekStart(householdId: string, weekStartDate: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("weekly_resets")
    .select("delivered_at")
    .eq("household_id", householdId)
    .eq("week_start", weekStartDate)
    .maybeSingle();

  return data?.delivered_at ?? null;
}

export async function getWeeklyDigestEligibleHouseholds() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("households")
    .select(
      "id, name, timezone, week_starts_on, reset_day, weekly_digest_enabled, weekly_digest_recipient_email, is_archived",
    )
    .eq("weekly_digest_enabled", true)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  const households = (data ?? []) as DigestHouseholdRow[];
  const dueHouseholds: Array<{
    household: DigestHouseholdRow;
    today: string;
    weekStartDate: string;
  }> = [];

  for (const household of households) {
    const today = getTodayInTimeZone(household.timezone);

    if (getWeekday(today) !== household.reset_day) {
      continue;
    }

    const weekStartDate = getWeekStartDate(today, household.week_starts_on);
    const deliveredAt = await getAlreadyDeliveredWeekStart(household.id, weekStartDate);

    if (deliveredAt) {
      continue;
    }

    dueHouseholds.push({
      household,
      today,
      weekStartDate,
    });
  }

  if (dueHouseholds.length === 0) {
    return [];
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("household_id, plan_tier, status")
    .in(
      "household_id",
      dueHouseholds.map((entry) => entry.household.id),
    );

  const subscriptionByHousehold = new Map(
    (subscriptions ?? []).map((row) => [
      row.household_id,
      resolvePlanTier({
        planTier: row.plan_tier,
        status: row.status,
      }),
    ]),
  );

  return dueHouseholds.filter((entry) =>
    getPlanDefinition(subscriptionByHousehold.get(entry.household.id) ?? "free")
      .featuresConfig.weeklyDigest,
  );
}

export async function getWeeklyDigestData(args: {
  householdId: string;
  householdName: string;
  timezone: string;
  weekStartsOn: number;
  resetDay: number;
  weekStartDate: string;
  recipientEmailOverride?: string | null;
}): Promise<WeeklyDigestData | null> {
  const supabase = createAdminClient();
  const today = getTodayInTimeZone(args.timezone);
  const weekEnd = addDays(today, 6);
  const expiringSoonEnd = addDays(today, 7);

  const [membersResult, inventoryResult, recurringResult, tasksResult, weeklyResetResult] =
    await Promise.all([
      supabase
        .from("household_members")
        .select("user_id, role, display_name, created_at")
        .eq("household_id", args.householdId)
        .eq("status", "active")
        .order("created_at", { ascending: true }),
      supabase
        .from("inventory_items")
        .select(
          "id, name, quantity, unit, low_stock_threshold, storage_location, expiration_date",
        )
        .eq("household_id", args.householdId)
        .eq("is_archived", false)
        .order("storage_location", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("recurring_items")
        .select(
          "id, name, default_quantity, unit, preferred_store, next_due_date, frequency_type, frequency_interval",
        )
        .eq("household_id", args.householdId)
        .eq("active", true)
        .lte("next_due_date", weekEnd)
        .order("next_due_date", { ascending: true }),
      supabase
        .from("household_tasks")
        .select("id, title, assigned_to, due_date, priority")
        .eq("household_id", args.householdId)
        .in("status", ["open", "in_progress"])
        .not("due_date", "is", null)
        .lte("due_date", weekEnd)
        .order("due_date", { ascending: true }),
      supabase
        .from("weekly_resets")
        .select("ai_summary")
        .eq("household_id", args.householdId)
        .eq("week_start", args.weekStartDate)
        .maybeSingle(),
    ]);

  const members = (membersResult.data ?? []) as MemberRow[];
  const recipientEmail = await resolveRecipientEmail({
    household: {
      id: args.householdId,
      name: args.householdName,
      timezone: args.timezone,
      week_starts_on: args.weekStartsOn,
      reset_day: args.resetDay,
      weekly_digest_enabled: true,
      weekly_digest_recipient_email: args.recipientEmailOverride ?? null,
      is_archived: false,
    },
    members,
  });

  if (!recipientEmail) {
    return null;
  }

  const memberLabels = new Map(
    members.map((member) => [member.user_id, getMemberLabel(member)]),
  );

  const inventoryItems = ((inventoryResult.data ?? []) as InventoryRow[]).map((item) => {
    const isLowStock =
      Number(item.quantity) === 0 ||
      (item.low_stock_threshold !== null &&
        Number(item.quantity) <= Number(item.low_stock_threshold));
    const isExpired = item.expiration_date !== null && item.expiration_date < today;
    const isExpiringSoon =
      item.expiration_date !== null &&
      item.expiration_date >= today &&
      item.expiration_date <= expiringSoonEnd;

    return {
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      storageLocation: item.storage_location,
      expirationDate: item.expiration_date,
      isLowStock,
      isExpiringSoon,
      isExpired,
    };
  });

  const recurringDueItems = ((recurringResult.data ?? []) as RecurringRow[]).map((item) => ({
    id: item.id,
    name: item.name,
    defaultQuantity: Number(item.default_quantity),
    unit: item.unit,
    preferredStore: item.preferred_store,
    nextDueDate: item.next_due_date,
    frequencyLabel: formatFrequencyLabel(item.frequency_type, Number(item.frequency_interval)),
  }));

  const taskItems = ((tasksResult.data ?? []) as TaskRow[]).map((item) => ({
    id: item.id,
    title: item.title,
    assignedLabel: item.assigned_to ? (memberLabels.get(item.assigned_to) ?? "Household member") : null,
    dueDate: item.due_date,
    priority: item.priority,
  }));

  const lowStockItems = inventoryItems.filter((item) => item.isLowStock).map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    storageLocation: item.storageLocation,
    expirationDate: item.expirationDate,
  }));
  const expiringSoonItems = inventoryItems
    .filter((item) => item.isExpiringSoon || item.isExpired)
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      storageLocation: item.storageLocation,
      expirationDate: item.expirationDate,
    }));
  const overdueTasks = taskItems.filter((item) => item.dueDate !== null && item.dueDate < today);
  const dueThisWeekTasks = taskItems.filter(
    (item) => item.dueDate !== null && item.dueDate >= today && item.dueDate <= weekEnd,
  );

  return {
    householdId: args.householdId,
    householdName: args.householdName,
    recipientEmail,
    weekStartDate: args.weekStartDate,
    weekRangeLabel: `${formatShortDate(today)} - ${formatShortDate(weekEnd)}`,
    resetDay: args.resetDay,
    appUrl: `${getAppUrl()}/app/weekly-reset`,
    aiSummary: weeklyResetResult.data?.ai_summary ?? null,
    summary: {
      lowStockCount: lowStockItems.length,
      expiringSoonCount: expiringSoonItems.length,
      recurringDueCount: recurringDueItems.length,
      overdueTasksCount: overdueTasks.length,
      dueThisWeekTasksCount: dueThisWeekTasks.length,
      totalNeedsAttention:
        lowStockItems.length +
        expiringSoonItems.length +
        recurringDueItems.length +
        overdueTasks.length +
        dueThisWeekTasks.length,
    },
    lowStockItems,
    expiringSoonItems,
    recurringDueItems,
    overdueTasks,
    dueThisWeekTasks,
  };
}

export async function markWeeklyDigestDelivered(args: {
  householdId: string;
  weekStartDate: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("weekly_resets").upsert(
    {
      household_id: args.householdId,
      week_start: args.weekStartDate,
      status: "sent",
      delivered_at: new Date().toISOString(),
    },
    {
      onConflict: "household_id,week_start",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}
