import type { BarcodeFeatureEntitlement } from "@/lib/barcode/entitlements";

export const storageLocationOptions = [
  "pantry",
  "fridge",
  "freezer",
  "cleaning",
  "bathroom",
  "laundry",
  "other",
] as const;

export type StorageLocation = (typeof storageLocationOptions)[number];

export type InventoryStatus = "in_stock" | "low" | "out_of_stock";

export type PantryItemRecord = {
  id: string;
  householdId: string;
  name: string;
  category: string | null;
  storageLocation: StorageLocation;
  quantity: number;
  unit: string | null;
  lowStockThreshold: number | null;
  expirationDate: string | null;
  notes: string | null;
  status: InventoryStatus;
  barcode: string | null;
  productBrand: string | null;
  productImageUrl: string | null;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
};

export type PantryBoardData = {
  householdId: string;
  householdName: string;
  items: PantryItemRecord[];
  barcodeScanning: BarcodeFeatureEntitlement;
  summary: {
    totalItems: number;
    lowStockCount: number;
    expiringSoonCount: number;
    expiredCount: number;
  };
};

export type PantryItemInput = {
  name: string;
  category?: string;
  storageLocation: StorageLocation;
  quantity: string;
  unit?: string;
  lowStockThreshold?: string;
  expirationDate?: string;
  notes?: string;
  barcode?: string;
  productBrand?: string;
  productImageUrl?: string;
};
