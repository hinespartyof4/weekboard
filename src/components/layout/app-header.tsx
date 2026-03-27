"use client";

import { Bell, CalendarDays, Search } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { useAppContext } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";

export function AppHeader() {
  const { household, memberCount, membership, subscription, user, isPreview } =
    useAppContext();
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="rounded-[calc(var(--radius)+10px)] border border-border/80 bg-card/95 px-4 py-4 shadow-sm backdrop-blur-md sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow">{household.name}</p>
          <h1 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-foreground">
            Keep the week under control.
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" />
              {today}
            </span>
            <Badge variant="secondary">
              {(subscription?.planTier ?? "free").replace("_", " ")} plan
            </Badge>
            {isPreview ? <Badge>Preview data</Badge> : null}
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs">
              {memberCount} member{memberCount === 1 ? "" : "s"} active
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs">
              {membership.role} access for {user?.email ?? "household member"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-11 min-w-[220px] items-center gap-3 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground">
            <Search className="size-4" />
            Search {household.name}
          </div>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
          </button>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
