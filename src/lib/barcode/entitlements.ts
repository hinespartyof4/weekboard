import type { ActiveSubscription } from "@/lib/app/types";
import { getPlanDefinition, resolvePlanTier, type WeekboardPlanTier } from "@/lib/billing/plans";

export type BarcodeFeatureEntitlement = {
  planTier: WeekboardPlanTier;
  hasAccess: boolean;
  helperText: string;
  lockedTitle: string;
  lockedDescription: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  dismissLabel: string;
};

export function getBarcodeFeatureEntitlement(
  subscription: ActiveSubscription | null | undefined,
): BarcodeFeatureEntitlement {
  const planTier = resolvePlanTier(subscription);
  const plan = getPlanDefinition(planTier);
  const hasAccess = plan.featuresConfig.barcodeScanning;

  if (hasAccess) {
    return {
      planTier,
      hasAccess: true,
      helperText: "Scan everyday household items and add them in seconds.",
      lockedTitle: "",
      lockedDescription: "",
      primaryCtaLabel: "",
      secondaryCtaLabel: "",
      dismissLabel: "",
    };
  }

  return {
    planTier,
    hasAccess: false,
    helperText: "Included in Plus and Home Pro.",
    lockedTitle: "Barcode scanning is part of the paid Weekboard experience.",
    lockedDescription:
      "Scan everyday household items and add them in seconds. Barcode scanning is included in Plus and Home Pro, alongside more room and more convenience for the week ahead.",
    primaryCtaLabel: "Upgrade to Plus",
    secondaryCtaLabel: "See plans",
    dismissLabel: "Maybe not now",
  };
}

export function canUseBarcodeScanning(
  subscription: ActiveSubscription | null | undefined,
) {
  return getBarcodeFeatureEntitlement(subscription).hasAccess;
}
