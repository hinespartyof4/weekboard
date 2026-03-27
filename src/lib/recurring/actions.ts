"use server";

import { revalidatePath } from "next/cache";

import { getActiveHouseholdContext } from "@/lib/app/context";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { assertCanCreateRecord, assertPlanFeature } from "@/lib/billing/gates";
import { assertWritesEnabled } from "@/lib/preview-mode";
import { advanceRecurringDueDate } from "@/lib/recurring/automation";
import { addRecurringSelectionsToShoppingList } from "@/lib/shopping/batch-add";
import { createClient } from "@/lib/supabase/server";
import type { RecurringItemInput } from "@/lib/recurring/types";

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseRequiredNumber(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid number greater than zero.`);
  }

  return parsed;
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
}

function toDateString({ year, month, day }: { year: number; month: number; day: number }) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getRecurringPatch(input: RecurringItemInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Item name is required.");
  }

  const defaultQuantity = parseRequiredNumber(input.defaultQuantity, "Default quantity");
  const frequencyInterval = parseRequiredNumber(input.frequencyInterval, "Frequency interval");
  const nextDueDate = input.nextDueDate.trim();

  if (!nextDueDate) {
    throw new Error("Next due date is required.");
  }

  return {
    name,
    category: normalizeOptional(input.category),
    default_quantity: defaultQuantity,
    unit: normalizeOptional(input.unit),
    frequency_type: input.frequencyType,
    frequency_interval: frequencyInterval,
    next_due_date: nextDueDate,
    preferred_store: normalizeOptional(input.preferredStore),
    auto_add_to_shopping_list: Boolean(input.autoAddToShoppingList),
    active: input.active ?? true,
  };
}

export async function createRecurringItemAction(input: RecurringItemInput) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  await assertCanCreateRecord(context, "recurring_items");
  const supabase = await createClient();
  const patch = getRecurringPatch(input);
  const { count: existingCount } = await supabase
    .from("recurring_items")
    .select("*", { count: "exact", head: true })
    .eq("household_id", context.household.id);

  const { error } = await supabase.from("recurring_items").insert({
    household_id: context.household.id,
    created_by: context.user.id,
    ...patch,
  });

  if (error) {
    throw new Error(error.message);
  }

  if ((existingCount ?? 0) === 0) {
    await captureServerEvent({
      distinctId: context.user.id,
      event: analyticsEvents.firstRecurringItemCreated,
      properties: {
        household_id: context.household.id,
        frequency_type: patch.frequency_type,
      },
    });
  }

  revalidatePath("/app/recurring");
  revalidatePath("/app");
}

export async function updateRecurringItemAction(itemId: string, input: RecurringItemInput) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const supabase = await createClient();
  const patch = getRecurringPatch(input);

  const { error } = await supabase
    .from("recurring_items")
    .update(patch)
    .eq("id", itemId)
    .eq("household_id", context.household.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/recurring");
  revalidatePath("/app");
}

export async function deleteRecurringItemAction(itemId: string) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("recurring_items")
    .delete()
    .eq("id", itemId)
    .eq("household_id", context.household.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/recurring");
  revalidatePath("/app");
}

type DueRecurringItemRow = {
  id: string;
  name: string;
  category: string | null;
  default_quantity: number;
  unit: string | null;
  preferred_store: string | null;
  frequency_type: "day" | "week" | "month";
  frequency_interval: number;
  next_due_date: string;
};

export async function generateDueRecurringShoppingItemsAction() {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  assertPlanFeature(context, "enhancedRecurringSupport");
  const supabase = await createClient();
  const today = toDateString(
    getDatePartsInTimeZone(new Date(), context.household.timezone),
  );

  const { data: dueItems } = await supabase
    .from("recurring_items")
    .select(
      "id, name, category, default_quantity, unit, preferred_store, frequency_type, frequency_interval, next_due_date",
    )
    .eq("household_id", context.household.id)
    .eq("active", true)
    .eq("auto_add_to_shopping_list", true)
    .lte("next_due_date", today)
    .order("next_due_date", { ascending: true });

  const recurringItems = (dueItems ?? []) as DueRecurringItemRow[];

  if (recurringItems.length === 0) {
    return {
      createdCount: 0,
      skippedCount: 0,
      advancedCount: 0,
      message: "No due recurring items are ready to add right now.",
    };
  }

  const addResult = await addRecurringSelectionsToShoppingList({
    context: {
      householdId: context.household.id,
      householdName: context.household.name,
      userId: context.user.id,
    },
    items: recurringItems,
  });

  const updateOperations = recurringItems.map((item) =>
    supabase
      .from("recurring_items")
      .update({
        next_due_date: advanceRecurringDueDate(
          item.next_due_date,
          item.frequency_type,
          item.frequency_interval,
        ),
      })
      .eq("id", item.id)
      .eq("household_id", context.household.id),
  );

  const updateResults = await Promise.all(updateOperations);
  const updateError = updateResults.find((result) => result.error);

  if (updateError?.error) {
    throw new Error(updateError.error.message);
  }

  const skippedCount = addResult.skippedCount;

  revalidatePath("/app/recurring");
  revalidatePath("/app/shopping");
  revalidatePath("/app/weekly-reset");
  revalidatePath("/app");

  return {
    createdCount: addResult.createdCount,
    skippedCount,
    advancedCount: recurringItems.length,
    message:
      addResult.createdCount > 0
        ? `Added ${addResult.createdCount} due item${addResult.createdCount === 1 ? "" : "s"} to shopping and moved the recurring schedule forward.`
        : `No new shopping items were needed, but ${recurringItems.length} recurring schedule${recurringItems.length === 1 ? "" : "s"} moved forward.`,
  };
}
