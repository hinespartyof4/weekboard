import { createClient } from "@/lib/supabase/server";
import type { ActiveSubscription } from "@/lib/app/types";
import { getBarcodeFeatureEntitlement } from "@/lib/barcode/entitlements";
import { addDays, getTodayInTimeZone } from "@/lib/date";
import { getPreviewPantryBoardData, getPreviewPantryItemsByIds } from "@/lib/preview/data";
import { isPreviewModeEnabled } from "@/lib/supabase/env";
import type { PantryBoardData, PantryItemRecord, StorageLocation } from "@/lib/pantry/types";

type InventoryItemRow = {
  id: string;
  household_id: string;
  name: string;
  category: string | null;
  storage_location: StorageLocation;
  quantity: number;
  unit: string | null;
  low_stock_threshold: number | null;
  expiration_date: string | null;
  notes: string | null;
  status: "in_stock" | "low" | "out_of_stock";
  barcode: string | null;
  product_brand: string | null;
  product_image_url: string | null;
};

function mapPantryItem(item: InventoryItemRow, today: string, expiringSoonDate: string): PantryItemRecord {
  const isLowStock =
    Number(item.quantity) === 0 ||
    (item.low_stock_threshold !== null &&
      Number(item.quantity) <= Number(item.low_stock_threshold));
  const isExpired = item.expiration_date !== null && item.expiration_date < today;
  const isExpiringSoon =
    item.expiration_date !== null &&
    item.expiration_date >= today &&
    item.expiration_date <= expiringSoonDate;

  return {
    id: item.id,
    householdId: item.household_id,
    name: item.name,
    category: item.category,
    storageLocation: item.storage_location,
    quantity: Number(item.quantity),
    unit: item.unit,
    lowStockThreshold:
      item.low_stock_threshold === null ? null : Number(item.low_stock_threshold),
    expirationDate: item.expiration_date,
    notes: item.notes,
    status: item.status,
    barcode: item.barcode,
    productBrand: item.product_brand,
    productImageUrl: item.product_image_url,
    isLowStock,
    isExpiringSoon,
    isExpired,
  };
}

export async function getPantryBoardData(args: {
  householdId: string;
  householdName: string;
  timeZone: string;
  subscription: ActiveSubscription | null;
}): Promise<PantryBoardData> {
  if (isPreviewModeEnabled()) {
    return getPreviewPantryBoardData(args.timeZone);
  }

  const supabase = await createClient();
  const today = getTodayInTimeZone(args.timeZone);
  const expiringSoonDate = addDays(today, 7);

  const { data: items } = await supabase
    .from("inventory_items")
    .select(
      "id, household_id, name, category, storage_location, quantity, unit, low_stock_threshold, expiration_date, notes, status, barcode, product_brand, product_image_url",
    )
    .eq("household_id", args.householdId)
    .eq("is_archived", false)
    .order("storage_location", { ascending: true })
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  const records = (items ?? []).map((item) =>
    mapPantryItem(item as InventoryItemRow, today, expiringSoonDate),
  );

  return {
    householdId: args.householdId,
    householdName: args.householdName,
    items: records,
    barcodeScanning: getBarcodeFeatureEntitlement(args.subscription),
    summary: {
      totalItems: records.length,
      lowStockCount: records.filter((item) => item.isLowStock).length,
      expiringSoonCount: records.filter((item) => item.isExpiringSoon).length,
      expiredCount: records.filter((item) => item.isExpired).length,
    },
  };
}

export async function getPantryItemsByIds(args: {
  householdId: string;
  timeZone: string;
  itemIds: string[];
}) {
  if (isPreviewModeEnabled()) {
    return getPreviewPantryItemsByIds(args.itemIds, args.timeZone);
  }

  if (args.itemIds.length === 0) {
    return [] as PantryItemRecord[];
  }

  const supabase = await createClient();
  const today = getTodayInTimeZone(args.timeZone);
  const expiringSoonDate = addDays(today, 7);

  const { data: items } = await supabase
    .from("inventory_items")
    .select(
      "id, household_id, name, category, storage_location, quantity, unit, low_stock_threshold, expiration_date, notes, status, barcode, product_brand, product_image_url",
    )
    .eq("household_id", args.householdId)
    .eq("is_archived", false)
    .in("id", args.itemIds)
    .order("name", { ascending: true });

  return (items ?? []).map((item) =>
    mapPantryItem(item as InventoryItemRow, today, expiringSoonDate),
  );
}
