"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAppContext } from "@/components/providers/auth-provider";
import { appNavigation } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AppMobileNav() {
  const pathname = usePathname();
  const { household, isPreview } = useAppContext();

  return (
    <nav className="space-y-3 md:hidden">
      <div className="rounded-[calc(var(--radius)+4px)] border border-border/80 bg-card/95 px-4 py-4 shadow-sm backdrop-blur-md">
        <p className="eyebrow">Current household</p>
        <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-foreground">
          {household.name}
        </p>
        {isPreview ? <Badge className="mt-3">Preview data</Badge> : null}
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex min-w-max gap-2">
          {appNavigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[120px] flex-col gap-2 rounded-[calc(var(--radius)-0.1rem)] border px-4 py-3 text-sm transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
