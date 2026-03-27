"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { updateHouseholdSettingsAction } from "@/lib/settings/actions";
import { initialSettingsFormState, type HouseholdSettings } from "@/lib/settings/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type HouseholdSettingsCardProps = {
  settings: HouseholdSettings;
};

const weekdayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function HouseholdSettingsCard({ settings }: HouseholdSettingsCardProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateHouseholdSettingsAction,
    initialSettingsFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  const isDisabled = settings.isPreview || !settings.canManage || pending;

  return (
    <Card>
      <CardHeader className="gap-4 border-b border-border/70 pb-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Badge>Household</Badge>
            <div className="space-y-2">
              <CardTitle className="font-serif text-3xl tracking-[-0.05em]">
                Household settings
              </CardTitle>
              <CardDescription className="text-base leading-7">
                Set the shared basics that drive Weekly Reset timing, member context,
                and household identity across the app.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{settings.planName}</Badge>
            <Badge variant="secondary">{settings.memberCount} members</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="householdName" className="text-sm font-medium text-foreground">
              Household name
            </label>
            <Input
              id="householdName"
              name="householdName"
              defaultValue={settings.householdName}
              disabled={isDisabled}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="timezone" className="text-sm font-medium text-foreground">
                Timezone
              </label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={settings.timezone}
                placeholder="America/New_York"
                disabled={isDisabled}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="resetDay" className="text-sm font-medium text-foreground">
                Weekly Reset day
              </label>
              <Select
                id="resetDay"
                name="resetDay"
                defaultValue={String(settings.resetDay)}
                disabled={isDisabled}
              >
                {weekdayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="weekStartsOn" className="text-sm font-medium text-foreground">
              Week starts on
            </label>
            <Select
              id="weekStartsOn"
              name="weekStartsOn"
              defaultValue={String(settings.weekStartsOn)}
              disabled={isDisabled}
            >
              {weekdayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
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
            {pending ? "Saving..." : "Save household settings"}
          </Button>
        </form>

        <div className="space-y-4">
          <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
            <p className="text-sm font-medium text-foreground">Current subscription</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">
              {settings.planName}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Status: {settings.subscriptionStatus.replace("_", " ")}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/app/billing">Open billing</Link>
            </Button>
          </div>

          <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
            <p className="text-sm font-medium text-foreground">Access level</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {settings.canManage
                ? "You can update shared household settings because you have owner or admin access."
                : "You can view household settings here, but only the owner or an admin can make changes."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
