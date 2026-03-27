"use server";

import { z } from "zod";

import { getActiveHouseholdContext } from "@/lib/app/context";
import { assertBarcodeScanningAvailable } from "@/lib/billing/gates";
import { storageLocationOptions } from "@/lib/pantry/types";
import { lookupBarcodeProduct, normalizeBarcodeValue } from "@/lib/barcode/service";
import type { BarcodeSaveResult } from "@/lib/barcode/types";
import { createInventoryItemAction } from "@/lib/pantry/actions";
import { createShoppingItemAction } from "@/lib/shopping/actions";

const lookupBarcodeSchema = z.object({
  barcode: z
    .string()
    .transform((value) => normalizeBarcodeValue(value))
    .refine((value) => value.length >= 8 && value.length <= 14, {
      message: "Enter a valid UPC or EAN barcode.",
    }),
});

const saveScannedItemSchema = z.object({
  destination: z.enum(["shopping", "inventory"]),
  barcode: z.string().optional().default(""),
  name: z.string().trim().min(1, "Item name is required."),
  category: z.string().optional().default(""),
  quantity: z.string().optional().default("1"),
  unit: z.string().optional().default(""),
  preferredStore: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  storageLocation: z.enum(storageLocationOptions).default("pantry"),
  expirationDate: z.string().optional().default(""),
  productBrand: z.string().optional().default(""),
  productImageUrl: z.string().optional().default(""),
});

export async function lookupBarcodeAction(input: { barcode: string }) {
  const context = await getActiveHouseholdContext();

  assertBarcodeScanningAvailable(context);

  const parsed = lookupBarcodeSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Enter a valid product barcode.");
  }

  return lookupBarcodeProduct(parsed.data.barcode);
}

export async function saveScannedItemAction(input: z.input<typeof saveScannedItemSchema>) {
  const context = await getActiveHouseholdContext();

  assertBarcodeScanningAvailable(context);

  const parsed = saveScannedItemSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Please review the item details.");
  }

  const values = {
    ...parsed.data,
    barcode: normalizeBarcodeValue(parsed.data.barcode),
  };

  if (values.destination === "shopping") {
    await createShoppingItemAction({
      name: values.name,
      category: values.category,
      quantity: values.quantity,
      unit: values.unit,
      preferredStore: values.preferredStore,
      notes: values.notes,
      barcode: values.barcode || undefined,
      productBrand: values.productBrand || undefined,
      productImageUrl: values.productImageUrl || undefined,
    });

    return {
      destination: "shopping",
      path: "/app/shopping",
      message: `${values.name} is now on the shopping list.`,
    } satisfies BarcodeSaveResult;
  }

  await createInventoryItemAction({
    name: values.name,
    category: values.category,
    quantity: values.quantity,
    unit: values.unit,
    storageLocation: values.storageLocation,
    expirationDate: values.expirationDate,
    notes: values.notes,
    barcode: values.barcode || undefined,
    productBrand: values.productBrand || undefined,
    productImageUrl: values.productImageUrl || undefined,
  });

  return {
    destination: "inventory",
    path: "/app/pantry",
    message: `${values.name} is now in household inventory.`,
  } satisfies BarcodeSaveResult;
}
