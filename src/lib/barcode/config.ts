const defaultBarcodeLookupBaseUrl = "https://api.barcodelookup.com/v3/products";

export function getBarcodeLookupConfig() {
  return {
    apiKey: process.env.BARCODE_LOOKUP_API_KEY?.trim() || null,
    baseUrl:
      process.env.BARCODE_LOOKUP_BASE_URL?.trim().replace(/\/$/, "") ||
      defaultBarcodeLookupBaseUrl,
  };
}

export function isLiveBarcodeLookupConfigured() {
  return Boolean(getBarcodeLookupConfig().apiKey);
}
