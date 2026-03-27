"use client";

import Link from "next/link";
import { useActionState } from "react";

import { acceptHouseholdInviteAction } from "@/lib/invitations/actions";
import { initialInviteActionState, type InvitePageData } from "@/lib/invitations/types";
import { formatShortDate } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InviteCardProps = {
  data: InvitePageData;
};

function getAuthHref(pathname: "/login" | "/signup", token: string) {
  return `${pathname}?next=${encodeURIComponent(`/invite/${token}`)}`;
}

function roleLabel(role: "owner" | "admin" | "member") {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    default:
      return "Member";
  }
}

export function InviteCard({ data }: InviteCardProps) {
  const [state, formAction, pending] = useActionState(
    acceptHouseholdInviteAction,
    initialInviteActionState,
  );

  if (data.previewMode) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="space-y-3">
          <Badge>Invite</Badge>
          <CardTitle className="font-serif text-4xl tracking-[-0.05em]">
            Invite links need Supabase configured.
          </CardTitle>
          <CardDescription className="text-base leading-7">
            Preview mode is great for exploring the app shell, but real household invites
            need the live auth and database setup.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data.invitation) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="space-y-3">
          <Badge>Invite</Badge>
          <CardTitle className="font-serif text-4xl tracking-[-0.05em]">
            This invitation link is not available.
          </CardTitle>
          <CardDescription className="text-base leading-7">
            It may have been revoked, mistyped, or already replaced with a newer invite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="border-primary/12 bg-[linear-gradient(160deg,rgba(245,249,245,0.98),rgba(223,233,221,0.9))]">
        <CardHeader className="space-y-5">
          <p className="eyebrow">Household invitation</p>
          <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
            Join {data.invitation.householdName}
          </CardTitle>
          <CardDescription className="text-base leading-8">
            This invite is for <strong>{data.invitation.inviteeEmail}</strong>. Once it is
            accepted, the household will appear in Weekboard with shared shopping,
            pantry, tasks, and Weekly Reset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm text-muted-foreground">
            Role on join: <strong className="text-foreground">{roleLabel(data.invitation.role)}</strong>
          </div>
          <div className="rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm text-muted-foreground">
            Status: <strong className="text-foreground">{data.invitation.status}</strong>
          </div>
          <div className="rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm text-muted-foreground">
            {data.invitation.expiresAt
              ? `Invitation expires ${formatShortDate(data.invitation.expiresAt)}.`
              : "Invitation does not currently show an expiration date."}
          </div>
        </CardContent>
      </Card>

      <Card className="mx-auto w-full max-w-xl">
        <CardHeader className="space-y-3">
          <Badge>Join</Badge>
          <CardTitle className="font-serif text-4xl tracking-[-0.05em]">
            Accept your household invite
          </CardTitle>
          <CardDescription className="text-base leading-7">
            Use the matching email address to join this household cleanly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {state.message ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-900">
              {state.message}
            </div>
          ) : null}

          {!data.isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Start with the email address this invite was sent to. If you already have a
                Weekboard account, log in. Otherwise, create one first and then come right
                back to this invite.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href={getAuthHref("/signup", data.token)}>Create account to join</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href={getAuthHref("/login", data.token)}>Log in to join</Link>
                </Button>
              </div>
            </div>
          ) : data.alreadyActiveInHousehold || data.invitation.status === "accepted" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm leading-6 text-emerald-900">
                This invitation has already been connected to your account.
              </div>
              <Button asChild>
                <Link href="/app">Open the app</Link>
              </Button>
            </div>
          ) : !data.isInviteEmailMatch ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-900">
              You’re signed in as {data.userEmail ?? "another account"}, but this invite is
              for {data.invitation.inviteeEmail}. Sign in with the matching email to accept it.
            </div>
          ) : data.invitation.status !== "pending" ? (
            <div className="rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm leading-6 text-muted-foreground">
              This invitation is no longer pending, so there’s nothing left to accept here.
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="token" value={data.token} />
              <div className="rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Signed in as <strong className="text-foreground">{data.userEmail}</strong>.
                Accepting this invite will connect you to {data.invitation.householdName}.
              </div>
              <Button type="submit" disabled={pending || !data.canAcceptExplicitly}>
                {pending ? "Joining household..." : "Join household"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
