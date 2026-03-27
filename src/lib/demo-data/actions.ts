"use server";

import { revalidatePath } from "next/cache";

import { getActiveHouseholdContext } from "@/lib/app/context";
import { addDays, getTodayInTimeZone } from "@/lib/date";
import { assertWritesEnabled } from "@/lib/preview-mode";
import { ensureDefaultShoppingList } from "@/lib/shopping/queries";
import { createClient } from "@/lib/supabase/server";

export async function seedLocalDemoDataAction() {
  assertWritesEnabled();

  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seeding is only available in local development.");
  }

  const context = await getActiveHouseholdContext();
  const supabase = await createClient();
  const today = getTodayInTimeZone(context.household.timezone);

  const [shoppingCount, inventoryCount, recurringCount, taskCount] = await Promise.all([
    supabase
      .from("shopping_items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", context.household.id),
    supabase
      .from("inventory_items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", context.household.id)
      .eq("is_archived", false),
    supabase
      .from("recurring_items")
      .select("*", { count: "exact", head: true })
      .eq("household_id", context.household.id),
    supabase
      .from("household_tasks")
      .select("*", { count: "exact", head: true })
      .eq("household_id", context.household.id),
  ]);

  const shoppingList = await ensureDefaultShoppingList({
    householdId: context.household.id,
    householdName: context.household.name,
    userId: context.user.id,
  });

  if ((shoppingCount.count ?? 0) === 0) {
    await supabase.from("shopping_items").insert([
      {
        household_id: context.household.id,
        shopping_list_id: shoppingList.id,
        name: "Paper towels",
        category: "Household",
        quantity: "1",
        unit: "pack",
        preferred_store: "Target",
        priority: true,
        status: "needed",
        added_by: context.user.id,
      },
      {
        household_id: context.household.id,
        shopping_list_id: shoppingList.id,
        name: "Bananas",
        category: "Produce",
        quantity: "6",
        status: "needed",
        added_by: context.user.id,
      },
      {
        household_id: context.household.id,
        shopping_list_id: shoppingList.id,
        name: "Dishwasher tablets",
        category: "Cleaning",
        quantity: "1",
        unit: "box",
        status: "needed",
        added_by: context.user.id,
      },
    ]);
  }

  if ((inventoryCount.count ?? 0) === 0) {
    await supabase.from("inventory_items").insert([
      {
        household_id: context.household.id,
        created_by: context.user.id,
        name: "Eggs",
        category: "Dairy & eggs",
        storage_location: "fridge",
        quantity: 4,
        unit: "count",
        low_stock_threshold: 6,
        expiration_date: addDays(today, 5),
        status: "low",
      },
      {
        household_id: context.household.id,
        created_by: context.user.id,
        name: "Olive oil",
        category: "Pantry staples",
        storage_location: "pantry",
        quantity: 1,
        unit: "bottle",
        low_stock_threshold: 1,
        status: "low",
      },
      {
        household_id: context.household.id,
        created_by: context.user.id,
        name: "Laundry detergent",
        category: "Laundry",
        storage_location: "laundry",
        quantity: 2,
        unit: "bottle",
        low_stock_threshold: 1,
        status: "in_stock",
      },
    ]);
  }

  if ((recurringCount.count ?? 0) === 0) {
    await supabase.from("recurring_items").insert([
      {
        household_id: context.household.id,
        created_by: context.user.id,
        name: "Dog food",
        category: "Pets",
        default_quantity: 1,
        unit: "bag",
        frequency_type: "week",
        frequency_interval: 2,
        next_due_date: addDays(today, 3),
        preferred_store: "Chewy",
        auto_add_to_shopping_list: true,
        active: true,
      },
      {
        household_id: context.household.id,
        created_by: context.user.id,
        name: "Multivitamins",
        category: "Health",
        default_quantity: 1,
        unit: "bottle",
        frequency_type: "month",
        frequency_interval: 1,
        next_due_date: addDays(today, 6),
        preferred_store: "Costco",
        auto_add_to_shopping_list: false,
        active: true,
      },
    ]);
  }

  if ((taskCount.count ?? 0) === 0) {
    await supabase.from("household_tasks").insert([
      {
        household_id: context.household.id,
        created_by: context.user.id,
        title: "Take out the trash",
        due_date: today,
        status: "open",
        priority: "medium",
      },
      {
        household_id: context.household.id,
        created_by: context.user.id,
        title: "Laundry reset",
        due_date: addDays(today, 2),
        status: "open",
        priority: "low",
        recurrence_type: "week",
        recurrence_interval: 1,
      },
    ]);
  }

  revalidatePath("/app", "layout");
  revalidatePath("/app");
  revalidatePath("/app/shopping");
  revalidatePath("/app/pantry");
  revalidatePath("/app/recurring");
  revalidatePath("/app/tasks");
  revalidatePath("/app/weekly-reset");

  return {
    message: "Demo data added to this household.",
  };
}
