"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { updateDigestSettingsAction } from "@/lib/settings/actions";
import {
  initialSettingsFormState,
  type HouseholdDigestSettings,
} from "@/lib/settings/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type DigestSettingsCardProps = {
  settings: HouseholdDigestSettings;
};

export function DigestSettingsCard({ settings }: DigestSettingsCardProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateDigestSettingsAction, initialSettingsFormState);
  const isDisabled =
    settings.isPreview || !settings.canManage || pending || !settings.digestAvailable;

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4 border-b border-border/70 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Badge>Weekly digest</Badge>
            <div className="space-y-2">
              <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
                Weekly Reset email delivery
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7">
                Send one calm household digest each week with the most important restocks,
                upcoming needs, and open tasks.
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary">
            {settings.weeklyDigestEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
        <form action={formAction} className="space-y-5">
          <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="weeklyDigestEnabled"
                defaultChecked={settings.weeklyDigestEnabled}
                disabled={isDisabled}
                className="mt-1 size-4 rounded border border-border accent-[var(--primary)]"
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-foreground">
                  Send the weekly digest
                </span>
                <span className="block text-sm leading-6 text-muted-foreground">
                  A Vercel cron job prepares one email per week for this household based
                  on the Weekly Reset data.
                </span>
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="weeklyDigestRecipientEmail"
              className="text-sm font-medium text-foreground"
            >
              Delivery email
            </label>
            <Input
              id="weeklyDigestRecipientEmail"
              name="weeklyDigestRecipientEmail"
              type="email"
              placeholder={settings.fallbackRecipientEmail || "owner@household.com"}
              defaultValue={settings.weeklyDigestRecipientEmail}
              disabled={isDisabled}
            />
            <p className="text-sm leading-6 text-muted-foreground">
              Leave blank to send to the household owner/admin email we can resolve from
              Supabase.
            </p>
          </div>

          {state.message ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                state.status === "error"
                  ? "border-rose-200 bg-rose-50/90 text-rose-900"
                  : "border-emerald-200 bg-emerald-50/90 text-emerald-900"
              }`}
            >
              {state.message}
            </div>
          ) : null}

          <Button type="submit" disabled={isDisabled}>
            {pending ? "Saving..." : "Save digest settings"}
          </Button>
        </form>

        <div className="space-y-4">
          <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
            <p className="text-sm font-medium text-foreground">Delivery behavior</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>Sent once per week on the household’s configured reset day.</li>
              <li>Includes low stock, expiring items, recurring due items, and tasks.</li>
              <li>Links directly back to the Weekly Reset page in the app.</li>
            </ul>
          </div>

          <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
            <p className="text-sm font-medium text-foreground">Current household</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {settings.householdName}
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {settings.isPreview
                ? "Preview mode is read-only, so this settings card is just showing the planned household controls."
                : !settings.digestAvailable
                  ? `Weekly digest is available on Plus and Home Pro. ${settings.householdName} is currently on ${settings.planTier === "home_pro" ? "Home Pro" : settings.planTier}.`
                : settings.canManage
                  ? "You can change this setting because you have admin access in the household."
                  : "You can view this setting, but only a household owner or admin can change it."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
