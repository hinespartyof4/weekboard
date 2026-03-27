import type { RecurringItemRecord } from "@/lib/recurring/types";

export function isRecurringItemReadyForAutoAdd(item: RecurringItemRecord, today: string) {
  return item.active && item.autoAddToShoppingList && item.nextDueDate <= today;
}

export function addDays(dateString: string, days: number) {
  const base = new Date(`${dateString}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function addMonths(dateString: string, months: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
}

export function advanceRecurringDueDate(
  dueDate: string,
  frequencyType: "day" | "week" | "month",
  frequencyInterval: number,
) {
  switch (frequencyType) {
    case "day":
      return addDays(dueDate, frequencyInterval);
    case "week":
      return addDays(dueDate, frequencyInterval * 7);
    case "month":
      return addMonths(dueDate, frequencyInterval);
    default:
      return dueDate;
  }
}
