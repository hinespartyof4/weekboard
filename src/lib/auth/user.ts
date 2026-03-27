import { redirect } from "next/navigation";

import { getSafeRedirectPath, isInvitePath } from "@/lib/auth/redirects";
import { getPreviewMembership, getPreviewUser } from "@/lib/preview/data";
import { isPreviewModeEnabled, isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

async function getActiveMembershipRow(userId: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("household_members")
      .select("id, household_id, role, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return data;
  } catch (error) {
    console.error("Failed to read household membership.", error);
    return null;
  }
}

async function acceptPendingInvitationIfPossible() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("accept_pending_household_invitation");

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error("Failed to accept pending household invitation.", error);
  }
}

export async function getCurrentUser(options?: { allowPreview?: boolean }) {
  const allowPreview = options?.allowPreview ?? true;

  if (isPreviewModeEnabled()) {
    return allowPreview ? getPreviewUser() : null;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    console.error("Failed to read the current Supabase user.", error);
    return null;
  }
}

export async function getCurrentMembership() {
  if (isPreviewModeEnabled()) {
    return getPreviewMembership();
  }

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const membership = await getActiveMembershipRow(user.id);

  if (membership) {
    return membership;
  }

  await acceptPendingInvitationIfPossible();
  return getActiveMembershipRow(user.id);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireOnboardingCompletion() {
  const user = await requireUser();
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/onboarding");
  }

  return { user, membership };
}

export async function getPostAuthRedirectPath(preferredPath?: string | null) {
  if (isPreviewModeEnabled()) {
    return getSafeRedirectPath(preferredPath);
  }

  const safePreferredPath = getSafeRedirectPath(preferredPath);

  if (isInvitePath(safePreferredPath)) {
    return safePreferredPath;
  }

  const membership = await getCurrentMembership();

  if (!membership) {
    return "/onboarding";
  }

  return safePreferredPath;
}

export async function redirectIfAuthenticated(preferredPath?: string | null) {
  const user = await getCurrentUser({ allowPreview: false });

  if (user) {
    redirect(await getPostAuthRedirectPath(preferredPath));
  }
}

export async function redirectIfOnboardingComplete() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getCurrentMembership();

  if (membership) {
    redirect("/app");
  }

  return user;
}
