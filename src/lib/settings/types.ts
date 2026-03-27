export type WeekboardPlanTier = "free" | "plus" | "home_pro";

export type SettingsFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialSettingsFormState: SettingsFormState = {
  status: "idle",
};

export type ProfileSettings = {
  email: string;
  displayName: string;
  canEdit: boolean;
  isPreview: boolean;
};

export type HouseholdSettings = {
  householdId: string;
  householdName: string;
  timezone: string;
  resetDay: number;
  weekStartsOn: number;
  canManage: boolean;
  isPreview: boolean;
  memberCount: number;
  planTier: WeekboardPlanTier;
  planName: string;
  subscriptionStatus:
    | "free"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "unpaid";
};

export type HouseholdDigestSettings = {
  householdName: string;
  weeklyDigestEnabled: boolean;
  weeklyDigestRecipientEmail: string;
  fallbackRecipientEmail: string;
  canManage: boolean;
  isPreview: boolean;
  planTier: WeekboardPlanTier;
  digestAvailable: boolean;
};

export type HouseholdMemberSettingsItem = {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string | null;
  role: "owner" | "admin" | "member";
  status: "active" | "paused" | "removed";
  joinedAt: string;
  isCurrentUser: boolean;
};

export type HouseholdInviteSettingsItem = {
  id: string;
  inviteeEmail: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "revoked" | "expired";
  createdAt: string;
  expiresAt: string | null;
};

export type MemberManagementSettings = {
  canManageInvites: boolean;
  canRemoveMembers: boolean;
  isPreview: boolean;
  members: HouseholdMemberSettingsItem[];
  pendingInvites: HouseholdInviteSettingsItem[];
};

export type SettingsPageData = {
  profile: ProfileSettings;
  household: HouseholdSettings;
  digest: HouseholdDigestSettings;
  members: MemberManagementSettings;
};
