import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  PackageOpen,
  Repeat,
  ShoppingCart,
} from "lucide-react";

import { weekboardPlans } from "@/lib/billing/plans";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const problemPoints = [
  "Groceries live in one note, pantry reminders in another, and chores somewhere else entirely.",
  "One partner carries the mental load because there is no shared weekly picture of what the house needs.",
  "By the time something feels urgent, the week is already crowded.",
];

const solutionPoints = [
  "Shopping, pantry, recurring needs, and tasks live in one clear household workspace.",
  "Everyone sees the same priorities without needing a long conversation first.",
  "Weekly Reset gives the home a calm review rhythm before the week starts to sprawl.",
];

const featureRows = [
  {
    title: "Shared shopping that stays current",
    description:
      "Add items fast, keep one default list simple, and let household restocks stay visible to everyone.",
    icon: ShoppingCart,
  },
  {
    title: "Pantry and home inventory in one place",
    description:
      "Track pantry staples, fridge items, cleaning supplies, and low-stock essentials without turning the app into a spreadsheet.",
    icon: PackageOpen,
  },
  {
    title: "Tasks that feel adult and useful",
    description:
      "Assign chores, recurring routines, and one-off to-dos in a way that keeps the house moving without gamification.",
    icon: ClipboardList,
  },
  {
    title: "Recurring needs before they become urgent",
    description:
      "Paper towels, vitamins, detergent, pet food, filters, and the other things you only notice when they are almost gone.",
    icon: Repeat,
  },
];

const weeklyResetSteps = [
  {
    title: "Review what needs attention",
    description:
      "See low-stock items, expiring ingredients, due recurring supplies, overdue tasks, and what still needs doing this week.",
  },
  {
    title: "Add what matters to shopping",
    description:
      "Select the items that need a restock and send them into the shared list without re-entering them by hand.",
  },
  {
    title: "Start the week with context",
    description:
      "Get a short practical summary, decide what matters now, and move into the week with fewer loose ends.",
  },
];

const faqItems = [
  {
    question: "Who is Weekboard for?",
    answer:
      "It is built for busy couples and families who want one shared place to manage the practical side of home life without clutter.",
  },
  {
    question: "Do both people in a household see the same data?",
    answer:
      "Yes. Shopping, pantry, recurring items, tasks, and Weekly Reset are household-based so everyone is working from the same current view.",
  },
  {
    question: "Is Weekboard trying to replace meal planning or complex project management?",
    answer:
      "No. The goal is narrower and more useful: keep the weekly household picture clear, calm, and easy to act on.",
  },
  {
    question: "Can I start simple and add more later?",
    answer:
      "Yes. The product is designed so you can begin with a shared list and Weekly Reset, then add pantry tracking, recurring needs, and task routines over time.",
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
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl space-y-3"}>
      <Badge>{props.badge}</Badge>
      <h2 className="mt-4 font-serif text-4xl tracking-[-0.06em] text-foreground sm:text-5xl">
        {props.title}
      </h2>
      <p className="mt-4 text-base leading-8 text-muted-foreground">{props.description}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="page-shell space-y-12 pb-12 pt-10 sm:space-y-16 sm:pb-16 sm:pt-14">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden border-primary/12 bg-[linear-gradient(155deg,rgba(245,249,245,0.98),rgba(231,238,229,0.92))]">
          <CardHeader className="space-y-7 pb-0">
            <Badge>Weekboard</Badge>
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Image
                  src="/weekboard-hero-logo.png"
                  alt="Weekboard"
                  width={188}
                  height={188}
                  className="h-18 w-18 shrink-0 rounded-[1.6rem] object-cover shadow-sm sm:h-20 sm:w-20"
                  priority
                />
                <div className="space-y-4">
                  <CardTitle className="max-w-4xl font-serif text-5xl tracking-[-0.07em] sm:text-6xl lg:text-7xl">
                    {siteConfig.tagline}
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                    Weekboard gives couples and families one calm place to see the
                    shopping, pantry, tasks, recurring needs, and weekly decisions that
                    keep a home running well.
                  </CardDescription>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "Shared household view",
                  "Simple weekly rhythm",
                  "Designed for real adult life",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border/80 bg-card/95 px-4 py-3 text-sm text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">See full pricing</Link>
              </Button>
            </div>

            <p className="text-sm leading-7 text-muted-foreground">
              Built for busy homes that want one clean place to know what the house
              needs this week.
            </p>
          </CardContent>
        </Card>

        <Card
          id="weekly-reset"
          className="overflow-hidden border-border/90 bg-[linear-gradient(180deg,rgba(247,250,247,0.96),rgba(238,244,237,0.9))]"
        >
          <CardHeader className="space-y-4 border-b border-border/70 pb-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="eyebrow">Hero workflow</p>
                <CardTitle className="font-serif text-3xl tracking-[-0.05em] sm:text-4xl">
                  Weekly Reset
                </CardTitle>
              </div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarRange className="size-5" />
              </span>
            </div>
            <CardDescription className="text-base leading-7">
              The weekly planning ritual that helps the household notice what is low,
              what is due, what should be used soon, and what still needs attention.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-6">
            {[
              ["Low-stock inventory", "Olive oil, paper towels, eggs, dish soap"],
              ["Expiring soon", "Spinach, milk, yogurt, leftovers"],
              ["Recurring due", "Dog food, vitamins, detergent, air filters"],
              ["Tasks this week", "Trash night, laundry reset, school prep"],
              ["Practical summary", "One short weekly briefing before the week gets busy"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-card/95 p-4"
              >
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-foreground">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="overview" className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-4">
            <Badge>Problem</Badge>
            <CardTitle className="font-serif text-4xl tracking-[-0.06em]">
              Household logistics rarely live in one clear place.
            </CardTitle>
            <CardDescription className="text-base leading-8">
              Most homes do not need more systems. They need fewer loose ends, less
              duplicated effort, and one reliable weekly picture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {problemPoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-border bg-card/95 px-4 py-4 text-sm leading-7 text-muted-foreground"
              >
                {point}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/15">
          <CardHeader className="space-y-4">
            <Badge>Solution</Badge>
            <CardTitle className="font-serif text-4xl tracking-[-0.06em]">
              Weekboard gives the home one shared weekly operating view.
            </CardTitle>
            <CardDescription className="text-base leading-8">
              It is not trying to be everything. It is trying to make the practical
              side of home life clearer, lighter, and easier to share.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {solutionPoints.map((point) => (
              <div
                key={point}
                className="flex gap-3 rounded-2xl border border-border bg-card/95 px-4 py-4 text-sm leading-7 text-muted-foreground"
              >
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                <span>{point}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-8">
        <SectionHeading
          badge="Feature overview"
          title="The practical parts of home life, finally connected."
          description="Weekboard is designed around the real categories that create weekly household drag: shopping, inventory, tasks, recurring needs, and the reset that pulls them together."
          align="center"
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureRows.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="h-full">
                <CardHeader className="space-y-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
                    <Icon className="size-5" />
                  </span>
                  <div className="space-y-2">
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription className="leading-7">
                      {feature.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border-primary/12 bg-[linear-gradient(160deg,rgba(245,249,245,0.98),rgba(223,233,221,0.88))]">
          <CardHeader className="space-y-4">
            <Badge>Why it matters</Badge>
            <CardTitle className="font-serif text-4xl tracking-[-0.06em]">
              Weekly Reset is the part families come back to.
            </CardTitle>
            <CardDescription className="text-base leading-8">
              It turns scattered household data into one calm review flow, so the week
              can start with better context and fewer small surprises.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklyResetSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-card/95 p-5"
              >
                <p className="eyebrow">Step {index + 1}</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-foreground">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <Badge variant="secondary">Inside a good week</Badge>
            <CardTitle className="font-serif text-4xl tracking-[-0.06em]">
              A calmer weekly rhythm, without a heavier system.
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Sunday evening",
                detail:
                  "Open Weekly Reset, scan what is low, and send the right items to shopping in one pass.",
              },
              {
                title: "Midweek",
                detail:
                  "Add groceries, check pantry context, and see what recurring household needs are coming up next.",
              },
              {
                title: "Task coordination",
                detail:
                  "Keep chores and due dates visible without turning the household into a project board.",
              },
              {
                title: "Shared visibility",
                detail:
                  "Both adults can see the same picture, which reduces re-asking, forgetting, and carrying the whole mental list alone.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-card/95 p-5"
              >
                <p className="text-base font-semibold tracking-[-0.03em] text-foreground">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section
        id="pricing"
        className="space-y-8 rounded-[calc(var(--radius)+0.8rem)] border border-border/80 bg-card/80 px-4 py-8 sm:px-6 sm:py-10"
      >
        <SectionHeading
          badge="Pricing"
          title="Start simple, then grow into the full household rhythm."
          description="The plans are structured to support a real launch: useful on day one, with room for deeper automation and higher-traffic households later."
          align="center"
        />

        <div className="grid gap-5 lg:grid-cols-3">
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
                <p className="text-4xl font-semibold tracking-[-0.06em] text-foreground">
                  {plan.priceLabel}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {plan.tier === "free" ? "forever" : "per month"}
                  </span>
                </p>
                <p className="text-sm leading-7 text-muted-foreground">{plan.highlight}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={plan.featured ? "default" : "outline"}>
                  <Link href={plan.tier === "free" ? "/signup" : "/pricing"}>
                    {plan.tier === "free" ? "Start free" : `Choose ${plan.name}`}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Card className="overflow-hidden border-primary/12 bg-[linear-gradient(150deg,rgba(245,249,245,0.98),rgba(223,233,221,0.88))]">
          <CardHeader className="space-y-4">
            <Badge>CTA</Badge>
            <CardTitle className="font-serif text-4xl tracking-[-0.06em] sm:text-5xl">
              Give the household one place to look each week.
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-8">
              Start with the basics, keep the setup clean, and build a steadier weekly
              rhythm without adding more noise.
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
              <Link href="/login">Log in</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <Badge variant="secondary">Practical fit</Badge>
            <CardTitle className="font-serif text-4xl tracking-[-0.06em]">
              Built for homes, not teams.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "No points, no streaks, no childish reward loops.",
              "No cluttered dashboards trying to impress you with more than you need.",
              "Just a clear weekly control center for the practical side of home life.",
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

      <section id="faq" className="space-y-8">
        <SectionHeading
          badge="FAQ"
          title="A few useful questions, answered simply."
          description="Weekboard is intentionally focused. The goal is to make the practical side of home life easier to share, not to turn the household into a complicated system."
          align="center"
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {faqItems.map((item) => (
            <Card key={item.question}>
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl tracking-[-0.03em]">{item.question}</CardTitle>
                <CardDescription className="text-sm leading-7">
                  {item.answer}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
