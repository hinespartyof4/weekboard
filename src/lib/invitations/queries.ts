import { getCurrentUser } from "@/lib/auth/user";
import { isPreviewModeEnabled, isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { InvitePageData, InvitationLookup } from "@/lib/invitations/types";

type InvitationRow = {
  invitation_id: string;
  household_id: string;
  household_name: string;
  invitee_email: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string | null;
};

function mapInvitation(row: InvitationRow): InvitationLookup {
  return {
    invitationId: row.invitation_id,
    householdId: row.household_id,
    householdName: row.household_name,
    inviteeEmail: row.invitee_email,
    role: row.role,
    status: row.status,
    expiresAt: row.expires_at,
  };
}

export async function getInvitePageData(token: string): Promise<InvitePageData> {
  const cleanToken = token.trim();

  if (!cleanToken || isPreviewModeEnabled() || !isSupabaseConfigured()) {
    return {
      token: cleanToken,
      invitation: null,
      userEmail: null,
      isAuthenticated: false,
      isInviteEmailMatch: false,
      canAcceptExplicitly: false,
      alreadyActiveInHousehold: false,
      previewMode: isPreviewModeEnabled(),
    };
  }

  const supabase = await createClient();
  const [user, invitationResult] = await Promise.all([
    getCurrentUser({ allowPreview: false }),
    supabase.rpc("get_household_invitation_details", {
      p_invite_token: cleanToken,
    }),
  ]);

  const invitationRow = ((invitationResult.data ?? [])[0] ?? null) as InvitationRow | null;
  const invitation = invitationRow ? mapInvitation(invitationRow) : null;
  let alreadyActiveInHousehold = false;

  if (user && invitation) {
    const { data: membership } = await supabase
      .from("household_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("household_id", invitation.householdId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    alreadyActiveInHousehold = Boolean(membership?.id);
  }

  const userEmail = user?.email?.toLowerCase() ?? null;
  const isInviteEmailMatch =
    Boolean(invitation?.inviteeEmail) &&
    Boolean(userEmail) &&
    invitation?.inviteeEmail === userEmail;
  const canAcceptExplicitly = invitation
    ? invitation.status === "pending" && isInviteEmailMatch && !alreadyActiveInHousehold
    : false;

  return {
    token: cleanToken,
    invitation,
    userEmail,
    isAuthenticated: Boolean(user),
    isInviteEmailMatch,
    canAcceptExplicitly,
    alreadyActiveInHousehold,
    previewMode: false,
  };
}
