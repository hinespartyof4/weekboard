"use server";

import { revalidatePath } from "next/cache";

import { getActiveHouseholdContext } from "@/lib/app/context";
import { assertWritesEnabled } from "@/lib/preview-mode";
import { advanceRecurringDueDate } from "@/lib/recurring/automation";
import { addInventorySelectionsToShoppingList, addRecurringSelectionsToShoppingList } from "@/lib/shopping/batch-add";
import { createClient } from "@/lib/supabase/server";

export async function addWeeklyResetSelectionsToShoppingListAction(args: {
  inventoryItemIds: string[];
  recurringItemIds: string[];
}) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const supabase = await createClient();

  if (args.inventoryItemIds.length === 0 && args.recurringItemIds.length === 0) {
    return {
      inventoryCreatedCount: 0,
      recurringCreatedCount: 0,
      message: "Select something from the Weekly Reset before adding it to shopping.",
    };
  }

  const [inventoryResult, recurringResult] = await Promise.all([
    args.inventoryItemIds.length > 0
      ? supabase
          .from("inventory_items")
          .select("id, name, category, unit")
          .eq("household_id", context.household.id)
          .eq("is_archived", false)
          .in("id", args.inventoryItemIds)
      : Promise.resolve({ data: [] as never[], error: null }),
    args.recurringItemIds.length > 0
      ? supabase
          .from("recurring_items")
          .select(
            "id, name, category, default_quantity, unit, preferred_store, next_due_date, frequency_type, frequency_interval",
          )
          .eq("household_id", context.household.id)
          .eq("active", true)
          .in("id", args.recurringItemIds)
      : Promise.resolve({ data: [] as never[], error: null }),
  ]);

  if (inventoryResult.error) {
    throw new Error(inventoryResult.error.message);
  }

  if (recurringResult.error) {
    throw new Error(recurringResult.error.message);
  }

  const shoppingContext = {
    householdId: context.household.id,
    householdName: context.household.name,
    userId: context.user.id,
  };

  const [inventoryAddResult, recurringAddResult] = await Promise.all([
    addInventorySelectionsToShoppingList({
      context: shoppingContext,
      items: inventoryResult.data ?? [],
    }),
    addRecurringSelectionsToShoppingList({
      context: shoppingContext,
      items: (recurringResult.data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        default_quantity: item.default_quantity,
        unit: item.unit,
        preferred_store: item.preferred_store,
      })),
    }),
  ]);

  const recurringItems = recurringResult.data ?? [];

  if (recurringItems.length > 0) {
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
  }

  revalidatePath("/app/weekly-reset");
  revalidatePath("/app/shopping");
  revalidatePath("/app/recurring");
  revalidatePath("/app/pantry");
  revalidatePath("/app");

  return {
    inventoryCreatedCount: inventoryAddResult.createdCount,
    recurringCreatedCount: recurringAddResult.createdCount,
    message: `Added ${inventoryAddResult.createdCount + recurringAddResult.createdCount} item${inventoryAddResult.createdCount + recurringAddResult.createdCount === 1 ? "" : "s"} to shopping from this week’s reset.`,
  };
}
