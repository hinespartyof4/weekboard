import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoProps = {
  compact?: boolean;
  className?: string;
};

export function Logo({ compact = false, className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex text-foreground",
        compact ? "items-center" : "flex-col items-start gap-2",
        className,
      )}
    >
      <span
        className={cn(
          "relative block overflow-hidden",
          compact ? "h-9 w-[144px]" : "h-11 w-[176px] sm:h-12 sm:w-[192px]",
        )}
      >
        <Image
          src="/weekboard-wordmark.png"
          alt="Weekboard"
          fill
          className="object-contain"
          sizes={compact ? "144px" : "(min-width: 640px) 192px, 176px"}
          priority
        />
      </span>
      {!compact && (
        <span className="pl-1 text-xs text-muted-foreground">
          The weekly control center for your home
        </span>
      )}
    </Link>
  );
}
