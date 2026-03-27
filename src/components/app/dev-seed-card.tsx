"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { seedLocalDemoDataAction } from "@/lib/demo-data/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DevSeedCard() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSeed() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const result = await seedLocalDemoDataAction();
        setMessage(result.message);
        router.refresh();
      } catch (seedError) {
        setError(seedError instanceof Error ? seedError.message : "Unable to seed demo data.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="gap-3 border-b border-border/70 pb-5">
        <Badge variant="secondary">Local development</Badge>
        <div className="space-y-2">
          <CardTitle className="font-serif text-3xl tracking-[-0.05em]">
            Demo data
          </CardTitle>
          <CardDescription className="text-base leading-7">
            Populate an empty household with a realistic starting set of shopping,
            pantry, recurring, and task data for local testing.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <Button type="button" onClick={handleSeed} disabled={isPending}>
          {isPending ? "Adding demo data..." : "Seed demo household"}
        </Button>

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm leading-6 text-emerald-900">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-900">
            {error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
