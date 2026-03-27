"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Home, Mail } from "lucide-react";

import { completeOnboardingAction } from "@/lib/onboarding/actions";
import {
  initialOnboardingActionState,
} from "@/lib/onboarding/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type OnboardingCardProps = {
  userEmail?: string | null;
};

export function OnboardingCard({ userEmail }: OnboardingCardProps) {
  const [timezone] = useState(() => {
    if (typeof window === "undefined") {
      return "UTC";
    }

    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  });
  const [state, formAction, isPending] = useActionState(
    completeOnboardingAction,
    initialOnboardingActionState,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
      <Card className="border-primary/12 bg-[linear-gradient(160deg,rgba(245,249,245,0.98),rgba(223,233,221,0.9))]">
        <CardHeader className="space-y-5">
          <p className="eyebrow">Step 1 of 1</p>
          <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
            Set up the home base.
          </CardTitle>
          <CardDescription className="text-base leading-8">
            We only need one quick step before Weekboard can open into your shared
            dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Create your first household",
            "Optionally invite your partner or another family member",
            "Land in the app ready to keep the week under control",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mx-auto w-full max-w-xl">
        <CardHeader className="space-y-3">
          <p className="eyebrow">First-run onboarding</p>
          <CardTitle className="font-serif text-4xl tracking-[-0.05em]">
            Name your household
          </CardTitle>
          <CardDescription className="text-base leading-7">
            Signed in as {userEmail ?? "your account"}. You can invite someone now
            or skip it and add them later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {state.message ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-900">
              {state.message}
            </div>
          ) : null}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="timezone" value={timezone} />

            <div className="space-y-2">
              <label htmlFor="householdName" className="text-sm font-medium text-foreground">
                Household name
              </label>
              <div className="relative">
                <Home className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="householdName"
                  name="householdName"
                  placeholder="The Parker Home"
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="inviteEmail" className="text-sm font-medium text-foreground">
                First invite email
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Optional
                </span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="inviteEmail"
                  name="inviteEmail"
                  type="email"
                  placeholder="partner@example.com"
                  className="pl-11"
                />
              </div>
            </div>

            <Button className="w-full" disabled={isPending}>
              {isPending ? "Creating your household..." : "Finish setup"}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
