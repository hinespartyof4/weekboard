import type {
  DashboardAttentionItem,
  DashboardSummary,
  DashboardSummaryCard,
} from "@/lib/app/types";
import { addDays, formatShortDate, getTodayInTimeZone } from "@/lib/date";
import { getPreviewDashboardSummary } from "@/lib/preview/data";
import { isPreviewModeEnabled } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function getCount<T extends { count: number | null }>(result: T) {
  return result.count ?? 0;
}

function formatQuantity(value: number | string | null, unit: string | null) {
  if (value === null) {
    return unit ?? "";
  }

  return unit ? `${value} ${unit}` : String(value);
}

function buildSummaryCards(args: {
  shoppingNeeded: number;
  shoppingLists: number;
  priorityItems: number;
  inventoryItems: number;
  lowStockItems: number;
  tasksDueThisWeek: number;
  overdueTasks: number;
  recurringDueSoon: number;
  recurringActive: number;
}): DashboardSummaryCard[] {
  return [
    {
      title: "Items on shopping list",
      value: args.shoppingNeeded,
      href: "/app/shopping",
      detail:
        args.shoppingNeeded > 0
          ? `${args.priorityItems} priority item${args.priorityItems === 1 ? "" : "s"} across ${args.shoppingLists} list${args.shoppingLists === 1 ? "" : "s"}`
          : "No active shopping items yet",
      emptyDetail: "Start a list for groceries, restocks, or the weekly run.",
    },
    {
      title: "Inventory items",
      value: args.inventoryItems,
      href: "/app/pantry",
      detail:
        args.inventoryItems > 0
          ? `${args.lowStockItems} low-stock item${args.lowStockItems === 1 ? "" : "s"} need attention`
          : "No pantry or household inventory tracked yet",
      emptyDetail: "Add a few staples to make the Weekly Reset more useful.",
    },
    {
      title: "Tasks due this week",
      value: args.tasksDueThisWeek,
      href: "/app/tasks",
      detail:
        args.tasksDueThisWeek > 0
          ? `${args.overdueTasks} overdue task${args.overdueTasks === 1 ? "" : "s"} also need a look`
          : args.overdueTasks > 0
            ? `${args.overdueTasks} overdue task${args.overdueTasks === 1 ? "" : "s"} still open`
            : "No task deadlines are coming up",
      emptyDetail: "Add a few shared chores to keep the week visible for everyone.",
    },
    {
      title: "Recurring due soon",
      value: args.recurringDueSoon,
      href: "/app/recurring",
      detail:
        args.recurringDueSoon > 0
          ? `${args.recurringActive} active recurring item${args.recurringActive === 1 ? "" : "s"} in rotation`
          : "Nothing is due in the next 7 days",
      emptyDetail: "Set up recurring essentials like paper towels, vitamins, or pet food.",
    },
  ];
}

function mapLowStockItem(item: {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  low_stock_threshold: number | null;
  storage_location: string;
}): DashboardAttentionItem {
  return {
    id: item.id,
    primary: item.name,
    secondary: `${item.storage_location} • ${formatQuantity(item.quantity, item.unit)} on hand${item.low_stock_threshold !== null ? ` • refill at ${formatQuantity(item.low_stock_threshold, item.unit)}` : ""}`,
  };
}

function buildExpirationSecondary(item: {
  expiration_date: string;
  storage_location: string;
}, today: string) {
  const label = item.expiration_date < today ? "Expired" : "Use by";
  return `${label} ${formatShortDate(item.expiration_date)} • ${item.storage_location}`;
}

function mapRecurringDueSoonItem(item: {
  id: string;
  name: string;
  next_due_date: string;
  preferred_store: string | null;
  frequency_type: "day" | "week" | "month";
  frequency_interval: number;
}): DashboardAttentionItem {
  const unit =
    item.frequency_interval === 1 ? item.frequency_type : `${item.frequency_type}s`;

  return {
    id: item.id,
    primary: item.name,
    secondary: `Due ${formatShortDate(item.next_due_date)} • Every ${item.frequency_interval} ${unit}${item.preferred_store ? ` • ${item.preferred_store}` : ""}`,
  };
}

function mapOverdueTaskItem(item: {
  id: string;
  title: string;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  assigned_label: string | null;
}): DashboardAttentionItem {
  return {
    id: item.id,
    primary: item.title,
    secondary: `${item.priority} priority${item.due_date ? ` • due ${formatShortDate(item.due_date)}` : ""}${item.assigned_label ? ` • ${item.assigned_label}` : ""}`,
  };
}

export async function getDashboardSummary(
  householdId: string,
  householdName: string,
  timeZone: string,
): Promise<DashboardSummary> {
  if (isPreviewModeEnabled()) {
    return getPreviewDashboardSummary(timeZone);
  }

  const supabase = await createClient();
  const today = getTodayInTimeZone(timeZone);
  const weekEnd = addDays(today, 6);
  const dueSoonEnd = addDays(today, 7);

  const [
    shoppingNeededResult,
    shoppingListsResult,
    priorityItemsResult,
    inventoryItemsResult,
    lowStockCountResult,
    lowStockItemsResult,
    expiringSoonItemsResult,
    tasksDueThisWeekResult,
    overdueTasksCountResult,
    overdueTasksResult,
    recurringDueSoonCountResult,
    recurringActiveResult,
    dueRecurringItemsResult,
    latestWeeklyResetResult,
  ] = await Promise.all([
    supabase
      .from("shopping_items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("status", "needed"),
    supabase
      .from("shopping_lists")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("is_archived", false),
    supabase
      .from("shopping_items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("status", "needed")
      .eq("priority", true),
    supabase
      .from("inventory_items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("is_archived", false),
    supabase
      .from("inventory_items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .in("status", ["low", "out_of_stock"]),
    supabase
      .from("inventory_items")
      .select("id, name, quantity, unit, low_stock_threshold, storage_location")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .in("status", ["low", "out_of_stock"])
      .order("quantity", { ascending: true })
      .limit(4),
    supabase
      .from("inventory_items")
      .select("id, name, expiration_date, storage_location")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .not("expiration_date", "is", null)
      .lte("expiration_date", dueSoonEnd)
      .order("expiration_date", { ascending: true })
      .limit(4),
    supabase
      .from("household_tasks")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .in("status", ["open", "in_progress"])
      .gte("due_date", today)
      .lte("due_date", weekEnd),
    supabase
      .from("household_tasks")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .in("status", ["open", "in_progress"])
      .lt("due_date", today),
    supabase
      .from("household_tasks")
      .select("id, title, due_date, priority, assigned_to")
      .eq("household_id", householdId)
      .in("status", ["open", "in_progress"])
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(4),
    supabase
      .from("recurring_items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("active", true)
      .lte("next_due_date", dueSoonEnd),
    supabase
      .from("recurring_items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("active", true),
    supabase
      .from("recurring_items")
      .select("id, name, next_due_date, preferred_store, frequency_type, frequency_interval")
      .eq("household_id", householdId)
      .eq("active", true)
      .lte("next_due_date", dueSoonEnd)
      .order("next_due_date", { ascending: true })
      .limit(4),
    supabase
      .from("weekly_resets")
      .select("week_start, status")
      .eq("household_id", householdId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const overdueAssignments = (overdueTasksResult.data ?? [])
    .map((task) => task.assigned_to)
    .filter((value): value is string => Boolean(value));

  let assignmentLabels = new Map<string, string>();

  if (overdueAssignments.length > 0) {
    const { data: members } = await supabase
      .from("household_members")
      .select("user_id, display_name")
      .eq("household_id", householdId)
      .in("user_id", overdueAssignments);

    assignmentLabels = new Map(
      (members ?? []).map((member) => [
        member.user_id,
        member.display_name?.trim() || "Household member",
      ]),
    );
  }

  const shoppingNeeded = getCount(shoppingNeededResult);
  const shoppingLists = getCount(shoppingListsResult);
  const priorityItems = getCount(priorityItemsResult);
  const inventoryItems = getCount(inventoryItemsResult);
  const lowStockItemsCount = getCount(lowStockCountResult);
  const tasksDueThisWeek = getCount(tasksDueThisWeekResult);
  const overdueTasks = getCount(overdueTasksCountResult);
  const recurringDueSoon = getCount(recurringDueSoonCountResult);
  const recurringActive = getCount(recurringActiveResult);
  const totalItemsTracked =
    shoppingNeeded + inventoryItems + tasksDueThisWeek + overdueTasks + recurringActive;

  return {
    householdName,
    totalItemsTracked,
    hasAnyData:
      shoppingNeeded > 0 ||
      shoppingLists > 0 ||
      inventoryItems > 0 ||
      tasksDueThisWeek > 0 ||
      overdueTasks > 0 ||
      recurringActive > 0 ||
      Boolean(latestWeeklyResetResult.data),
    latestWeeklyReset: latestWeeklyResetResult.data
      ? {
          weekStart: latestWeeklyResetResult.data.week_start,
          status: latestWeeklyResetResult.data.status,
        }
      : null,
    cards: buildSummaryCards({
      shoppingNeeded,
      shoppingLists,
      priorityItems,
      inventoryItems,
      lowStockItems: lowStockItemsCount,
      tasksDueThisWeek,
      overdueTasks,
      recurringDueSoon,
      recurringActive,
    }),
    lowStockItems: (lowStockItemsResult.data ?? []).map((item) =>
      mapLowStockItem(item),
    ),
    expiringSoonItems: (expiringSoonItemsResult.data ?? []).map((item) => ({
      id: item.id,
      primary: item.name,
      secondary: buildExpirationSecondary(item, today),
    })),
    overdueTasks: (overdueTasksResult.data ?? []).map((item) =>
      mapOverdueTaskItem({
        id: item.id,
        title: item.title,
        due_date: item.due_date,
        priority: item.priority,
        assigned_label: item.assigned_to ? assignmentLabels.get(item.assigned_to) ?? null : null,
      }),
    ),
    dueRecurringItems: (dueRecurringItemsResult.data ?? []).map((item) =>
      mapRecurringDueSoonItem(item),
    ),
  };
}
