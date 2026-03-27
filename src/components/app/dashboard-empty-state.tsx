import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardEmptyStateProps = {
  householdName: string;
};

export function DashboardEmptyState({ householdName }: DashboardEmptyStateProps) {
  return (
    <Card className="overflow-hidden border-dashed">
      <CardHeader className="gap-4">
        <div className="space-y-3">
          <p className="eyebrow">Start here</p>
          <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
            {householdName} is ready for its first week.
          </CardTitle>
          <CardDescription className="max-w-2xl text-base leading-7">
            Add a few groceries, pantry staples, chores, or recurring needs and the
            dashboard will start turning into a real control center.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 border-t border-border/70 pt-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Build a shopping list", href: "/app/shopping" },
          { title: "Track pantry staples", href: "/app/pantry" },
          { title: "Add this week’s tasks", href: "/app/tasks" },
          { title: "Set up recurring essentials", href: "/app/recurring" },
        ].map((item) => (
          <Button
            key={item.href}
            asChild
            variant="outline"
            className="h-auto justify-between rounded-[calc(var(--radius)-0.2rem)] px-4 py-4"
          >
            <Link href={item.href}>
              {item.title}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

