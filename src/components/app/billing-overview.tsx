"use client";

import { useState, useTransition } from "react";

import { createBillingPortalSessionAction, createCheckoutSessionAction } from "@/lib/billing/actions";
import { getPlanDefinition, isPaidPlan, weekboardPlans } from "@/lib/billing/plans";
import type { BillingPageData } from "@/lib/billing/types";
import { formatShortDate } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type BillingOverviewProps = {
  data: BillingPageData;
};

export function BillingOverview({ data }: BillingOverviewProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentPlan = getPlanDefinition(data.currentPlanTier);
  const usageRows = [
    {
      label: "Inventory items",
      used: data.usage.inventoryItems,
      limit: currentPlan.featuresConfig.inventoryItemLimit,
    },
    {
      label: "Tasks",
      used: data.usage.tasks,
      limit: currentPlan.featuresConfig.taskLimit,
    },
    {
      label: "Recurring items",
      used: data.usage.recurringItems,
      limit: currentPlan.featuresConfig.recurringItemLimit,
    },
    {
      label: "Shopping lists",
      used: data.usage.shoppingLists,
      limit: currentPlan.featuresConfig.shoppingListLimit,
    },
    {
      label: "AI requests this month",
      used: data.usage.aiRequestsThisMonth,
      limit: currentPlan.featuresConfig.aiRequestsPerMonth,
    },
  ];

  function handleCheckout(planTier: "plus" | "home_pro") {
    setMessage(null);
    startTransition(async () => {
      try {
        await createCheckoutSessionAction(planTier);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to open checkout.");
      }
    });
  }

  function handlePortal() {
    setMessage(null);
    startTransition(async () => {
      try {
        await createBillingPortalSessionAction();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Unable to open the billing portal.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="gap-5 border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>Billing</Badge>
              <div className="space-y-2">
                <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
                  Billing for {data.householdName}
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  Keep pricing, usage, and plan controls in one calm place without
                  interrupting the core household workflow.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{currentPlan.name}</Badge>
              <Badge variant="secondary">
                {data.subscription?.status.replace("_", " ") ?? "free"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
            <p className="text-sm font-medium text-foreground">Current plan</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">
              {currentPlan.name}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {currentPlan.description}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">Billing cadence</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {data.subscription?.billingInterval === "year" ? "Yearly" : "Monthly"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">Current period</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {data.subscription?.currentPeriodEnd
                    ? `Ends ${formatShortDate(data.subscription.currentPeriodEnd)}`
                    : "No paid billing period yet"}
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-sm leading-6 text-muted-foreground">
              {currentPlan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {isPaidPlan(data.currentPlanTier) ? (
                <Button
                  type="button"
                  onClick={handlePortal}
                  disabled={isPending || data.isPreview || !data.canManageBilling}
                >
                  Manage subscription
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => handleCheckout("plus")}
                    disabled={isPending || data.isPreview || !data.canManageBilling}
                  >
                    Upgrade to Plus
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCheckout("home_pro")}
                    disabled={isPending || data.isPreview || !data.canManageBilling}
                  >
                    Upgrade to Home Pro
                  </Button>
                </>
              )}
            </div>

            {message ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-900">
                {message}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            {usageRows.map((row) => (
              <div
                key={row.label}
                className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.limit === null ? `${row.used}` : `${row.used} / ${row.limit}`}
                  </p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width:
                        row.limit === null
                          ? "28%"
                          : `${Math.min(100, (row.used / Math.max(row.limit, 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        {weekboardPlans.map((plan) => {
          const isCurrent = plan.tier === data.currentPlanTier;

          return (
            <Card
              key={plan.tier}
              className={plan.featured ? "border-primary/30 bg-card" : undefined}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent ? <Badge>Current</Badge> : null}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <p className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
                  {plan.priceLabel}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {plan.tier === "free" ? "forever" : "per month"}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{plan.highlight}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button className="w-full" disabled>
                    Current plan
                  </Button>
                ) : plan.tier === "free" ? (
                  <Button className="w-full" disabled>
                    Included by default
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.featured ? "default" : "outline"}
                    type="button"
                    onClick={() => handleCheckout(plan.tier as "plus" | "home_pro")}
                    disabled={
                      isPending ||
                      data.isPreview ||
                      !data.canManageBilling ||
                      isPaidPlan(data.currentPlanTier)
                    }
                  >
                    {isPaidPlan(data.currentPlanTier)
                      ? "Use billing portal"
                      : `Choose ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
