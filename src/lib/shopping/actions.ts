"use server";

import { revalidatePath } from "next/cache";

import { getActiveHouseholdContext } from "@/lib/app/context";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { assertBarcodeScanningAvailable } from "@/lib/billing/gates";
import { assertWritesEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultShoppingList } from "@/lib/shopping/queries";
import type { ShoppingItemInput, ShoppingItemStatus } from "@/lib/shopping/types";

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function createShoppingItemAction(input: ShoppingItemInput) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const supabase = await createClient();
  const list = await ensureDefaultShoppingList({
    householdId: context.household.id,
    householdName: context.household.name,
    userId: context.user.id,
  });

  const name = input.name.trim();

  if (!name) {
    throw new Error("Item name is required.");
  }

  if (input.barcode) {
    assertBarcodeScanningAvailable(context);
  }

  const { count: existingCount } = await supabase
    .from("shopping_items")
    .select("*", { count: "exact", head: true })
    .eq("household_id", context.household.id);

  const { error } = await supabase.from("shopping_items").insert({
    household_id: context.household.id,
    shopping_list_id: list.id,
    name,
    category: normalizeOptional(input.category),
    quantity: normalizeOptional(input.quantity),
    unit: normalizeOptional(input.unit),
    priority: Boolean(input.priority),
    preferred_store: normalizeOptional(input.preferredStore),
    notes: normalizeOptional(input.notes),
    status: input.status ?? "needed",
    barcode: normalizeOptional(input.barcode),
    product_brand: normalizeOptional(input.productBrand),
    product_image_url: normalizeOptional(input.productImageUrl),
    added_by: context.user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  if ((existingCount ?? 0) === 0) {
    await captureServerEvent({
      distinctId: context.user.id,
      event: analyticsEvents.firstShoppingItemAdded,
      properties: {
        household_id: context.household.id,
        shopping_list_id: list.id,
      },
    });
  }

  revalidatePath("/app/shopping");
  revalidatePath("/app");
}

export async function updateShoppingItemAction(
  itemId: string,
  input: ShoppingItemInput,
) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const supabase = await createClient();
  const name = input.name.trim();

  if (!name) {
    throw new Error("Item name is required.");
  }

  if (input.barcode) {
    assertBarcodeScanningAvailable(context);
  }

  const patch: Record<string, string | boolean | null> = {
    name,
    category: normalizeOptional(input.category),
    quantity: normalizeOptional(input.quantity),
    unit: normalizeOptional(input.unit),
    priority: Boolean(input.priority),
    preferred_store: normalizeOptional(input.preferredStore),
    notes: normalizeOptional(input.notes),
    status: input.status ?? "needed",
  };

  if (input.barcode !== undefined) {
    patch.barcode = normalizeOptional(input.barcode);
  }

  if (input.productBrand !== undefined) {
    patch.product_brand = normalizeOptional(input.productBrand);
  }

  if (input.productImageUrl !== undefined) {
    patch.product_image_url = normalizeOptional(input.productImageUrl);
  }

  const { error } = await supabase
    .from("shopping_items")
    .update(patch)
    .eq("id", itemId)
    .eq("household_id", context.household.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/shopping");
  revalidatePath("/app");
}

export async function toggleShoppingItemStatusAction(
  itemId: string,
  nextStatus: ShoppingItemStatus,
) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const supabase = await createClient();

  const patch =
    nextStatus === "purchased"
      ? {
          status: nextStatus,
          completed_at: new Date().toISOString(),
          completed_by: context.user.id,
        }
      : {
          status: nextStatus,
          completed_at: null,
          completed_by: null,
        };

  const { error } = await supabase
    .from("shopping_items")
    .update(patch)
    .eq("id", itemId)
    .eq("household_id", context.household.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/shopping");
  revalidatePath("/app");
}

export async function deleteShoppingItemAction(itemId: string) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("id", itemId)
    .eq("household_id", context.household.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/shopping");
  revalidatePath("/app");
}
