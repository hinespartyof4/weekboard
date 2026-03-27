"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  inviteMemberAction,
  removeMemberAction,
  revokeInviteAction,
} from "@/lib/settings/actions";
import {
  initialSettingsFormState,
  type HouseholdInviteSettingsItem,
  type HouseholdMemberSettingsItem,
  type MemberManagementSettings,
} from "@/lib/settings/types";
import { formatShortDate } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MemberManagementCardProps = {
  settings: MemberManagementSettings;
};

function roleLabel(role: HouseholdMemberSettingsItem["role"] | HouseholdInviteSettingsItem["role"]) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    default:
      return "Member";
  }
}

export function MemberManagementCard({ settings }: MemberManagementCardProps) {
  const router = useRouter();
  const [inviteState, inviteAction, pendingInvite] = useActionState(
    inviteMemberAction,
    initialSettingsFormState,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (inviteState.status === "success") {
      router.refresh();
    }
  }, [router, inviteState.status]);

  function handleInviteRevoke(inviteId: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await revokeInviteAction(inviteId);
        setMessage("Pending invite revoked.");
        router.refresh();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to revoke invite.");
      }
    });
  }

  function handleMemberRemove(memberId: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await removeMemberAction(memberId);
        setMessage("Member removed from the household.");
        router.refresh();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to remove member.");
      }
    });
  }

  const managerDisabled = settings.isPreview || !settings.canManageInvites || pendingInvite;

  return (
    <Card>
      <CardHeader className="gap-4 border-b border-border/70 pb-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Badge>Members</Badge>
            <div className="space-y-2">
              <CardTitle className="font-serif text-3xl tracking-[-0.05em]">
                Household members
              </CardTitle>
              <CardDescription className="text-base leading-7">
                Keep the household small, clear, and shared. Invite new members,
                see pending access, and remove someone when needed.
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary">
            {settings.members.length} active member{settings.members.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {settings.members.map((member) => (
            <div
              key={member.membershipId}
              className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{member.displayName}</p>
                    <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                      {roleLabel(member.role)}
                    </Badge>
                    {member.isCurrentUser ? <Badge variant="outline">You</Badge> : null}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {member.email ?? "Email unavailable"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Joined {formatShortDate(member.joinedAt)}
                  </p>
                </div>

                {settings.canRemoveMembers && !member.isCurrentUser && member.role !== "owner" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-rose-200 text-rose-900 hover:bg-rose-50"
                    disabled={settings.isPreview || isPending}
                    onClick={() => handleMemberRemove(member.membershipId)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <form
            action={inviteAction}
            className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5"
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Invite another member</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Add one more adult or family member to the same household workspace.
              </p>
            </div>
            <div className="mt-4 space-y-3">
              <Input
                name="inviteEmail"
                type="email"
                placeholder="partner@household.com"
                disabled={managerDisabled}
              />
              <Button type="submit" disabled={managerDisabled}>
                {pendingInvite ? "Saving..." : "Save invite"}
              </Button>
            </div>
            {inviteState.message ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${
                  inviteState.status === "error"
                    ? "border-rose-200 bg-rose-50/90 text-rose-900"
                    : "border-emerald-200 bg-emerald-50/90 text-emerald-900"
                }`}
              >
                {inviteState.message}
              </div>
            ) : null}
          </form>

          <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
            <p className="text-sm font-medium text-foreground">Pending invites</p>
            {settings.pendingInvites.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                No pending invites right now.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {settings.pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-2xl border border-border/80 bg-background/80 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {invite.inviteeEmail}
                          </p>
                          <Badge variant="secondary">{roleLabel(invite.role)}</Badge>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          Invited {formatShortDate(invite.createdAt)}
                          {invite.expiresAt
                            ? ` • expires ${formatShortDate(invite.expiresAt)}`
                            : ""}
                        </p>
                      </div>

                      {settings.canManageInvites ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={settings.isPreview || isPending}
                          onClick={() => handleInviteRevoke(invite.id)}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm leading-6 text-emerald-900">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-900">
              {error}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
