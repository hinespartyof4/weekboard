import type { BarcodeSaveResult } from "@/lib/barcode/types";

const barcodeFeedbackStorageKey = "weekboard.barcode.feedback";

export function storeBarcodeFeedback(result: BarcodeSaveResult) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(barcodeFeedbackStorageKey, JSON.stringify(result));
}

export function readBarcodeFeedback() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.sessionStorage.getItem(barcodeFeedbackStorageKey);

  if (!value) {
    return null;
  }

  window.sessionStorage.removeItem(barcodeFeedbackStorageKey);

  try {
    return JSON.parse(value) as BarcodeSaveResult;
  } catch {
    return null;
  }
}
