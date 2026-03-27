"use client";

import Link from "next/link";
import { Lock, ScanLine, X } from "lucide-react";

import type { BarcodeFeatureEntitlement } from "@/lib/barcode/entitlements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type BarcodeLockedModalProps = {
  entitlement: BarcodeFeatureEntitlement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BarcodeLockedModal({
  entitlement,
  open,
  onOpenChange,
}: BarcodeLockedModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="absolute inset-0" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <Card className="relative z-10 w-full max-w-xl overflow-hidden border-border/70 bg-[#f4f1ea] shadow-[0_24px_80px_rgba(30,40,42,0.25)]">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Premium convenience</Badge>
                <Badge>Plus and Home Pro</Badge>
              </div>
              <CardTitle className="font-serif text-3xl tracking-[-0.04em]">
                {entitlement.lockedTitle}
              </CardTitle>
              <CardDescription className="max-w-xl text-base leading-7">
                {entitlement.lockedDescription}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close upgrade prompt"
            >
              <X className="size-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="rounded-[1.75rem] border border-border bg-white/75 p-5">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ScanLine className="size-5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Scan everyday household items and add them in seconds.
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  It is a small luxury, but it makes the fastest capture flow in Weekboard
                  feel even more effortless on a busy week.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-white/70 p-5">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <Lock className="size-5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Included in paid plans</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Barcode scanning is available on Plus and Home Pro. Home Pro still adds
                  multiple shopping lists, deeper recurring support, and more advanced household flexibility.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/app/billing">{entitlement.primaryCtaLabel}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">{entitlement.secondaryCtaLabel}</Link>
              </Button>
            </div>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {entitlement.dismissLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
