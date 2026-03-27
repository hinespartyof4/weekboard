import { redirect } from "next/navigation";

import type { AppContextSnapshot } from "@/lib/app/types";
import { createPreviewAppContext, getPreviewMembership } from "@/lib/preview/data";
import { getCurrentMembership, requireUser } from "@/lib/auth/user";
import { isPreviewModeEnabled } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function getActiveHouseholdContext(): Promise<AppContextSnapshot> {
  if (isPreviewModeEnabled()) {
    return createPreviewAppContext();
  }

  const user = await requireUser();
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const [householdResult, subscriptionResult, memberCountResult] = await Promise.all([
    supabase
      .from("households")
      .select("id, name, timezone, week_starts_on, reset_day")
      .eq("id", membership.household_id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan_tier, status")
      .eq("household_id", membership.household_id)
      .maybeSingle(),
    supabase
      .from("household_members")
      .select("*", { count: "exact", head: true })
      .eq("household_id", membership.household_id)
      .eq("status", "active"),
  ]);

  if (!householdResult.data) {
    redirect("/onboarding");
  }

  return {
    user,
    membership: {
      id: membership.id,
      householdId: membership.household_id,
      role: membership.role,
      status: membership.status,
    },
    household: {
      id: householdResult.data.id,
      name: householdResult.data.name,
      timezone: householdResult.data.timezone,
      weekStartsOn: householdResult.data.week_starts_on,
      resetDay: householdResult.data.reset_day,
    },
    subscription: subscriptionResult.data
      ? {
          planTier: subscriptionResult.data.plan_tier,
          status: subscriptionResult.data.status,
        }
      : null,
    memberCount: memberCountResult.count ?? 1,
    isPreview: false,
  };
}

export async function getActiveMembership() {
  if (isPreviewModeEnabled()) {
    return getPreviewMembership();
  }

  return getCurrentMembership();
}
