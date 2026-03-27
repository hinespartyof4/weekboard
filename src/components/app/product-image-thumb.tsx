"use client";

import { Camera } from "lucide-react";

import { cn } from "@/lib/utils";

type ProductImageThumbProps = {
  imageUrl: string | null;
  name: string;
  className?: string;
};

export function ProductImageThumb({
  imageUrl,
  name,
  className,
}: ProductImageThumbProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-border/80 bg-[#ebe6dc]",
        className,
      )}
      aria-hidden="true"
      title={imageUrl ? `${name} product image` : undefined}
    >
      {imageUrl ? (
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />
      ) : (
        <Camera className="size-4 text-muted-foreground" />
      )}
    </div>
  );
}
