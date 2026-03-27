import Link from "next/link";
import { ArrowRight, Plus, Sparkles } from "lucide-react";

import { DashboardEmptyState } from "@/components/app/dashboard-empty-state";
import { DashboardListCard } from "@/components/app/dashboard-list-card";
import { DashboardSummaryCard } from "@/components/app/dashboard-summary-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatShortDate } from "@/lib/date";
import { getActiveHouseholdContext } from "@/lib/app/context";
import { getDashboardSummary } from "@/lib/dashboard";

export default async function DashboardPage() {
  const context = await getActiveHouseholdContext();
  const summary = await getDashboardSummary(
    context.household.id,
    context.household.name,
    context.household.timezone,
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="gap-6 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge>Dashboard</Badge>
            <div className="space-y-3">
              <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
                What needs attention now.
              </CardTitle>
              <CardDescription className="text-base leading-7">
                A clear weekly view of what {summary.householdName} needs next across
                shopping, pantry, tasks, and recurring essentials.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" size="lg">
              <Link href="/app/weekly-reset">
                Open Weekly Reset
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 border-t border-border/70 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Attention now</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
                  {summary.totalItemsTracked > 0
                    ? "The household view is live and up to date."
                    : "Your dashboard is ready for the first real entries."}
                </p>
              </div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                [
                  "Household",
                  `${context.memberCount} member${context.memberCount === 1 ? "" : "s"} on ${(
                    context.subscription?.planTier ?? "free"
                  ).replace("_", " ")}`,
                ],
                [
                  "Weekly Reset",
                  summary.latestWeeklyReset
                    ? `Latest reset is ${summary.latestWeeklyReset.status} for week of ${formatShortDate(summary.latestWeeklyReset.weekStart)}`
                    : "No Weekly Reset has been generated yet",
                ],
                [
                  "Overdue tasks",
                  summary.overdueTasks.length > 0
                    ? `${summary.overdueTasks.length} task${summary.overdueTasks.length === 1 ? "" : "s"} need attention`
                    : "No overdue tasks right now",
                ],
                [
                  "Low stock",
                  summary.lowStockItems.length > 0
                    ? `${summary.lowStockItems.length} item${summary.lowStockItems.length === 1 ? "" : "s"} should be restocked`
                    : "No low-stock items right now",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border bg-background/80 p-4"
                >
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
              <p className="text-sm font-medium text-foreground">Quick actions</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Capture what changed this week without leaving the main household view.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { title: "Add shopping item", href: "/app/shopping" },
                  { title: "Add inventory item", href: "/app/pantry" },
                  { title: "Add task", href: "/app/tasks" },
                  { title: "Add recurring item", href: "/app/recurring" },
                ].map((item) => (
                  <Button
                    key={item.href}
                    asChild
                    variant="outline"
                    className="h-auto justify-between rounded-[calc(var(--radius)-0.15rem)] px-4 py-4"
                  >
                    <Link href={item.href}>
                      {item.title}
                      <Plus className="size-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
              <p className="text-sm font-medium text-foreground">Why this matters</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Weekboard is strongest when it quietly surfaces the next few decisions:
                what to buy, what to use, what to restock, and what still needs doing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.cards.map((card) => (
          <DashboardSummaryCard key={card.title} {...card} />
        ))}
      </section>

      {!summary.hasAnyData ? (
        <DashboardEmptyState householdName={summary.householdName} />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardListCard
          eyebrow="Pantry"
          title="Low stock items"
          description="Items running low right now, across pantry and household supplies."
          href="/app/pantry"
          emptyMessage="Nothing is low right now. As you track more essentials, this will become a faster restock view."
          items={summary.lowStockItems}
        />
        <DashboardListCard
          eyebrow="Freshness"
          title="Expiring soon"
          description="Use these items soon so they do not quietly fall off the radar."
          href="/app/pantry"
          emptyMessage="Nothing is expiring soon right now. Add expiration dates to pantry and fridge items to make this more useful."
          items={summary.expiringSoonItems}
        />
        <DashboardListCard
          eyebrow="Recurring"
          title="Due soon recurring items"
          description="Regular household needs coming up in the next seven days."
          href="/app/recurring"
          emptyMessage="No recurring items are due soon yet. Add a few regular household needs to build a steadier rhythm."
          items={summary.dueRecurringItems}
        />
        <DashboardListCard
          eyebrow="Tasks"
          title="Overdue tasks"
          description="Open household tasks that need attention before the week slips further."
          href="/app/tasks"
          emptyMessage="No overdue tasks right now. The task list is staying on pace."
          items={summary.overdueTasks}
        />
      </section>
    </div>
  );
}
