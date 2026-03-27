import type { WeeklyResetData } from "@/lib/weekly-reset/types";
import type { PantryItemRecord } from "@/lib/pantry/types";

function compactList(values: string[], limit = 6) {
  return values.filter(Boolean).slice(0, limit);
}

export function buildWeeklyResetPrompt(data: WeeklyResetData) {
  const payload = {
    household_name: data.householdName,
    week_range: data.weekRangeLabel,
    counts: data.summary,
    low_stock: compactList(
      data.lowStockItems.map(
        (item) =>
          `${item.name}${item.category ? ` (${item.category})` : ""}${item.unit ? ` - ${item.quantity} ${item.unit}` : ""}`,
      ),
    ),
    expiring_soon: compactList(
      data.expiringSoonItems.map(
        (item) =>
          `${item.name}${item.expirationDate ? ` - ${item.expirationDate}` : ""}${item.isExpired ? " (expired)" : ""}`,
      ),
    ),
    recurring_due: compactList(
      data.recurringDueItems.map(
        (item) =>
          `${item.name}${item.preferredStore ? ` - ${item.preferredStore}` : ""}${item.unit ? ` - ${item.defaultQuantity} ${item.unit}` : ""}`,
      ),
    ),
    overdue_tasks: compactList(
      data.overdueTasks.map(
        (task) =>
          `${task.title}${task.assignedLabel ? ` - ${task.assignedLabel}` : ""}${task.dueDate ? ` - ${task.dueDate}` : ""}`,
      ),
    ),
    due_this_week_tasks: compactList(
      data.dueThisWeekTasks.map(
        (task) =>
          `${task.title}${task.assignedLabel ? ` - ${task.assignedLabel}` : ""}${task.dueDate ? ` - ${task.dueDate}` : ""}`,
      ),
    ),
  };

  return {
    requestExcerpt: JSON.stringify(payload),
    instructions:
      "You write short weekly household summaries. Be concise, practical, and calm. Do not sound robotic, salesy, or overly cheerful. Focus on what needs attention this week in plain language.",
    input: `Create a short narrative summary for this weekly household reset.\nReturn JSON with one key: summary.\n\n${JSON.stringify(payload, null, 2)}`,
  };
}

export function buildUseWhatWeHavePrompt(items: PantryItemRecord[]) {
  const payload = {
    selected_items: items.slice(0, 12).map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      storage_location: item.storageLocation,
      expiration_date: item.expirationDate,
      notes: item.notes,
    })),
  };

  return {
    requestExcerpt: JSON.stringify(payload),
    instructions:
      "You suggest grounded meal or usage ideas for a busy household. Keep ideas practical, simple, and realistic. Avoid restaurant-style language, niche ingredients, or elaborate prep. Prefer everyday meals and sensible household uses.",
    input:
      "Using the selected household ingredients/items below, generate 3 to 5 practical meal or usage ideas. Return JSON with one key: ideas. Each idea must include title, summary, uses, and missing_items. missing_items should be a short list of only a few realistic items to buy when helpful.\n\n" +
      JSON.stringify(payload, null, 2),
  };
}
