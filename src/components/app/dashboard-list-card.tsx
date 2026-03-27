import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardListCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  emptyMessage: string;
  items: Array<{
    id: string;
    primary: string;
    secondary: string;
  }>;
};

export function DashboardListCard({
  eyebrow,
  title,
  description,
  href,
  emptyMessage,
  items,
}: DashboardListCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <p className="eyebrow">{eyebrow}</p>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Link
            href={href}
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Open ${title}`}
          >
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-[calc(var(--radius)-0.15rem)] border border-border bg-card/95 px-4 py-3"
            >
              <p className="text-sm font-medium text-foreground">{item.primary}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.secondary}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[calc(var(--radius)-0.15rem)] border border-dashed border-border bg-card/80 px-4 py-5 text-sm leading-6 text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
