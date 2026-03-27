import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  checklist: string[];
  highlights: { title: string; description: string }[];
};

export function SectionPage({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  checklist,
  highlights,
}: SectionPageProps) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="gap-4 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge>{eyebrow}</Badge>
            <div className="space-y-3">
              <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
                {title}
              </CardTitle>
              <CardDescription className="text-base leading-7 text-muted-foreground">
                {description}
              </CardDescription>
            </div>
          </div>
          <Button asChild size="lg">
            <Link href={ctaHref}>
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 border-t border-border/70 pt-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5">
            <p className="text-sm font-medium text-foreground">Ready for implementation</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              {checklist.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 size-1.5 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-[calc(var(--radius)+2px)] border border-border bg-card/95 p-5"
              >
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
