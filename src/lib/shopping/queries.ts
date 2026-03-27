import { createClient } from "@/lib/supabase/server";
import type { ActiveSubscription } from "@/lib/app/types";
import { getBarcodeFeatureEntitlement } from "@/lib/barcode/entitlements";
import { getPreviewShoppingBoardData } from "@/lib/preview/data";
import { isPreviewModeEnabled } from "@/lib/supabase/env";
import type { ShoppingBoardData, ShoppingItemRecord, ShoppingListRecord } from "@/lib/shopping/types";

type EnsureDefaultListArgs = {
  householdId: string;
  householdName: string;
  userId: string;
};

export async function ensureDefaultShoppingList({
  householdId,
  householdName,
  userId,
}: EnsureDefaultListArgs): Promise<ShoppingListRecord> {
  const supabase = await createClient();

  const { data: currentDefault } = await supabase
    .from("shopping_lists")
    .select("id, household_id, name, is_default")
    .eq("household_id", householdId)
    .eq("is_default", true)
    .eq("is_archived", false)
    .maybeSingle();

  if (currentDefault) {
    return {
      id: currentDefault.id,
      householdId: currentDefault.household_id,
      name: currentDefault.name,
      isDefault: currentDefault.is_default,
    };
  }

  const { data: firstList } = await supabase
    .from("shopping_lists")
    .select("id, household_id, name, is_default")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstList) {
    const { data: updatedList } = await supabase
      .from("shopping_lists")
      .update({ is_default: true })
      .eq("id", firstList.id)
      .eq("household_id", householdId)
      .select("id, household_id, name, is_default")
      .single();

    if (updatedList) {
      return {
        id: updatedList.id,
        householdId: updatedList.household_id,
        name: updatedList.name,
        isDefault: updatedList.is_default,
      };
    }
  }

  const { data: insertedList } = await supabase
    .from("shopping_lists")
    .insert({
      household_id: householdId,
      name: `${householdName} List`,
      is_default: true,
      created_by: userId,
    })
    .select("id, household_id, name, is_default")
    .single();

  if (!insertedList) {
    throw new Error("Unable to create a default shopping list.");
  }

  return {
    id: insertedList.id,
    householdId: insertedList.household_id,
    name: insertedList.name,
    isDefault: insertedList.is_default,
  };
}

function mapShoppingItem(item: {
  id: string;
  household_id: string;
  shopping_list_id: string;
  name: string;
  category: string | null;
  quantity: string | null;
  unit: string | null;
  priority: boolean;
  preferred_store: string | null;
  notes: string | null;
  status: "needed" | "purchased" | "archived";
  barcode: string | null;
  product_brand: string | null;
  product_image_url: string | null;
}): ShoppingItemRecord {
  return {
    id: item.id,
    householdId: item.household_id,
    shoppingListId: item.shopping_list_id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    priority: item.priority,
    preferredStore: item.preferred_store,
    notes: item.notes,
    status: item.status,
    barcode: item.barcode,
    productBrand: item.product_brand,
    productImageUrl: item.product_image_url,
  };
}

export async function getShoppingBoardData(args: {
  householdId: string;
  householdName: string;
  userId: string;
  subscription: ActiveSubscription | null;
}): Promise<ShoppingBoardData> {
  if (isPreviewModeEnabled()) {
    return getPreviewShoppingBoardData();
  }

  const list = await ensureDefaultShoppingList(args);
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("shopping_items")
    .select(
      "id, household_id, shopping_list_id, name, category, quantity, unit, priority, preferred_store, notes, status, barcode, product_brand, product_image_url",
    )
    .eq("household_id", args.householdId)
    .eq("shopping_list_id", list.id)
    .neq("status", "archived")
    .order("status", { ascending: true })
    .order("category", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    householdName: args.householdName,
    list,
    items: items?.map(mapShoppingItem) ?? [],
    barcodeScanning: getBarcodeFeatureEntitlement(args.subscription),
  };
}
