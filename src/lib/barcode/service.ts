import { getBarcodeLookupConfig, isLiveBarcodeLookupConfigured } from "@/lib/barcode/config";
import { getMockBarcodeProduct } from "@/lib/barcode/mock";
import { normalizeBarcodeLookupPayload } from "@/lib/barcode/normalize";
import type { BarcodeLookupResult } from "@/lib/barcode/types";

export function normalizeBarcodeValue(value: string) {
  return value.replace(/\D/g, "");
}

export async function lookupBarcodeProduct(barcode: string): Promise<BarcodeLookupResult> {
  if (!isLiveBarcodeLookupConfigured()) {
    return {
      barcode,
      product: getMockBarcodeProduct(barcode),
      mode: "mock",
    };
  }

  const { apiKey, baseUrl } = getBarcodeLookupConfig();
  const url = new URL(baseUrl);

  url.searchParams.set("barcode", barcode);
  url.searchParams.set("formatted", "y");

  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(7000),
  });

  if (!response.ok) {
    throw new Error("Product lookup is unavailable right now. Please try manual entry.");
  }

  const payload = (await response.json()) as unknown;

  return {
    barcode,
    product: normalizeBarcodeLookupPayload(payload, barcode),
    mode: "live",
  };
}
