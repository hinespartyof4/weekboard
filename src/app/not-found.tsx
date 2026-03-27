import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center py-12">
      <div className="panel max-w-lg space-y-4 p-8 text-center">
        <p className="eyebrow">Not found</p>
        <h1 className="font-serif text-4xl tracking-[-0.05em] text-foreground">
          This page isn&apos;t on the board.
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          The link may be outdated, or the feature is still being wired into the
          product.
        </p>
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}

