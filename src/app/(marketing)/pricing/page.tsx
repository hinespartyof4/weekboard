import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { weekboardPlans } from "@/lib/billing/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const guidancePoints = [
  {
    title: "Start with Free",
    description:
      "A good fit if you want one shared place for the essentials and want to build the habit before expanding your setup.",
  },
  {
    title: "Choose Plus",
    description:
      "The right plan for most active households that want unlimited core records, Weekly Reset email delivery, barcode scanning, and more everyday breathing room.",
  },
  {
    title: "Move to Home Pro",
    description:
      "Best for higher-traffic homes that want multiple shopping lists, deeper recurring support, and higher AI usage.",
  },
];

const comparisonRows = [
  {
    label: "Inventory, tasks, and recurring records",
    values: ["Limited", "Unlimited", "Unlimited"],
  },
  {
    label: "Shopping lists",
    values: ["1", "1", "Multiple"],
  },
  {
    label: "Weekly digest email",
    values: ["Not included", "Included", "Included"],
  },
  {
    label: "Barcode scanning",
    values: ["Not included", "Included", "Included"],
  },
  {
    label: "AI usage",
    values: ["Limited", "Basic", "Higher allowance"],
  },
  {
    label: "Recurring automation support",
    values: ["Basic", "Basic", "Enhanced"],
  },
];

const faqItems = [
  {
    question: "Can I start on Free and upgrade later?",
    answer:
      "Yes. The product is designed so you can begin with a smaller setup, then move into Plus or Home Pro when the household wants more room and automation.",
  },
  {
    question: "Is Plus the plan most households will want?",
    answer:
      "Usually, yes. Plus removes the core record limits and adds the weekly digest, which makes it the most practical fit for many couples and families.",
  },
  {
    question: "Why does Home Pro exist if Plus already covers the basics?",
    answer:
      "Home Pro is for households that want more structure and flexibility, especially around multiple shopping lists, stronger recurring support, and heavier use over time.",
  },
  {
    question: "Will pricing and limits evolve over time?",
    answer:
      "Yes. The current structure is meant to be launch-friendly, clear, and easy to refine as Weekboard learns how households actually use the product.",
  },
];

function SectionHeading(props: {
  badge: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  const centered = props.align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <Badge>{props.badge}</Badge>
      <h1 className="mt-4 font-serif text-5xl tracking-[-0.06em] text-foreground sm:text-6xl">
        {props.title}
      </h1>
      <p className="mt-4 text-base leading-8 text-muted-foreground">{props.description}</p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="page-shell space-y-10 pb-12 pt-12 sm:space-y-14">
      <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Card className="overflow-hidden border-primary/12 bg-[linear-gradient(155deg,rgba(245,249,245,0.98),rgba(231,238,229,0.92))]">
          <CardHeader className="space-y-6 pb-0">
            <SectionHeading
              badge="Pricing"
              title="Simple plans for the way your home actually runs."
              description="Start with the essentials, then unlock more room, more automation, and more shared household visibility as Weekboard becomes part of your weekly rhythm."
            />
          </CardHeader>
          <CardContent className="space-y-4 pt-8">
            <div className="grid gap-3 sm:grid-cols-3">
              {guidancePoints.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-card/95 p-4"
                >
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/90 bg-[linear-gradient(180deg,rgba(247,250,247,0.96),rgba(238,244,237,0.9))]">
          <CardHeader className="space-y-4">
            <Badge variant="secondary">How to choose</Badge>
            <CardTitle className="font-serif text-4xl tracking-[-0.06em]">
              Pay for the level of clarity your household needs.
            </CardTitle>
            <CardDescription className="text-base leading-8">
              The plans are not built around fluff. They are built around how much
              shared household structure, flexibility, and automation you want in daily life.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Free keeps the setup approachable and useful from day one.",
              "Plus is the practical step up once the household relies on Weekboard weekly.",
              "Home Pro is for households that want the fullest version of the system.",
            ].map((line) => (
              <div
                key={line}
                className="flex gap-3 rounded-2xl border border-border bg-card/95 px-4 py-4 text-sm leading-7 text-muted-foreground"
              >
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                <span>{line}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {weekboardPlans.map((plan) => (
          <Card
            key={plan.tier}
            className={plan.featured ? "border-primary/25 bg-card" : "bg-card/95"}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.featured ? <Badge>Recommended</Badge> : null}
              </div>
              <CardDescription className="leading-7">{plan.description}</CardDescription>
                <p className="flex items-end gap-3 text-4xl font-semibold tracking-[-0.06em] text-foreground">
                  <span>{plan.priceLabel}</span>
                  <span className="pb-1 text-sm font-normal tracking-normal text-muted-foreground">
                    {plan.tier === "free" ? "forever" : "per month"}
                  </span>
                </p>
              <p className="text-sm leading-7 text-muted-foreground">{plan.highlight}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" variant={plan.featured ? "default" : "outline"}>
                <Link href={plan.tier === "free" ? "/signup" : "/login?next=/app/billing"}>
                  {plan.tier === "free" ? "Start free" : `Choose ${plan.name}`}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-6 rounded-[calc(var(--radius)+0.8rem)] border border-border/80 bg-card/80 px-4 py-8 sm:px-6 sm:py-10">
        <div className="max-w-3xl">
          <Badge>Plan comparison</Badge>
          <h2 className="mt-4 font-serif text-4xl tracking-[-0.06em] text-foreground sm:text-5xl">
            The important differences, in one place.
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            The structure is intentionally simple: Free for a lighter setup, Plus for
            most active households, and Home Pro for deeper flexibility.
          </p>
        </div>

        <div className="overflow-hidden rounded-[calc(var(--radius)+0.2rem)] border border-border bg-card/95">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] border-b border-border px-4 py-4 text-sm font-medium text-foreground sm:px-6">
            <div>Feature</div>
            <div>Free</div>
            <div>Plus</div>
            <div>Home Pro</div>
          </div>
          {comparisonRows.map((row, index) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-3 px-4 py-4 text-sm leading-7 text-muted-foreground sm:px-6 ${
                index === comparisonRows.length - 1 ? "" : "border-b border-border/80"
              }`}
            >
              <div className="font-medium text-foreground">{row.label}</div>
              {row.values.map((value) => (
                <div key={value}>{value}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {faqItems.map((item) => (
          <Card key={item.question}>
            <CardHeader className="space-y-3">
              <Badge variant="secondary">FAQ</Badge>
              <CardTitle className="text-xl tracking-[-0.03em]">{item.question}</CardTitle>
              <CardDescription className="text-sm leading-7">
                {item.answer}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="overflow-hidden border-primary/12 bg-[linear-gradient(150deg,rgba(245,249,245,0.98),rgba(223,233,221,0.88))]">
          <CardHeader className="space-y-4">
            <Badge>Next step</Badge>
            <CardTitle className="font-serif text-4xl tracking-[-0.06em] sm:text-5xl">
              Start with a cleaner weekly household picture.
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-8">
              Begin on Free if you want to keep the setup light, or move into a paid
              plan when you want more room and a stronger Weekly Reset rhythm.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Start free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login?next=/app/billing">Go to billing</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <Badge variant="secondary">What you are paying for</Badge>
            <CardTitle className="font-serif text-4xl tracking-[-0.06em]">
              More clarity, less household drag.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "A shared view of what the house needs this week.",
              "Fewer dropped details across groceries, tasks, and recurring supplies.",
              "A weekly reset ritual that helps the household stay ahead instead of reacting late.",
            ].map((line) => (
              <div
                key={line}
                className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-card/95 px-4 py-4 text-sm leading-7 text-muted-foreground"
              >
                {line}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
