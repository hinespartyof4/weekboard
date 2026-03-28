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

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Live product lookup took too long. You can retry or continue with manual entry.");
    }

    throw new Error("Product lookup is unavailable right now. Please try manual entry.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "Live product lookup credentials are not working in this environment. You can still continue with manual entry.",
    );
  }

  if (response.status === 429) {
    throw new Error("Live product lookup is busy right now. Please retry in a moment.");
  }

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
