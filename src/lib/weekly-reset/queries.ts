import { createClient } from "@/lib/supabase/server";
import { addDays, formatShortDate, getTodayInTimeZone, getWeekStartDate } from "@/lib/date";
import { getPreviewWeeklyResetData } from "@/lib/preview/data";
import { isPreviewModeEnabled } from "@/lib/supabase/env";
import type { WeeklyResetData } from "@/lib/weekly-reset/types";

type InventoryRow = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  quantity: number;
  low_stock_threshold: number | null;
  storage_location: string;
  expiration_date: string | null;
};

type RecurringRow = {
  id: string;
  name: string;
  category: string | null;
  default_quantity: number;
  unit: string | null;
  preferred_store: string | null;
  next_due_date: string;
  frequency_type: "day" | "week" | "month";
  frequency_interval: number;
  auto_add_to_shopping_list: boolean;
};

type TaskRow = {
  id: string;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
};

type MemberRow = {
  user_id: string;
  display_name: string | null;
  role: "owner" | "admin" | "member";
};

function getMemberLabel(member: MemberRow, currentUserId: string) {
  if (member.user_id === currentUserId) {
    return "You";
  }

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

function formatFrequencyLabel(type: "day" | "week" | "month", interval: number) {
  const unit = interval === 1 ? type : `${type}s`;
  return `Every ${interval} ${unit}`;
}

export async function getWeeklyResetData(args: {
  householdId: string;
  householdName: string;
  currentUserId: string;
  timeZone: string;
  weekStartsOn: number;
}): Promise<WeeklyResetData> {
  if (isPreviewModeEnabled()) {
    return getPreviewWeeklyResetData(args.timeZone, args.weekStartsOn);
  }

  const supabase = await createClient();
  const today = getTodayInTimeZone(args.timeZone);
  const weekEnd = addDays(today, 6);
  const expiringSoonEnd = addDays(today, 7);
  const weekStartDate = getWeekStartDate(today, args.weekStartsOn);

  const [inventoryResult, recurringResult, tasksResult, membersResult, weeklyResetResult] = await Promise.all([
    supabase
      .from("inventory_items")
      .select(
        "id, name, category, unit, quantity, low_stock_threshold, storage_location, expiration_date",
      )
      .eq("household_id", args.householdId)
      .eq("is_archived", false)
      .order("storage_location", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("recurring_items")
      .select(
        "id, name, category, default_quantity, unit, preferred_store, next_due_date, frequency_type, frequency_interval, auto_add_to_shopping_list",
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
      .from("household_members")
      .select("user_id, display_name, role")
      .eq("household_id", args.householdId)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    supabase
      .from("weekly_resets")
      .select("ai_summary, generated_at")
      .eq("household_id", args.householdId)
      .eq("week_start", weekStartDate)
      .maybeSingle(),
  ]);

  const memberLabels = new Map(
    ((membersResult.data ?? []) as MemberRow[]).map((member) => [
      member.user_id,
      getMemberLabel(member, args.currentUserId),
    ]),
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
      category: item.category,
      unit: item.unit,
      quantity: Number(item.quantity),
      lowStockThreshold:
        item.low_stock_threshold === null ? null : Number(item.low_stock_threshold),
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
    category: item.category,
    defaultQuantity: Number(item.default_quantity),
    unit: item.unit,
    preferredStore: item.preferred_store,
    nextDueDate: item.next_due_date,
    frequencyLabel: formatFrequencyLabel(item.frequency_type, Number(item.frequency_interval)),
    autoAddToShoppingList: item.auto_add_to_shopping_list,
  }));

  const taskItems = ((tasksResult.data ?? []) as TaskRow[]).map((item) => ({
    id: item.id,
    title: item.title,
    assignedLabel: item.assigned_to ? (memberLabels.get(item.assigned_to) ?? "Household member") : null,
    dueDate: item.due_date,
    priority: item.priority,
  }));

  const lowStockItems = inventoryItems.filter((item) => item.isLowStock);
  const expiringSoonItems = inventoryItems.filter((item) => item.isExpiringSoon || item.isExpired);
  const overdueTasks = taskItems.filter((item) => item.dueDate !== null && item.dueDate < today);
  const dueThisWeekTasks = taskItems.filter(
    (item) => item.dueDate !== null && item.dueDate >= today && item.dueDate <= weekEnd,
  );

  return {
    householdId: args.householdId,
    householdName: args.householdName,
    weekStartDate,
    weekRangeLabel: `${formatShortDate(today)} - ${formatShortDate(weekEnd)}`,
    aiSummary: weeklyResetResult.data?.ai_summary ?? null,
    aiSummaryGeneratedAt: weeklyResetResult.data?.generated_at ?? null,
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
