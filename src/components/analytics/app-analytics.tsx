"use client";

import { useEffect } from "react";

import { identifyClientUser, resetClientAnalytics } from "@/lib/analytics/client";
import { useAppContext, useAuthUser } from "@/components/providers/auth-provider";

export function AppAnalytics() {
  const user = useAuthUser();
  const { household, subscription, isPreview } = useAppContext();

  useEffect(() => {
    if (!user || isPreview) {
      resetClientAnalytics();
      return;
    }

    identifyClientUser({
      distinctId: user.id,
      email: user.email,
      householdId: household.id,
      householdName: household.name,
      planTier: subscription?.planTier ?? "free",
    });
  }, [household.id, household.name, isPreview, subscription?.planTier, user]);

  return null;
}
