"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Repeat2,
  Sparkles,
  ShoppingCart,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureClientEvent } from "@/lib/analytics/client";
import { generateWeeklyResetSummaryAction } from "@/lib/ai/actions";
import { addWeeklyResetSelectionsToShoppingListAction } from "@/lib/weekly-reset/actions";
import type { WeeklyResetData } from "@/lib/weekly-reset/types";
import { formatShortDate } from "@/lib/date";
import { useAppContext } from "@/components/providers/auth-provider";

type WeeklyResetBoardProps = {
  data: WeeklyResetData;
};

function getPriorityTone(priority: "low" | "medium" | "high") {
  switch (priority) {
    case "high":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function WeeklyResetBoard({ data }: WeeklyResetBoardProps) {
  const router = useRouter();
  const { household, isPreview } = useAppContext();
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>(
    data.lowStockItems.map((item) => item.id),
  );
  const [selectedRecurringIds, setSelectedRecurringIds] = useState<string[]>(
    data.recurringDueItems.map((item) => item.id),
  );
  const [aiSummary, setAiSummary] = useState(data.aiSummary);
  const [aiSummaryGeneratedAt, setAiSummaryGeneratedAt] = useState(data.aiSummaryGeneratedAt);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startAction] = useTransition();

  const selectedCount = useMemo(
    () => selectedInventoryIds.length + selectedRecurringIds.length,
    [selectedInventoryIds, selectedRecurringIds],
  );

  useEffect(() => {
    if (isPreview) {
      return;
    }

    captureClientEvent(analyticsEvents.weeklyResetViewed, {
      household_id: household.id,
      week_range: data.weekRangeLabel,
      low_stock_count: data.summary.lowStockCount,
      expiring_soon_count: data.summary.expiringSoonCount,
      recurring_due_count: data.summary.recurringDueCount,
      overdue_tasks_count: data.summary.overdueTasksCount,
      due_this_week_tasks_count: data.summary.dueThisWeekTasksCount,
    });
  }, [
    data.summary.dueThisWeekTasksCount,
    data.summary.expiringSoonCount,
    data.summary.lowStockCount,
    data.summary.overdueTasksCount,
    data.summary.recurringDueCount,
    data.weekRangeLabel,
    household.id,
    isPreview,
  ]);

  function toggleSelection(
    id: string,
    setState: Dispatch<SetStateAction<string[]>>,
  ) {
    setState((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function handleAddSelected() {
    setErrorMessage(null);
    setMessage(null);

    startAction(async () => {
      try {
        const result = await addWeeklyResetSelectionsToShoppingListAction({
          inventoryItemIds: selectedInventoryIds,
          recurringItemIds: selectedRecurringIds,
        });
        setMessage(result.message);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  function handleGenerateSummary() {
    setErrorMessage(null);
    setMessage(null);

    startAction(async () => {
      try {
        const result = await generateWeeklyResetSummaryAction();
        setAiSummary(result.summary);
        setAiSummaryGeneratedAt(result.generatedAt);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="gap-5 border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>Weekly Reset</Badge>
              <div className="space-y-2">
                <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
                  Weekly household review
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  A calm reset for {data.householdName}. Review what needs attention, add
                  the essentials to shopping, and step into the week with fewer loose ends.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{data.weekRangeLabel}</Badge>
              <Badge variant="secondary">
                {data.summary.totalNeedsAttention} items needing attention
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {[
              { label: "Low stock", value: data.summary.lowStockCount },
              { label: "Expiring soon", value: data.summary.expiringSoonCount },
              { label: "Recurring due", value: data.summary.recurringDueCount },
              { label: "Overdue tasks", value: data.summary.overdueTasksCount },
              { label: "Due this week", value: data.summary.dueThisWeekTasksCount },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-white/75 px-4 py-4"
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 font-serif text-3xl tracking-[-0.04em] text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[calc(var(--radius)-0.05rem)] border border-border bg-white/70 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Shopping additions</p>
              <p className="text-sm text-muted-foreground">
                Selected low-stock inventory and recurring essentials can go straight onto
                the shopping list from here.
              </p>
            </div>
            <Button onClick={handleAddSelected} disabled={isPending || selectedCount === 0}>
              <ShoppingCart className="size-4" />
              Add selected to shopping ({selectedCount})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <Card className="border-border/80 bg-white/70">
            <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <CardTitle>Weekly summary</CardTitle>
                    <CardDescription>
                      A short briefing on what the house needs this week.
                    </CardDescription>
                  </div>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {aiSummary ??
                    "Generate a concise summary to start the reset with a quick read instead of scanning every section first."}
                </p>
                {aiSummaryGeneratedAt ? (
                  <p className="text-xs text-muted-foreground">
                    Generated {new Date(aiSummaryGeneratedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              <Button type="button" variant="outline" onClick={handleGenerateSummary} disabled={isPending}>
                <Sparkles className="size-4" />
                {aiSummary ? "Refresh summary" : "Generate summary"}
              </Button>
            </CardHeader>
          </Card>

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
              {message}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-900">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/80 bg-white/70">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <CardTitle>Low-stock items</CardTitle>
                    <CardDescription>Select what should be restocked this week.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lowStockItems.length === 0 ? (
                  <p className="text-sm leading-7 text-muted-foreground">
                    Nothing looks low right now. Pantry tracking is in a good place for the week.
                  </p>
                ) : (
                  data.lowStockItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 rounded-[calc(var(--radius)-0.1rem)] border border-border bg-background/70 px-4 py-4"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInventoryIds.includes(item.id)}
                        onChange={() => toggleSelection(item.id, setSelectedInventoryIds)}
                        className="mt-1 size-4 rounded border-border"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          {item.category ? <Badge variant="secondary">{item.category}</Badge> : null}
                          <Badge>Low stock</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}
                          {item.unit ? ` ${item.unit}` : ""} left in {item.storageLocation}
                        </p>
                        {item.lowStockThreshold !== null ? (
                          <p className="text-sm text-muted-foreground">
                            Threshold: {item.lowStockThreshold}
                            {item.unit ? ` ${item.unit}` : ""}
                          </p>
                        ) : null}
                      </div>
                    </label>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-white/70">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <CalendarClock className="size-5" />
                  </div>
                  <div>
                    <CardTitle>Expiring soon</CardTitle>
                    <CardDescription>Review what should be used up first.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.expiringSoonItems.length === 0 ? (
                  <p className="text-sm leading-7 text-muted-foreground">
                    No tracked inventory is expiring in the next week.
                  </p>
                ) : (
                  data.expiringSoonItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-background/70 px-4 py-4"
                    >
                      <div className="flex flex-wrap gap-2">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        {item.category ? <Badge variant="secondary">{item.category}</Badge> : null}
                        {item.isExpired ? (
                          <Badge className="bg-rose-600 text-white hover:bg-rose-600">
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Use soon</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.expirationDate ? formatShortDate(item.expirationDate) : "No date"} in{" "}
                        {item.storageLocation}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-white/70">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Repeat2 className="size-5" />
                  </div>
                  <div>
                    <CardTitle>Recurring due this week</CardTitle>
                    <CardDescription>Select regular essentials to add to shopping.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recurringDueItems.length === 0 ? (
                  <p className="text-sm leading-7 text-muted-foreground">
                    No recurring items are due this week.
                  </p>
                ) : (
                  data.recurringDueItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 rounded-[calc(var(--radius)-0.1rem)] border border-border bg-background/70 px-4 py-4"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecurringIds.includes(item.id)}
                        onChange={() => toggleSelection(item.id, setSelectedRecurringIds)}
                        className="mt-1 size-4 rounded border-border"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          {item.category ? <Badge variant="secondary">{item.category}</Badge> : null}
                          {item.autoAddToShoppingList ? (
                            <Badge variant="secondary">Auto-add enabled</Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.defaultQuantity}
                          {item.unit ? ` ${item.unit}` : ""} • {item.frequencyLabel}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span>Due {formatShortDate(item.nextDueDate)}</span>
                          {item.preferredStore ? <span>Store: {item.preferredStore}</span> : null}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-white/70">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <ClipboardList className="size-5" />
                  </div>
                  <div>
                    <CardTitle>Tasks this week</CardTitle>
                    <CardDescription>Review what still needs household attention.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Overdue</p>
                    <Badge variant="secondary">{data.overdueTasks.length}</Badge>
                  </div>
                  {data.overdueTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No overdue tasks.</p>
                  ) : (
                    data.overdueTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-background/70 px-4 py-4"
                      >
                        <div className="flex flex-wrap gap-2">
                          <p className="text-sm font-medium text-foreground">{task.title}</p>
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs",
                              getPriorityTone(task.priority),
                            )}
                          >
                            {task.priority}
                          </span>
                          {task.assignedLabel ? (
                            <Badge variant="secondary">{task.assignedLabel}</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Due {formatShortDate(task.dueDate)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Due this week</p>
                    <Badge variant="secondary">{data.dueThisWeekTasks.length}</Badge>
                  </div>
                  {data.dueThisWeekTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No task deadlines coming up this week.</p>
                  ) : (
                    data.dueThisWeekTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-background/70 px-4 py-4"
                      >
                        <div className="flex flex-wrap gap-2">
                          <p className="text-sm font-medium text-foreground">{task.title}</p>
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs",
                              getPriorityTone(task.priority),
                            )}
                          >
                            {task.priority}
                          </span>
                          {task.assignedLabel ? (
                            <Badge variant="secondary">{task.assignedLabel}</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Due {formatShortDate(task.dueDate)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>One calm pass through the week</CardTitle>
          <CardDescription>
            Weekly Reset brings the home into focus without turning the app into an admin
            dashboard. Review what matters, choose what belongs on the list, and move on.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Starts with what needs attention",
              description:
                "Low-stock inventory, expiring food, due recurring needs, and urgent tasks all surface together.",
            },
            {
              title: "Shopping stays selective",
              description:
                "Only the items you choose move into the shopping flow, so the list stays practical.",
            },
            {
              title: "Built for the weekly habit",
              description:
                "The page is structured like a short household ritual rather than a dense management screen.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-white/70 px-4 py-4"
            >
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
