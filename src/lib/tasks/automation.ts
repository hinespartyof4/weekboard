import type { TaskRecurrenceType } from "@/lib/tasks/types";
import { addDays, addMonths } from "@/lib/recurring/automation";

export function advanceTaskDueDate(
  dueDate: string,
  recurrenceType: TaskRecurrenceType,
  recurrenceInterval: number,
) {
  switch (recurrenceType) {
    case "day":
      return addDays(dueDate, recurrenceInterval);
    case "week":
      return addDays(dueDate, recurrenceInterval * 7);
    case "month":
      return addMonths(dueDate, recurrenceInterval);
    default:
      return dueDate;
  }
}
