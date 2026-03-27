"use server";

import { revalidatePath } from "next/cache";

import { getActiveHouseholdContext } from "@/lib/app/context";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { assertBarcodeScanningAvailable, assertCanCreateRecord } from "@/lib/billing/gates";
import { assertWritesEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase/server";
import type { PantryItemInput } from "@/lib/pantry/types";

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseDecimal(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number.`);
  }

  return parsed;
}

function parseOptionalDecimal(value?: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error("Low stock threshold must be a valid non-negative number.");
  }

  return parsed;
}

function resolveInventoryStatus(quantity: number, threshold: number | null) {
  if (quantity === 0) {
    return "out_of_stock" as const;
  }

  if (threshold !== null && quantity <= threshold) {
    return "low" as const;
  }

  return "in_stock" as const;
}

function getInventoryPatch(input: PantryItemInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Item name is required.");
  }

  const quantity = parseDecimal(input.quantity, "Quantity");
  const lowStockThreshold = parseOptionalDecimal(input.lowStockThreshold);

  return {
    name,
    category: normalizeOptional(input.category),
    storage_location: input.storageLocation,
    quantity,
    unit: normalizeOptional(input.unit),
    low_stock_threshold: lowStockThreshold,
    expiration_date: normalizeOptional(input.expirationDate),
    notes: normalizeOptional(input.notes),
    status: resolveInventoryStatus(quantity, lowStockThreshold),
  };
}

export async function createInventoryItemAction(input: PantryItemInput) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  await assertCanCreateRecord(context, "inventory_items");
  if (input.barcode) {
    assertBarcodeScanningAvailable(context);
  }
  const supabase = await createClient();
  const patch = getInventoryPatch(input);
  const { count: existingCount } = await supabase
    .from("inventory_items")
    .select("*", { count: "exact", head: true })
    .eq("household_id", context.household.id)
    .eq("is_archived", false);

  const { error } = await supabase.from("inventory_items").insert({
    household_id: context.household.id,
    created_by: context.user.id,
    ...patch,
    barcode: normalizeOptional(input.barcode),
    product_brand: normalizeOptional(input.productBrand),
    product_image_url: normalizeOptional(input.productImageUrl),
  });

  if (error) {
    throw new Error(error.message);
  }

  if ((existingCount ?? 0) === 0) {
    await captureServerEvent({
      distinctId: context.user.id,
      event: analyticsEvents.firstInventoryItemAdded,
      properties: {
        household_id: context.household.id,
        storage_location: patch.storage_location,
      },
    });
  }

  revalidatePath("/app/pantry");
  revalidatePath("/app");
}

export async function updateInventoryItemAction(itemId: string, input: PantryItemInput) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  if (input.barcode) {
    assertBarcodeScanningAvailable(context);
  }
  const supabase = await createClient();
  const patch: Record<string, number | string | null> = {
    ...getInventoryPatch(input),
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
    .from("inventory_items")
    .update(patch)
    .eq("id", itemId)
    .eq("household_id", context.household.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/pantry");
  revalidatePath("/app");
}

export async function deleteInventoryItemAction(itemId: string) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", itemId)
    .eq("household_id", context.household.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/pantry");
  revalidatePath("/app");
}
