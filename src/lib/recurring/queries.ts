import { createClient } from "@/lib/supabase/server";
import { addDays, getTodayInTimeZone } from "@/lib/date";
import { getPreviewRecurringBoardData } from "@/lib/preview/data";
import { isPreviewModeEnabled } from "@/lib/supabase/env";
import type { FrequencyType, RecurringBoardData, RecurringItemRecord } from "@/lib/recurring/types";

type RecurringItemRow = {
  id: string;
  household_id: string;
  name: string;
  category: string | null;
  default_quantity: number;
  unit: string | null;
  frequency_type: FrequencyType;
  frequency_interval: number;
  next_due_date: string;
  preferred_store: string | null;
  auto_add_to_shopping_list: boolean;
  active: boolean;
};

function mapRecurringItem(
  item: RecurringItemRow,
  today: string,
  dueThisWeekEnd: string,
  dueSoonEnd: string,
): RecurringItemRecord {
  const isOverdue = item.active && item.next_due_date < today;
  const isDueThisWeek = item.active && item.next_due_date <= dueThisWeekEnd;
  const isDueSoon =
    item.active && item.next_due_date > dueThisWeekEnd && item.next_due_date <= dueSoonEnd;

  return {
    id: item.id,
    householdId: item.household_id,
    name: item.name,
    category: item.category,
    defaultQuantity: Number(item.default_quantity),
    unit: item.unit,
    frequencyType: item.frequency_type,
    frequencyInterval: Number(item.frequency_interval),
    nextDueDate: item.next_due_date,
    preferredStore: item.preferred_store,
    autoAddToShoppingList: item.auto_add_to_shopping_list,
    active: item.active,
    isDueThisWeek,
    isDueSoon,
    isOverdue,
  };
}

export async function getRecurringBoardData(args: {
  householdId: string;
  householdName: string;
  timeZone: string;
}): Promise<RecurringBoardData> {
  if (isPreviewModeEnabled()) {
    return getPreviewRecurringBoardData(args.timeZone);
  }

  const supabase = await createClient();
  const today = getTodayInTimeZone(args.timeZone);
  const dueThisWeekEnd = addDays(today, 6);
  const dueSoonEnd = addDays(today, 14);

  const { data: items } = await supabase
    .from("recurring_items")
    .select(
      "id, household_id, name, category, default_quantity, unit, frequency_type, frequency_interval, next_due_date, preferred_store, auto_add_to_shopping_list, active",
    )
    .eq("household_id", args.householdId)
    .order("active", { ascending: false })
    .order("next_due_date", { ascending: true })
    .order("name", { ascending: true });

  const records = (items ?? []).map((item) =>
    mapRecurringItem(item as RecurringItemRow, today, dueThisWeekEnd, dueSoonEnd),
  );

  return {
    householdId: args.householdId,
    householdName: args.householdName,
    items: records,
    summary: {
      totalItems: records.length,
      dueThisWeekCount: records.filter((item) => item.isDueThisWeek).length,
      dueSoonCount: records.filter((item) => item.isDueSoon).length,
      activeCount: records.filter((item) => item.active).length,
    },
  };
}
