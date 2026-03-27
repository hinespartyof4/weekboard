"use server";

import { revalidatePath } from "next/cache";

import { getActiveHouseholdContext } from "@/lib/app/context";
import { requireUser } from "@/lib/auth/user";
import { assertPlanFeature } from "@/lib/billing/gates";
import { sendHouseholdInviteEmail } from "@/lib/invitations/send";
import { assertWritesEnabled } from "@/lib/preview-mode";
import { isResendConfigured } from "@/lib/resend/client";
import { getAppUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { SettingsFormState } from "@/lib/settings/types";

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseDayValue(value: FormDataEntryValue | null) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
    throw new Error("Choose a valid day of the week.");
  }

  return parsed;
}

function assertCanManageHousehold(role: "owner" | "admin" | "member") {
  if (role === "owner" || role === "admin") {
    return;
  }

  throw new Error("Only household owners and admins can manage these settings.");
}

function assertCanRemoveMembers(role: "owner" | "admin" | "member") {
  if (role === "owner") {
    return;
  }

  throw new Error("Only the household owner can remove members.");
}

function success(message: string): SettingsFormState {
  return { status: "success", message };
}

function failure(error: unknown): SettingsFormState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "Something went wrong.",
  };
}

function revalidateSettingsViews() {
  revalidatePath("/app", "layout");
  revalidatePath("/app/settings");
}

function getInviterName(context: Awaited<ReturnType<typeof getActiveHouseholdContext>>) {
  const fullName =
    typeof context.user.user_metadata?.full_name === "string"
      ? context.user.user_metadata.full_name.trim()
      : "";
  const displayName =
    typeof context.user.user_metadata?.display_name === "string"
      ? context.user.user_metadata.display_name.trim()
      : "";

  return fullName || displayName || context.user.email || context.household.name;
}

export async function updateProfileSettingsAction(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  try {
    assertWritesEnabled();

    const user = await requireUser();
    const displayName = String(formData.get("displayName") ?? "").trim();

    if (displayName.length > 80) {
      throw new Error("Keep the profile name under 80 characters.");
    }

    const supabase = await createClient();
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: displayName || null,
        display_name: displayName || null,
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const { data: membership } = await supabase
      .from("household_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membership?.id) {
      const { error: memberError } = await supabase
        .from("household_members")
        .update({ display_name: displayName || null })
        .eq("id", membership.id);

      if (memberError) {
        throw new Error(memberError.message);
      }
    }

    revalidateSettingsViews();
    return success("Profile settings saved.");
  } catch (error) {
    return failure(error);
  }
}

export async function updateHouseholdSettingsAction(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  try {
    assertWritesEnabled();

    const context = await getActiveHouseholdContext();
    assertCanManageHousehold(context.membership.role);

    const householdName = String(formData.get("householdName") ?? "").trim();
    const timezone = String(formData.get("timezone") ?? "").trim();
    const resetDay = parseDayValue(formData.get("resetDay"));
    const weekStartsOn = parseDayValue(formData.get("weekStartsOn"));

    if (!householdName) {
      throw new Error("Household name is required.");
    }

    if (!timezone) {
      throw new Error("Timezone is required.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("households")
      .update({
        name: householdName,
        timezone,
        reset_day: resetDay,
        week_starts_on: weekStartsOn,
      })
      .eq("id", context.household.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidateSettingsViews();
    return success("Household settings saved.");
  } catch (error) {
    return failure(error);
  }
}

export async function updateDigestSettingsAction(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  try {
    assertWritesEnabled();

    const context = await getActiveHouseholdContext();
    assertCanManageHousehold(context.membership.role);

    const weeklyDigestEnabled = formData.get("weeklyDigestEnabled") === "on";
    const weeklyDigestRecipientEmail = String(
      formData.get("weeklyDigestRecipientEmail") ?? "",
    ).trim();

    if (weeklyDigestEnabled) {
      assertPlanFeature(context, "weeklyDigest");
    }

    if (weeklyDigestRecipientEmail && !validateEmail(weeklyDigestRecipientEmail)) {
      throw new Error(
        "Enter a valid email address or leave the field blank to use the default account email.",
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("households")
      .update({
        weekly_digest_enabled: weeklyDigestEnabled,
        weekly_digest_recipient_email: weeklyDigestRecipientEmail || null,
      })
      .eq("id", context.household.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidateSettingsViews();
    return success(
      weeklyDigestEnabled
        ? "Weekly digest settings saved."
        : "Weekly digest emails are turned off for this household.",
    );
  } catch (error) {
    return failure(error);
  }
}

export async function inviteMemberAction(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  try {
    assertWritesEnabled();

    const context = await getActiveHouseholdContext();
    assertCanManageHousehold(context.membership.role);

    const inviteEmail = String(formData.get("inviteEmail") ?? "")
      .trim()
      .toLowerCase();

    if (!inviteEmail) {
      throw new Error("Enter an email address to send an invite.");
    }

    if (!validateEmail(inviteEmail)) {
      throw new Error("Enter a valid email address.");
    }

    if (inviteEmail === (context.user.email ?? "").toLowerCase()) {
      throw new Error("Use a different email address if you want to invite another member.");
    }

    const supabase = await createClient();
    const { data: existingInvite } = await supabase
      .from("household_invitations")
      .select("id")
      .eq("household_id", context.household.id)
      .eq("invitee_email", inviteEmail)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (existingInvite?.id) {
      throw new Error("A pending invite already exists for that email.");
    }

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invitation, error } = await supabase
      .from("household_invitations")
      .insert({
        household_id: context.household.id,
        invitee_email: inviteEmail,
        role: "member",
        status: "pending",
        invited_by: context.user.id,
        expires_at: expiresAt,
      })
      .select("invite_token, expires_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidateSettingsViews();

    if (!invitation?.invite_token) {
      return success("Invite saved. It will appear in pending invites until accepted.");
    }

    if (!isResendConfigured()) {
      return success(
        "Invite saved. Add Resend credentials to send the real household invite email automatically.",
      );
    }

    try {
      await sendHouseholdInviteEmail({
        householdName: context.household.name,
        inviteeEmail: inviteEmail,
        inviterName: getInviterName(context),
        inviteUrl: `${getAppUrl()}/invite/${invitation.invite_token}`,
        expiresAt: invitation.expires_at,
      });

      return success(`Invite sent to ${inviteEmail}.`);
    } catch {
      return success(
        "Invite saved, but the email could not be sent right now. The pending invite is still available in Settings.",
      );
    }
  } catch (error) {
    return failure(error);
  }
}

export async function revokeInviteAction(inviteId: string) {
  assertWritesEnabled();

  const context = await getActiveHouseholdContext();
  assertCanManageHousehold(context.membership.role);

  const supabase = await createClient();
  const { error } = await supabase
    .from("household_invitations")
    .update({
      status: "revoked",
    })
    .eq("id", inviteId)
    .eq("household_id", context.household.id)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  revalidateSettingsViews();
}

export async function removeMemberAction(membershipId: string) {
  assertWritesEnabled();

  const context = await getActiveHouseholdContext();
  assertCanRemoveMembers(context.membership.role);

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("household_members")
    .select("id, user_id, role")
    .eq("id", membershipId)
    .eq("household_id", context.household.id)
    .maybeSingle();

  if (!member) {
    throw new Error("Member not found.");
  }

  if (member.user_id === context.user.id) {
    throw new Error("Remove yourself from this household in a future account flow.");
  }

  if (member.role === "owner") {
    throw new Error("Transfer ownership before removing another owner.");
  }

  const { error } = await supabase
    .from("household_members")
    .update({ status: "removed" })
    .eq("id", membershipId)
    .eq("household_id", context.household.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateSettingsViews();
}
