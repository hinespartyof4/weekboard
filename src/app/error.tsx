"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="page-shell flex min-h-screen items-center justify-center py-12">
      <div className="panel max-w-lg space-y-4 p-8 text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="font-serif text-4xl tracking-[-0.05em] text-foreground">
          Weekboard hit an unexpected issue.
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          The scaffold includes a shared error boundary so every major flow has a
          graceful fallback from the start.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
