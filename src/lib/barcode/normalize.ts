import type { BarcodeLookupProduct } from "@/lib/barcode/types";

function getStringValue(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function getImageValue(value: unknown) {
  if (typeof value === "string") {
    return getStringValue(value);
  }

  if (!Array.isArray(value)) {
    return null;
  }

  for (const entry of value) {
    const image = getStringValue(entry);

    if (image) {
      return image;
    }
  }

  return null;
}

function normalizeFromBarcodeLookup(
  payload: unknown,
  fallbackBarcode: string,
): BarcodeLookupProduct | null {
  if (!payload || typeof payload !== "object" || !("products" in payload)) {
    return null;
  }

  const products = (payload as { products?: unknown }).products;

  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  const first = products[0];

  if (!first || typeof first !== "object") {
    return null;
  }

  const product = first as Record<string, unknown>;
  const title = getStringValue(product.title);

  if (!title) {
    return null;
  }

  return {
    barcode: getStringValue(product.barcode_number) ?? fallbackBarcode,
    title,
    brand: getStringValue(product.brand),
    category: getStringValue(product.category),
    imageUrl: getImageValue(product.images),
    source: "barcodelookup",
    rawResponse: payload,
  };
}

function normalizeFromAlternateProductShape(
  payload: unknown,
  fallbackBarcode: string,
): BarcodeLookupProduct | null {
  if (!payload || typeof payload !== "object" || !("product" in payload)) {
    return null;
  }

  const productValue = (payload as { product?: unknown }).product;

  if (!productValue || typeof productValue !== "object") {
    return null;
  }

  const product = productValue as Record<string, unknown>;
  const title = getStringValue(product.product_name) ?? getStringValue(product.title);

  if (!title) {
    return null;
  }

  return {
    barcode: getStringValue(product.code) ?? fallbackBarcode,
    title,
    brand: getStringValue(product.brands) ?? getStringValue(product.brand),
    category: getStringValue(product.categories) ?? getStringValue(product.category),
    imageUrl: getImageValue(product.image_url) ?? getImageValue(product.images),
    source: "custom",
    rawResponse: payload,
  };
}

export function normalizeBarcodeLookupPayload(payload: unknown, barcode: string) {
  return (
    normalizeFromBarcodeLookup(payload, barcode) ??
    normalizeFromAlternateProductShape(payload, barcode)
  );
}
