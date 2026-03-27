"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { updateProfileSettingsAction } from "@/lib/settings/actions";
import { initialSettingsFormState, type ProfileSettings } from "@/lib/settings/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ProfileSettingsCardProps = {
  settings: ProfileSettings;
};

export function ProfileSettingsCard({ settings }: ProfileSettingsCardProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateProfileSettingsAction,
    initialSettingsFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <Card>
      <CardHeader className="gap-3 border-b border-border/70 pb-5">
        <Badge>Profile</Badge>
        <div className="space-y-2">
          <CardTitle className="font-serif text-3xl tracking-[-0.05em]">
            Account details
          </CardTitle>
          <CardDescription className="text-base leading-7">
            Keep the display name simple and recognizable for the rest of the household.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={settings.displayName}
              placeholder="Your name"
              disabled={!settings.canEdit || settings.isPreview || pending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input id="email" value={settings.email} disabled readOnly />
            <p className="text-sm leading-6 text-muted-foreground">
              Email authentication is managed through Supabase.
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

          <Button type="submit" disabled={!settings.canEdit || settings.isPreview || pending}>
            {pending ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
