import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardSummaryCardProps = {
  title: string;
  value: number;
  detail: string;
  emptyDetail: string;
  href: string;
};

export function DashboardSummaryCard({
  title,
  value,
  detail,
  emptyDetail,
  href,
}: DashboardSummaryCardProps) {
  const isEmpty = value === 0;

  return (
    <Card className={isEmpty ? "border-dashed" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Link
            href={href}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Open ${title}`}
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <CardTitle className="text-4xl font-semibold tracking-[-0.05em]">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm leading-6 text-muted-foreground">
          {isEmpty ? emptyDetail : detail}
        </p>
      </CardContent>
    </Card>
  );
}
