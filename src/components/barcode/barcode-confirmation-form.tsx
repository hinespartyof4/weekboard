"use client";

import { Camera, RefreshCw, Search } from "lucide-react";

import type { BarcodeConfirmationValues, BarcodeDestination, BarcodeLookupProduct } from "@/lib/barcode/types";
import type { StorageLocation } from "@/lib/pantry/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BarcodeConfirmationFormProps = {
  values: BarcodeConfirmationValues;
  lookupProduct: BarcodeLookupProduct | null;
  lookupMode: "mock" | "live" | null;
  errorMessage: string | null;
  notice: string | null;
  isPending: boolean;
  storageLocationOptions: Array<{ value: StorageLocation; label: string }>;
  onChange: <Key extends keyof BarcodeConfirmationValues>(
    key: Key,
    value: BarcodeConfirmationValues[Key],
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onScanAgain: () => void;
  onManualBarcode: () => void;
};

const destinationOptions: Array<{ value: BarcodeDestination; label: string }> = [
  { value: "shopping", label: "Shopping list" },
  { value: "inventory", label: "Household inventory" },
];

export function BarcodeConfirmationForm({
  values,
  lookupProduct,
  lookupMode,
  errorMessage,
  notice,
  isPending,
  storageLocationOptions,
  onChange,
  onSubmit,
  onScanAgain,
  onManualBarcode,
}: BarcodeConfirmationFormProps) {
  const lookupBadgeLabel =
    lookupMode === "mock"
      ? "Sample match"
      : lookupMode === "live"
        ? lookupProduct
          ? "Live catalog match"
          : "Live catalog checked"
        : null;

  const lookupSummary =
    lookupMode === "mock"
      ? "This item is using Weekboard sample data so you can test the flow locally."
      : lookupMode === "live"
        ? lookupProduct
          ? "This item came back from the live product catalog."
          : "Weekboard checked the live product catalog, but no product match came back."
        : "Review the details once, then send the item to the right place.";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-border bg-white/75 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div
                className={cn(
                  "flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.35rem] border border-border bg-[#e9e4db]",
                  lookupProduct?.imageUrl ? "bg-cover bg-center" : "",
                )}
                style={
                  lookupProduct?.imageUrl
                    ? { backgroundImage: `url(${lookupProduct.imageUrl})` }
                    : undefined
                }
              >
                {!lookupProduct?.imageUrl ? (
                  <Camera className="size-6 text-muted-foreground" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {lookupBadgeLabel ? <Badge variant="secondary">{lookupBadgeLabel}</Badge> : null}
                  {lookupProduct?.brand ? <Badge variant="secondary">{lookupProduct.brand}</Badge> : null}
                  {lookupProduct?.source === "barcodelookup" ? (
                    <Badge variant="secondary">Barcode Lookup</Badge>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium text-foreground">
                    {lookupProduct?.title ?? "Finish the item details"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {values.barcode ? `Barcode ${values.barcode}` : "No barcode saved"}
                  </p>
                </div>
                {notice ? (
                  <p className="text-sm leading-6 text-muted-foreground">{notice}</p>
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">{lookupSummary}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Destination</span>
              <select
                value={values.destination}
                onChange={(event) =>
                  onChange("destination", event.target.value as BarcodeDestination)
                }
                className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none"
              >
                {destinationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Barcode</span>
              <Input
                value={values.barcode}
                onChange={(event) => onChange("barcode", event.target.value)}
                inputMode="numeric"
                placeholder="Optional barcode"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Item name</span>
              <Input
                value={values.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="Item name"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Category</span>
              <Input
                value={values.category}
                onChange={(event) => onChange("category", event.target.value)}
                placeholder="Category"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Quantity</span>
              <Input
                value={values.quantity}
                onChange={(event) => onChange("quantity", event.target.value)}
                placeholder="1"
                inputMode="decimal"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Unit</span>
              <Input
                value={values.unit}
                onChange={(event) => onChange("unit", event.target.value)}
                placeholder="Pack, bottle, count"
              />
            </label>

            {values.destination === "shopping" ? (
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Preferred store</span>
                <Input
                  value={values.preferredStore}
                  onChange={(event) => onChange("preferredStore", event.target.value)}
                  placeholder="Optional"
                />
              </label>
            ) : null}

            {values.destination === "inventory" ? (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Storage location</span>
                  <select
                    value={values.storageLocation}
                    onChange={(event) =>
                      onChange("storageLocation", event.target.value as StorageLocation)
                    }
                    className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none"
                  >
                    {storageLocationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Expiration date</span>
                  <Input
                    type="date"
                    value={values.expirationDate}
                    onChange={(event) => onChange("expirationDate", event.target.value)}
                  />
                </label>
              </>
            ) : null}

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Notes</span>
              <textarea
                value={values.notes}
                onChange={(event) => onChange("notes", event.target.value)}
                placeholder={
                  values.destination === "shopping"
                    ? "Optional store or quantity notes"
                    : "Optional storage or usage notes"
                }
                className="min-h-[112px] rounded-[calc(var(--radius)-0.15rem)] border border-border bg-white/80 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40"
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-border bg-white/70 p-5">
            <p className="text-sm font-medium text-foreground">What happens next</p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Weekboard saves this to the active household and keeps the scanned product
                details attached when they are available.
              </p>
              <p>
                You can still update quantity, category, or destination-specific details
                after the first save.
              </p>
            </div>
          </div>

          {lookupMode === "mock" ? (
            <div className="rounded-[1.75rem] border border-border bg-white/70 p-5">
              <p className="text-sm font-medium text-foreground">Testing locally</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This environment is using built-in sample product matches. Add a real
                barcode lookup API key when you want genuine catalog matches.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-900">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onScanAgain}>
            <RefreshCw className="size-4" />
            Scan again
          </Button>
          <Button type="button" variant="outline" onClick={onManualBarcode}>
            <Search className="size-4" />
            Enter another barcode
          </Button>
        </div>
        <Button type="submit" disabled={isPending}>
          {values.destination === "shopping" ? "Add to shopping list" : "Add to inventory"}
        </Button>
      </div>
    </form>
  );
}
