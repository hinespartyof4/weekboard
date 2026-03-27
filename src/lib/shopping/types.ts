import type { BarcodeFeatureEntitlement } from "@/lib/barcode/entitlements";

export type ShoppingItemStatus = "needed" | "purchased" | "archived";

export type ShoppingListRecord = {
  id: string;
  householdId: string;
  name: string;
  isDefault: boolean;
};

export type ShoppingItemRecord = {
  id: string;
  householdId: string;
  shoppingListId: string;
  name: string;
  category: string | null;
  quantity: string | null;
  unit: string | null;
  priority: boolean;
  preferredStore: string | null;
  notes: string | null;
  status: ShoppingItemStatus;
  barcode: string | null;
  productBrand: string | null;
  productImageUrl: string | null;
};

export type ShoppingBoardData = {
  householdName: string;
  list: ShoppingListRecord;
  items: ShoppingItemRecord[];
  barcodeScanning: BarcodeFeatureEntitlement;
};

export type ShoppingItemInput = {
  name: string;
  category?: string;
  quantity?: string;
  unit?: string;
  priority?: boolean;
  preferredStore?: string;
  notes?: string;
  status?: ShoppingItemStatus;
  barcode?: string;
  productBrand?: string;
  productImageUrl?: string;
};
