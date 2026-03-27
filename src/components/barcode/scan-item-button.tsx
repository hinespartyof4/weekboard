"use client";

import { useState } from "react";
import { Lock, ScanLine } from "lucide-react";

import type { BarcodeFeatureEntitlement } from "@/lib/barcode/entitlements";
import type { BarcodeDestination } from "@/lib/barcode/types";
import { BarcodeLockedModal } from "@/components/barcode/barcode-locked-modal";
import { BarcodeScannerModal } from "@/components/barcode/barcode-scanner-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScanItemButtonProps = {
  entitlement: BarcodeFeatureEntitlement;
  defaultDestination: BarcodeDestination;
};

export function ScanItemButton({ entitlement, defaultDestination }: ScanItemButtonProps) {
  const [open, setOpen] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-2 sm:items-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => (entitlement.hasAccess ? setOpen(true) : setShowLockedModal(true))}
          className={cn(
            "border-border/90 bg-white/75 px-5",
            entitlement.hasAccess
              ? "hover:border-primary/35 hover:bg-white"
              : "text-muted-foreground hover:border-border hover:bg-white/90",
          )}
        >
          {entitlement.hasAccess ? (
            <ScanLine className="size-4" />
          ) : (
            <Lock className="size-4" />
          )}
          Scan item
        </Button>
        <p className="max-w-[15rem] text-right text-xs leading-5 text-muted-foreground">
          {entitlement.helperText}
        </p>
      </div>
      {open ? (
        <BarcodeScannerModal
          defaultDestination={defaultDestination}
          open={open}
          onOpenChange={setOpen}
        />
      ) : null}
      <BarcodeLockedModal
        entitlement={entitlement}
        open={showLockedModal}
        onOpenChange={setShowLockedModal}
      />
    </>
  );
}
