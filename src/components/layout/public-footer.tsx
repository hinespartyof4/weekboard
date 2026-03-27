import Link from "next/link";

import { siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="page-shell pb-10 pt-14">
      <div className="flex flex-col gap-6 rounded-[calc(var(--radius)+12px)] border border-border/80 bg-card/95 px-6 py-8 shadow-sm backdrop-blur-sm md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="eyebrow">Weekboard</p>
          <p className="font-serif text-2xl tracking-[-0.04em] text-foreground">
            {siteConfig.tagline}
          </p>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Built for busy couples and families who want one clean place to know what
            the house needs this week.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Login
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
