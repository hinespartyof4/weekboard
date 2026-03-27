import { ensureDefaultShoppingList } from "@/lib/shopping/queries";
import { createClient } from "@/lib/supabase/server";

type ShoppingContext = {
  householdId: string;
  householdName: string;
  userId: string;
};

type RecurringSelectionRow = {
  id: string;
  name: string;
  category: string | null;
  default_quantity: number;
  unit: string | null;
  preferred_store: string | null;
};

type InventorySelectionRow = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
};

export async function addRecurringSelectionsToShoppingList(args: {
  context: ShoppingContext;
  items: RecurringSelectionRow[];
}) {
  if (args.items.length === 0) {
    return { createdCount: 0, skippedCount: 0 };
  }

  const supabase = await createClient();
  const list = await ensureDefaultShoppingList(args.context);
  const recurringIds = args.items.map((item) => item.id);

  const { data: existingNeededItems } = await supabase
    .from("shopping_items")
    .select("source_recurring_item_id")
    .eq("household_id", args.context.householdId)
    .eq("status", "needed")
    .in("source_recurring_item_id", recurringIds);

  const existingRecurringIds = new Set(
    (existingNeededItems ?? [])
      .map((item) => item.source_recurring_item_id)
      .filter((value): value is string => Boolean(value)),
  );

  const itemsToInsert = args.items
    .filter((item) => !existingRecurringIds.has(item.id))
    .map((item) => ({
      household_id: args.context.householdId,
      shopping_list_id: list.id,
      name: item.name,
      category: item.category,
      quantity: String(item.default_quantity),
      unit: item.unit,
      preferred_store: item.preferred_store,
      status: "needed" as const,
      added_by: args.context.userId,
      source_recurring_item_id: item.id,
    }));

  if (itemsToInsert.length > 0) {
    const { error } = await supabase.from("shopping_items").insert(itemsToInsert);

    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    createdCount: itemsToInsert.length,
    skippedCount: args.items.length - itemsToInsert.length,
  };
}

export async function addInventorySelectionsToShoppingList(args: {
  context: ShoppingContext;
  items: InventorySelectionRow[];
}) {
  if (args.items.length === 0) {
    return { createdCount: 0, skippedCount: 0 };
  }

  const supabase = await createClient();
  const list = await ensureDefaultShoppingList(args.context);
  const inventoryIds = args.items.map((item) => item.id);

  const { data: existingNeededItems } = await supabase
    .from("shopping_items")
    .select("source_inventory_item_id")
    .eq("household_id", args.context.householdId)
    .eq("status", "needed")
    .in("source_inventory_item_id", inventoryIds);

  const existingInventoryIds = new Set(
    (existingNeededItems ?? [])
      .map((item) => item.source_inventory_item_id)
      .filter((value): value is string => Boolean(value)),
  );

  const itemsToInsert = args.items
    .filter((item) => !existingInventoryIds.has(item.id))
    .map((item) => ({
      household_id: args.context.householdId,
      shopping_list_id: list.id,
      name: item.name,
      category: item.category,
      quantity: null,
      unit: item.unit,
      notes: "Restock from Weekly Reset",
      status: "needed" as const,
      added_by: args.context.userId,
      source_inventory_item_id: item.id,
    }));

  if (itemsToInsert.length > 0) {
    const { error } = await supabase.from("shopping_items").insert(itemsToInsert);

    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    createdCount: itemsToInsert.length,
    skippedCount: args.items.length - itemsToInsert.length,
  };
}
