import type { StorageLocation } from "@/lib/pantry/types";

export type BarcodeDestination = "shopping" | "inventory";

export type BarcodeLookupProduct = {
  barcode: string;
  title: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  source: "mock" | "barcodelookup" | "custom";
  rawResponse?: unknown;
};

export type BarcodeLookupResult = {
  barcode: string;
  product: BarcodeLookupProduct | null;
  mode: "mock" | "live";
};

export type BarcodeConfirmationValues = {
  destination: BarcodeDestination;
  barcode: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  preferredStore: string;
  notes: string;
  storageLocation: StorageLocation;
  expirationDate: string;
};

export type BarcodeSaveResult = {
  destination: BarcodeDestination;
  path: "/app/shopping" | "/app/pantry";
  message: string;
};
