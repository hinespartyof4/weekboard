import Link from "next/link";

import { marketingNavigation } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export function PublicHeader() {
  return (
    <header className="page-shell sticky top-0 z-30">
      <div className="mt-4 flex items-center justify-between rounded-[calc(var(--radius)+10px)] border border-border/80 bg-card/95 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
        <Logo compact className="shrink-0" />
        <nav className="hidden items-center gap-6 md:flex">
          {marketingNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
