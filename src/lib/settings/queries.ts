import { getActiveHouseholdContext } from "@/lib/app/context";
import { getPlanDefinition, resolvePlanTier } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  HouseholdInviteSettingsItem,
  HouseholdMemberSettingsItem,
  SettingsPageData,
} from "@/lib/settings/types";

type HouseholdRow = {
  id: string;
  name: string;
  timezone: string;
  reset_day: number;
  week_starts_on: number;
  weekly_digest_enabled: boolean;
  weekly_digest_recipient_email: string | null;
};

type MemberRow = {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  status: "active" | "paused" | "removed";
  display_name: string | null;
  joined_at: string;
};

type InviteRow = {
  id: string;
  invitee_email: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "revoked" | "expired";
  created_at: string;
  expires_at: string | null;
};

function formatPlanName(tier: "free" | "plus" | "home_pro") {
  return getPlanDefinition(tier).name;
}

function getFallbackDisplayName(email: string | null, role: "owner" | "admin" | "member") {
  if (email) {
    return email.split("@")[0]?.replace(/[._-]+/g, " ") ?? "Household member";
  }

  switch (role) {
    case "owner":
      return "Household owner";
    case "admin":
      return "Household admin";
    default:
      return "Household member";
  }
}

async function getUserIdentityMap(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, { email: string | null; displayName: string | null }>();
  }

  try {
    const admin = createAdminClient();
    const results = await Promise.all(
      userIds.map(async (userId) => {
        const { data, error } = await admin.auth.admin.getUserById(userId);

        if (error || !data.user) {
          return [userId, { email: null, displayName: null }] as const;
        }

        const metadata = data.user.user_metadata ?? {};
        const displayName =
          (typeof metadata.full_name === "string" ? metadata.full_name : null) ??
          (typeof metadata.display_name === "string" ? metadata.display_name : null);

        return [
          userId,
          {
            email: data.user.email ?? null,
            displayName,
          },
        ] as const;
      }),
    );

    return new Map(results);
  } catch {
    return new Map<string, { email: string | null; displayName: string | null }>();
  }
}

function getPreviewSettingsPageData(): SettingsPageData {
  return {
    profile: {
      email: "alex@weekboard.preview",
      displayName: "Alex Parker",
      canEdit: false,
      isPreview: true,
    },
    household: {
      householdId: "preview-household",
      householdName: "The Parker Home",
      timezone: "America/New_York",
      resetDay: 0,
      weekStartsOn: 0,
      canManage: true,
      isPreview: true,
      memberCount: 2,
      planTier: "plus",
      planName: "Plus",
      subscriptionStatus: "trialing",
    },
    digest: {
      householdName: "The Parker Home",
      weeklyDigestEnabled: true,
      weeklyDigestRecipientEmail: "alex@weekboard.preview",
      fallbackRecipientEmail: "alex@weekboard.preview",
      canManage: true,
      isPreview: true,
      planTier: "plus",
      digestAvailable: true,
    },
    members: {
      canManageInvites: true,
      canRemoveMembers: true,
      isPreview: true,
      members: [
        {
          membershipId: "preview-member-1",
          userId: "preview-user",
          displayName: "Alex Parker",
          email: "alex@weekboard.preview",
          role: "owner",
          status: "active",
          joinedAt: "2026-01-01T00:00:00.000Z",
          isCurrentUser: true,
        },
        {
          membershipId: "preview-member-2",
          userId: "preview-member-jordan",
          displayName: "Jordan Parker",
          email: "jordan@weekboard.preview",
          role: "member",
          status: "active",
          joinedAt: "2026-01-02T00:00:00.000Z",
          isCurrentUser: false,
        },
      ],
      pendingInvites: [
        {
          id: "preview-invite-1",
          inviteeEmail: "grandma@weekboard.preview",
          role: "member",
          status: "pending",
          createdAt: "2026-03-25T14:00:00.000Z",
          expiresAt: "2026-04-08T14:00:00.000Z",
        },
      ],
    },
  };
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const context = await getActiveHouseholdContext();

  if (context.isPreview) {
    return getPreviewSettingsPageData();
  }

  const supabase = await createClient();
  const planTier = resolvePlanTier(context.subscription);
  const currentPlan = getPlanDefinition(planTier);
  const [householdResult, membersResult, invitesResult] = await Promise.all([
    supabase
      .from("households")
      .select(
        "id, name, timezone, reset_day, week_starts_on, weekly_digest_enabled, weekly_digest_recipient_email",
      )
      .eq("id", context.household.id)
      .maybeSingle(),
    supabase
      .from("household_members")
      .select("id, user_id, role, status, display_name, joined_at")
      .eq("household_id", context.household.id)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    supabase
      .from("household_invitations")
      .select("id, invitee_email, role, status, created_at, expires_at")
      .eq("household_id", context.household.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const household = (householdResult.data ?? null) as HouseholdRow | null;
  const memberRows = (membersResult.data ?? []) as MemberRow[];
  const inviteRows = (invitesResult.data ?? []) as InviteRow[];
  const userMap = await getUserIdentityMap(memberRows.map((member) => member.user_id));

  const members: HouseholdMemberSettingsItem[] = memberRows.map((member) => {
    const authIdentity = userMap.get(member.user_id);
    const displayName =
      member.display_name?.trim() ||
      authIdentity?.displayName?.trim() ||
      getFallbackDisplayName(authIdentity?.email ?? null, member.role);

    return {
      membershipId: member.id,
      userId: member.user_id,
      displayName,
      email: authIdentity?.email ?? (member.user_id === context.user.id ? context.user.email ?? null : null),
      role: member.role,
      status: member.status,
      joinedAt: member.joined_at,
      isCurrentUser: member.user_id === context.user.id,
    };
  });

  const pendingInvites: HouseholdInviteSettingsItem[] = inviteRows.map((invite) => ({
    id: invite.id,
    inviteeEmail: invite.invitee_email,
    role: invite.role,
    status: invite.status,
    createdAt: invite.created_at,
    expiresAt: invite.expires_at,
  }));

  return {
    profile: {
      email: context.user.email ?? "",
      displayName:
        (typeof context.user.user_metadata?.full_name === "string"
          ? context.user.user_metadata.full_name
          : null) ??
        (typeof context.user.user_metadata?.display_name === "string"
          ? context.user.user_metadata.display_name
          : null) ??
        members.find((member) => member.isCurrentUser)?.displayName ??
        "",
      canEdit: true,
      isPreview: false,
    },
    household: {
      householdId: context.household.id,
      householdName: household?.name ?? context.household.name,
      timezone: household?.timezone ?? context.household.timezone,
      resetDay: household?.reset_day ?? context.household.resetDay,
      weekStartsOn: household?.week_starts_on ?? context.household.weekStartsOn,
      canManage: context.membership.role === "owner" || context.membership.role === "admin",
      isPreview: false,
      memberCount: members.length,
      planTier,
      planName: formatPlanName(planTier),
      subscriptionStatus: context.subscription?.status ?? "free",
    },
    digest: {
      householdName: household?.name ?? context.household.name,
      weeklyDigestEnabled: household?.weekly_digest_enabled ?? true,
      weeklyDigestRecipientEmail: household?.weekly_digest_recipient_email ?? "",
      fallbackRecipientEmail: context.user.email ?? "",
      canManage: context.membership.role === "owner" || context.membership.role === "admin",
      isPreview: false,
      planTier,
      digestAvailable: currentPlan.featuresConfig.weeklyDigest,
    },
    members: {
      canManageInvites: context.membership.role === "owner" || context.membership.role === "admin",
      canRemoveMembers: context.membership.role === "owner",
      isPreview: false,
      members,
      pendingInvites,
    },
  };
}
