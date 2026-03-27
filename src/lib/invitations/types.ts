export type InvitationLookup = {
  invitationId: string;
  householdId: string;
  householdName: string;
  inviteeEmail: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string | null;
};

export type InvitePageData = {
  token: string;
  invitation: InvitationLookup | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  isInviteEmailMatch: boolean;
  canAcceptExplicitly: boolean;
  alreadyActiveInHousehold: boolean;
  previewMode: boolean;
};

export type InviteActionState = {
  status: "idle" | "error";
  message?: string;
};

export const initialInviteActionState: InviteActionState = {
  status: "idle",
};

export type SendHouseholdInviteEmailInput = {
  householdName: string;
  inviteeEmail: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: string | null;
};
