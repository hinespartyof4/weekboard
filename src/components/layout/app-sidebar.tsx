"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useAppContext } from "@/components/providers/auth-provider";
import { appNavigation } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function AppSidebar() {
  const pathname = usePathname();
  const { household, memberCount, membership, subscription, user, isPreview } =
    useAppContext();

  return (
    <aside className="hidden w-[280px] shrink-0 md:block">
      <div className="sticky top-6 flex h-[calc(100svh-3rem)] min-h-0 flex-col gap-4 overflow-hidden rounded-[calc(var(--radius)+12px)] border border-border/80 bg-card/95 p-4 shadow-sm backdrop-blur-md">
        <Logo />
        <div className="panel-muted px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{household.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {memberCount} member{memberCount === 1 ? "" : "s"} • {membership.role}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {user?.email ?? "Signed-in member"}
              </p>
            </div>
            <Badge variant="secondary">
              {(subscription?.planTier ?? "free").replace("_", " ")}
            </Badge>
          </div>
          {isPreview ? (
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Preview mode is using seeded household data for layout and flow testing.
            </p>
          ) : null}
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {appNavigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-secondary/80",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                    isActive
                      ? "bg-primary-foreground/14 text-primary-foreground"
                      : "bg-background text-muted-foreground shadow-sm",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="space-y-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {item.title}
                    {isActive ? <ChevronRight className="size-3.5" /> : null}
                  </span>
                  <span
                    className={cn(
                      "block text-xs leading-5",
                      isActive ? "text-primary-foreground/75" : "text-muted-foreground",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-[calc(var(--radius)+6px)] border border-border bg-[linear-gradient(145deg,rgba(245,249,245,0.96),rgba(223,233,221,0.92))] p-4">
          <p className="eyebrow">Weekly Reset</p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {household.name} stays clearest when the reset is done before the week starts.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Shopping, pantry, recurring needs, and tasks now all have a shared home in
            the app shell.
          </p>
          <div className="mt-4">
            <SignOutButton compact />
          </div>
        </div>
      </div>
    </aside>
  );
}
