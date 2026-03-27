"use server";

import { redirect } from "next/navigation";

import { captureServerEvent } from "@/lib/analytics/server";
import { analyticsEvents } from "@/lib/analytics/events";
import { requireUser } from "@/lib/auth/user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingActionState } from "@/lib/onboarding/types";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function completeOnboardingAction(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase is not configured yet. Finish your .env.local setup before onboarding.",
    };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { data: existingMembership } = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existingMembership) {
    redirect("/app");
  }

  const householdName = String(formData.get("householdName") ?? "").trim();
  const inviteEmail = String(formData.get("inviteEmail") ?? "")
    .trim()
    .toLowerCase();
  const timezone = String(formData.get("timezone") ?? "").trim() || "UTC";

  if (!householdName) {
    return {
      status: "error",
      message: "Enter a household name to continue.",
    };
  }

  if (inviteEmail && !validateEmail(inviteEmail)) {
    return {
      status: "error",
      message: "Enter a valid invite email or leave it blank for now.",
    };
  }

  if (inviteEmail && inviteEmail === user.email?.toLowerCase()) {
    return {
      status: "error",
      message: "Use a different email if you want to send an invite.",
    };
  }

  const { error } = await supabase.rpc("create_household_with_owner_and_invite", {
    p_household_name: householdName,
    p_timezone: timezone,
    p_invite_email: inviteEmail || null,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  await captureServerEvent({
    distinctId: user.id,
    event: analyticsEvents.householdCreated,
    properties: {
      household_name: householdName,
      invited_first_member: Boolean(inviteEmail),
    },
  });

  redirect("/app");
}
