import type { BarcodeLookupProduct } from "@/lib/barcode/types";

const mockBarcodeProducts: Record<string, BarcodeLookupProduct> = {
  "012345678905": {
    barcode: "012345678905",
    title: "Paper towels",
    brand: "Household Co.",
    category: "Household",
    imageUrl: null,
    source: "mock",
  },
  "036000291452": {
    barcode: "036000291452",
    title: "Dish soap",
    brand: "Clean Kitchen",
    category: "Cleaning",
    imageUrl: null,
    source: "mock",
  },
  "041196910118": {
    barcode: "041196910118",
    title: "Laundry detergent",
    brand: "Fresh Home",
    category: "Laundry",
    imageUrl: null,
    source: "mock",
  },
  "073366118238": {
    barcode: "073366118238",
    title: "Dog food",
    brand: "Good Pup",
    category: "Pets",
    imageUrl: null,
    source: "mock",
  },
  "030000012345": {
    barcode: "030000012345",
    title: "Multivitamins",
    brand: "Daily Basics",
    category: "Health",
    imageUrl: null,
    source: "mock",
  },
};

export const mockBarcodeExamples = [
  { barcode: "012345678905", label: "Paper towels" },
  { barcode: "036000291452", label: "Dish soap" },
  { barcode: "041196910118", label: "Detergent" },
  { barcode: "073366118238", label: "Dog food" },
  { barcode: "000000000000", label: "No match" },
] as const;

export function getMockBarcodeProduct(barcode: string) {
  return mockBarcodeProducts[barcode] ?? null;
}
