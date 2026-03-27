"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Filter,
  Package2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { generateUseWhatWeHaveIdeasAction } from "@/lib/ai/actions";
import type { UseWhatWeHaveResult } from "@/lib/ai/types";
import {
  createInventoryItemAction,
  deleteInventoryItemAction,
  updateInventoryItemAction,
} from "@/lib/pantry/actions";
import {
  storageLocationOptions,
  type PantryBoardData,
  type PantryItemInput,
  type PantryItemRecord,
  type StorageLocation,
} from "@/lib/pantry/types";
import { ScanItemButton } from "@/components/barcode/scan-item-button";
import { BarcodeSaveFeedback } from "@/components/barcode/barcode-save-feedback";
import { ProductImageThumb } from "@/components/app/product-image-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PantryBoardProps = {
  data: PantryBoardData;
};

type EditingValues = {
  name: string;
  category: string;
  storageLocation: StorageLocation;
  quantity: string;
  unit: string;
  lowStockThreshold: string;
  expirationDate: string;
  notes: string;
};

type PantryItemsAction =
  | { type: "add"; item: PantryItemRecord }
  | { type: "patch"; itemId: string; patch: Partial<PantryItemRecord> }
  | { type: "remove"; itemId: string };

const storageLocationLabels: Record<StorageLocation, string> = {
  pantry: "Pantry",
  fridge: "Fridge",
  freezer: "Freezer",
  cleaning: "Cleaning",
  bathroom: "Bathroom",
  laundry: "Laundry",
  other: "Other",
};

function formatDecimal(value: number | null) {
  if (value === null) {
    return "";
  }

  return Number.isInteger(value) ? String(value) : String(value);
}

function getEditingValues(item?: PantryItemRecord): EditingValues {
  return {
    name: item?.name ?? "",
    category: item?.category ?? "",
    storageLocation: item?.storageLocation ?? "pantry",
    quantity: item ? formatDecimal(item.quantity) : "1",
    unit: item?.unit ?? "",
    lowStockThreshold: item ? formatDecimal(item.lowStockThreshold) : "",
    expirationDate: item?.expirationDate ?? "",
    notes: item?.notes ?? "",
  };
}

function createInputFromValues(values: EditingValues): PantryItemInput {
  return {
    name: values.name,
    category: values.category,
    storageLocation: values.storageLocation,
    quantity: values.quantity,
    unit: values.unit,
    lowStockThreshold: values.lowStockThreshold,
    expirationDate: values.expirationDate,
    notes: values.notes,
  };
}

function normalizeOptional(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function getDerivedStatus(quantity: number, threshold: number | null) {
  if (quantity === 0) {
    return "out_of_stock" as const;
  }

  if (threshold !== null && quantity <= threshold) {
    return "low" as const;
  }

  return "in_stock" as const;
}

function buildOptimisticItem(
  values: EditingValues,
  householdId: string,
  nowDate: string,
): PantryItemRecord {
  const quantity = Number(values.quantity);
  const lowStockThreshold = values.lowStockThreshold.trim()
    ? Number(values.lowStockThreshold)
    : null;
  const expirationDate = normalizeOptional(values.expirationDate);
  const expiringSoonBoundary = new Date(`${nowDate}T00:00:00Z`);
  expiringSoonBoundary.setUTCDate(expiringSoonBoundary.getUTCDate() + 7);
  const expiringSoonDate = expiringSoonBoundary.toISOString().slice(0, 10);
  const isExpired = expirationDate !== null && expirationDate < nowDate;
  const isExpiringSoon =
    expirationDate !== null &&
    expirationDate >= nowDate &&
    expirationDate <= expiringSoonDate;

  return {
    id: `temp-${crypto.randomUUID()}`,
    householdId,
    name: values.name.trim(),
    category: normalizeOptional(values.category),
    storageLocation: values.storageLocation,
    quantity,
    unit: normalizeOptional(values.unit),
    lowStockThreshold,
    expirationDate,
    notes: normalizeOptional(values.notes),
    status: getDerivedStatus(quantity, lowStockThreshold),
    barcode: null,
    productBrand: null,
    productImageUrl: null,
    isLowStock: lowStockThreshold !== null && quantity <= lowStockThreshold,
    isExpiringSoon,
    isExpired,
  };
}

function formatQuantity(item: PantryItemRecord) {
  if (item.unit) {
    return `${item.quantity} ${item.unit}`;
  }

  return String(item.quantity);
}

function formatExpirationLabel(item: PantryItemRecord) {
  if (!item.expirationDate) {
    return null;
  }

  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${item.expirationDate}T00:00:00Z`));

  if (item.isExpired) {
    return `Expired ${formatted}`;
  }

  if (item.isExpiringSoon) {
    return `Use by ${formatted}`;
  }

  return `Expires ${formatted}`;
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getSummary(items: PantryItemRecord[]) {
  return {
    totalItems: items.length,
    lowStockCount: items.filter((item) => item.isLowStock).length,
    expiringSoonCount: items.filter((item) => item.isExpiringSoon).length,
    expiredCount: items.filter((item) => item.isExpired).length,
  };
}

function hasValidQuantity(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  const parsed = Number(normalized);
  return !Number.isNaN(parsed) && parsed >= 0;
}

export function PantryBoard({ data }: PantryBoardProps) {
  const router = useRouter();
  const [items, updateItems] = useOptimistic(
    data.items,
    (currentItems, action: PantryItemsAction) => {
      switch (action.type) {
        case "add":
          return [action.item, ...currentItems];
        case "patch":
          return currentItems.map((item) =>
            item.id === action.itemId ? { ...item, ...action.patch } : item,
          );
        case "remove":
          return currentItems.filter((item) => item.id !== action.itemId);
        default:
          return currentItems;
      }
    },
  );
  const [quickAddName, setQuickAddName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState<StorageLocation | "all">("all");
  const [showDetailedForm, setShowDetailedForm] = useState(items.length === 0);
  const [createValues, setCreateValues] = useState<EditingValues>(getEditingValues());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<EditingValues>(getEditingValues());
  const [selectedIdeaItemIds, setSelectedIdeaItemIds] = useState<string[]>([]);
  const [useWhatWeHaveResult, setUseWhatWeHaveResult] = useState<UseWhatWeHaveResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startAction] = useTransition();
  const summary = useMemo(() => getSummary(items), [items]);

  const categories = useMemo(() => {
    const values = new Set<string>();

    items.forEach((item) => {
      if (item.category) {
        values.add(item.category);
      }
    });

    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = categoryFilter === "all" ? true : item.category === categoryFilter;
      const matchesLocation =
        locationFilter === "all" ? true : item.storageLocation === locationFilter;

      return matchesCategory && matchesLocation;
    });
  }, [categoryFilter, items, locationFilter]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<StorageLocation, PantryItemRecord[]>>(
      (groups, item) => {
        const nextGroups = { ...groups };
        const existing = nextGroups[item.storageLocation] ?? [];
        nextGroups[item.storageLocation] = [...existing, item];
        return nextGroups;
      },
      {} as Record<StorageLocation, PantryItemRecord[]>,
    );
  }, [filteredItems]);

  async function runAction(action: () => Promise<void>) {
    setErrorMessage(null);
    startAction(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  function applyOptimisticItem(item: PantryItemRecord) {
    updateItems({ type: "add", item });
  }

  function patchOptimisticItem(itemId: string, patch: Partial<PantryItemRecord>) {
    updateItems({ type: "patch", itemId, patch });
  }

  function removeOptimisticItem(itemId: string) {
    updateItems({ type: "remove", itemId });
  }

  function resetCreateForm() {
    setCreateValues(getEditingValues());
  }

  function toggleIdeaSelection(itemId: string) {
    setSelectedIdeaItemIds((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : [...current, itemId],
    );
  }

  function handleQuickAdd() {
    const name = quickAddName.trim();

    if (!name) {
      return;
    }

    const optimisticItem = buildOptimisticItem(
      { ...getEditingValues(), name },
      data.householdId,
      getTodayDateString(),
    );

    applyOptimisticItem(optimisticItem);
    setQuickAddName("");

    void runAction(async () => {
      await createInventoryItemAction({
        name,
        storageLocation: "pantry",
        quantity: "1",
      });
    });
  }

  function handleDetailedCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = createValues.name.trim();

    if (!name) {
      setErrorMessage("Item name is required.");
      return;
    }

    if (!hasValidQuantity(createValues.quantity)) {
      setErrorMessage("Quantity must be a valid non-negative number.");
      return;
    }

    const optimisticItem = buildOptimisticItem(
      createValues,
      data.householdId,
      getTodayDateString(),
    );

    applyOptimisticItem(optimisticItem);
    resetCreateForm();
    setShowDetailedForm(false);

    void runAction(async () => {
      await createInventoryItemAction(createInputFromValues(createValues));
    });
  }

  function startEditing(item: PantryItemRecord) {
    setEditingItemId(item.id);
    setEditingValues(getEditingValues(item));
  }

  function cancelEditing() {
    setEditingItemId(null);
    setEditingValues(getEditingValues());
  }

  function handleSaveEdit(itemId: string) {
    const name = editingValues.name.trim();

    if (!name) {
      setErrorMessage("Item name is required.");
      return;
    }

    if (!hasValidQuantity(editingValues.quantity)) {
      setErrorMessage("Quantity must be a valid non-negative number.");
      return;
    }

    const optimisticItem = buildOptimisticItem(
      editingValues,
      data.householdId,
      getTodayDateString(),
    );

    patchOptimisticItem(itemId, {
      name: optimisticItem.name,
      category: optimisticItem.category,
      storageLocation: optimisticItem.storageLocation,
      quantity: optimisticItem.quantity,
      unit: optimisticItem.unit,
      lowStockThreshold: optimisticItem.lowStockThreshold,
      expirationDate: optimisticItem.expirationDate,
      notes: optimisticItem.notes,
      status: optimisticItem.status,
      isLowStock: optimisticItem.isLowStock,
      isExpiringSoon: optimisticItem.isExpiringSoon,
      isExpired: optimisticItem.isExpired,
    });
    cancelEditing();

    void runAction(async () => {
      await updateInventoryItemAction(itemId, createInputFromValues(editingValues));
    });
  }

  function handleDelete(itemId: string) {
    removeOptimisticItem(itemId);
    void runAction(async () => {
      await deleteInventoryItemAction(itemId);
    });
  }

  function handleGenerateIdeas() {
    setErrorMessage(null);
    startAction(async () => {
      try {
        const result = await generateUseWhatWeHaveIdeasAction({
          itemIds: selectedIdeaItemIds,
        });
        setUseWhatWeHaveResult(result);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  const totalItemsLabel = `${items.length} item${items.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="gap-5 border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>Pantry</Badge>
              <div className="space-y-2">
                <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
                  Household inventory
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  Keep staples, freezer stock, and household supplies visible for{" "}
                  {data.householdName}. Low stock and freshness signals stay easy to spot.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{totalItemsLabel}</Badge>
              <Badge variant="secondary">{summary.lowStockCount} low stock</Badge>
              <Badge variant="secondary">{summary.expiringSoonCount} expiring soon</Badge>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {[
              {
                label: "Total tracked",
                value: summary.totalItems,
              },
              {
                label: "Low stock",
                value: summary.lowStockCount,
              },
              {
                label: "Expiring soon",
                value: summary.expiringSoonCount,
              },
              {
                label: "Expired",
                value: summary.expiredCount,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-white/75 px-4 py-4"
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 font-serif text-3xl tracking-[-0.04em] text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-[calc(var(--radius)-0.15rem)] border border-border bg-white/70 p-2">
              <Input
                value={quickAddName}
                onChange={(event) => setQuickAddName(event.target.value)}
                placeholder="Quick add olive oil, yogurt, dishwasher pods..."
                className="border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleQuickAdd();
                  }
                }}
              />
              <Button onClick={handleQuickAdd} disabled={isPending || !quickAddName.trim()}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDetailedForm((current) => !current)}
            >
              {showDetailedForm ? "Hide details form" : "Add with details"}
            </Button>
            <ScanItemButton
              entitlement={data.barcodeScanning}
              defaultDestination="inventory"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <BarcodeSaveFeedback />
          <Card className="border-border/80 bg-white/70">
            <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <CardTitle>Use What We Have</CardTitle>
                    <CardDescription>
                      Select pantry or fridge items below for grounded meal or usage ideas.
                    </CardDescription>
                  </div>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  Choose a handful of ingredients or household items, then generate 3 to 5 practical ideas with only a few realistic missing items to buy if needed.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateIdeas}
                disabled={isPending || selectedIdeaItemIds.length === 0}
              >
                <Sparkles className="size-4" />
                Generate ideas ({selectedIdeaItemIds.length})
              </Button>
            </CardHeader>
            {useWhatWeHaveResult ? (
              <CardContent className="grid gap-3 md:grid-cols-2">
                {useWhatWeHaveResult.ideas.map((idea) => (
                  <div
                    key={idea.title}
                    className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-background/70 px-4 py-4"
                  >
                    <p className="text-sm font-medium text-foreground">{idea.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {idea.summary}
                    </p>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Use
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {idea.uses.join(", ")}
                    </p>
                    {idea.missing_items.length > 0 ? (
                      <>
                        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          Missing items
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {idea.missing_items.join(", ")}
                        </p>
                      </>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            ) : null}
          </Card>

          {showDetailedForm ? (
            <form
              onSubmit={handleDetailedCreate}
              className="grid gap-3 rounded-[calc(var(--radius)-0.05rem)] border border-border bg-white/70 p-4 md:grid-cols-2"
            >
              <Input
                value={createValues.name}
                onChange={(event) =>
                  setCreateValues((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Item name"
                required
              />
              <Input
                value={createValues.category}
                onChange={(event) =>
                  setCreateValues((current) => ({ ...current, category: event.target.value }))
                }
                placeholder="Category"
              />
              <select
                value={createValues.storageLocation}
                onChange={(event) =>
                  setCreateValues((current) => ({
                    ...current,
                    storageLocation: event.target.value as StorageLocation,
                  }))
                }
                className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none"
              >
                {storageLocationOptions.map((location) => (
                  <option key={location} value={location}>
                    {storageLocationLabels[location]}
                  </option>
                ))}
              </select>
              <Input
                value={createValues.quantity}
                onChange={(event) =>
                  setCreateValues((current) => ({ ...current, quantity: event.target.value }))
                }
                placeholder="Quantity"
                inputMode="decimal"
              />
              <Input
                value={createValues.unit}
                onChange={(event) =>
                  setCreateValues((current) => ({ ...current, unit: event.target.value }))
                }
                placeholder="Unit"
              />
              <Input
                value={createValues.lowStockThreshold}
                onChange={(event) =>
                  setCreateValues((current) => ({
                    ...current,
                    lowStockThreshold: event.target.value,
                  }))
                }
                placeholder="Low stock threshold"
                inputMode="decimal"
              />
              <Input
                type="date"
                value={createValues.expirationDate}
                onChange={(event) =>
                  setCreateValues((current) => ({
                    ...current,
                    expirationDate: event.target.value,
                  }))
                }
              />
              <textarea
                value={createValues.notes}
                onChange={(event) =>
                  setCreateValues((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Notes"
                className="min-h-[112px] rounded-[calc(var(--radius)-0.15rem)] border border-border bg-white/80 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 md:col-span-2"
              />
              <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowDetailedForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Create item
                </Button>
              </div>
            </form>
          ) : null}

          <div className="flex flex-col gap-3 rounded-[calc(var(--radius)-0.05rem)] border border-border bg-white/60 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Filter className="size-4 text-muted-foreground" />
              Filter inventory
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 rounded-full border border-border bg-white px-4 text-sm text-foreground outline-none"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={locationFilter}
                onChange={(event) =>
                  setLocationFilter(event.target.value as StorageLocation | "all")
                }
                className="h-11 rounded-full border border-border bg-white px-4 text-sm text-foreground outline-none"
              >
                <option value="all">All locations</option>
                {storageLocationOptions.map((location) => (
                  <option key={location} value={location}>
                    {storageLocationLabels[location]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-900">
              {errorMessage}
            </div>
          ) : null}

          {items.length === 0 ? (
            <Card className="border-dashed bg-white/55">
              <CardHeader className="items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <Package2 className="size-6" />
                </div>
                <CardTitle className="mt-4 font-serif text-3xl tracking-[-0.04em]">
                  Start with the essentials.
                </CardTitle>
                <CardDescription className="max-w-md text-base leading-7">
                  Add a few staples from the pantry, fridge, or household supply closet to
                  make low-stock and expiration signals useful right away.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card className="border-dashed bg-white/55">
              <CardContent className="px-6 py-10 text-center text-sm leading-7 text-muted-foreground">
                No inventory items match these filters. Try another category or storage
                location.
              </CardContent>
            </Card>
          ) : (
            storageLocationOptions
              .filter((location) => groupedItems[location]?.length)
              .map((location) => (
                <section key={location} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {storageLocationLabels[location]}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {groupedItems[location].length} item
                      {groupedItems[location].length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {groupedItems[location]
                      .slice()
                      .sort((left, right) => left.name.localeCompare(right.name))
                      .map((item) => {
                        const isEditing = editingItemId === item.id;
                        const expirationLabel = formatExpirationLabel(item);

                        return (
                          <Card key={item.id} className="overflow-hidden">
                            <CardContent className="px-4 py-4 sm:px-5">
                              <div className="flex items-start gap-3">
                                <label className="mt-1 flex shrink-0 items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedIdeaItemIds.includes(item.id)}
                                    onChange={() => toggleIdeaSelection(item.id)}
                                    className="size-4 rounded border-border"
                                    aria-label={`Select ${item.name} for use what we have ideas`}
                                  />
                                </label>

                                <div
                                  className={cn(
                                    "mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl",
                                    item.isExpired
                                      ? "bg-rose-100 text-rose-700"
                                      : item.isExpiringSoon
                                        ? "bg-amber-100 text-amber-700"
                                        : item.isLowStock
                                        ? "bg-primary/10 text-primary"
                                          : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {item.productImageUrl ? (
                                    <ProductImageThumb
                                      imageUrl={item.productImageUrl}
                                      name={item.name}
                                      className="size-10 rounded-2xl border-0 bg-transparent"
                                    />
                                  ) : item.isExpired || item.isExpiringSoon ? (
                                    <CalendarClock className="size-5" />
                                  ) : item.isLowStock ? (
                                    <AlertTriangle className="size-5" />
                                  ) : (
                                    <Package2 className="size-5" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 space-y-2">
                                  {!isEditing ? (
                                    <>
                                      <div className="flex flex-wrap items-start gap-2">
                                        <p className="text-base font-medium text-foreground">
                                          {item.name}
                                        </p>
                                        {item.category ? (
                                          <Badge variant="secondary">{item.category}</Badge>
                                        ) : null}
                                        {item.isLowStock ? <Badge>Low stock</Badge> : null}
                                        {item.isExpiringSoon ? (
                                          <Badge variant="secondary">Expiring soon</Badge>
                                        ) : null}
                                        {item.isExpired ? (
                                          <Badge className="bg-rose-600 text-white hover:bg-rose-600">
                                            Expired
                                          </Badge>
                                        ) : null}
                                      </div>

                                      {item.productBrand ? (
                                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                          {item.productBrand}
                                        </p>
                                      ) : null}

                                      <p className="text-sm text-muted-foreground">
                                        {formatQuantity(item)} in{" "}
                                        {storageLocationLabels[item.storageLocation]}
                                      </p>

                                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                        {item.lowStockThreshold !== null ? (
                                          <span>
                                            Refill at {item.lowStockThreshold}
                                            {item.unit ? ` ${item.unit}` : ""}
                                          </span>
                                        ) : null}
                                        {expirationLabel ? <span>{expirationLabel}</span> : null}
                                      </div>

                                      {item.notes ? (
                                        <p className="text-sm leading-6 text-muted-foreground">
                                          {item.notes}
                                        </p>
                                      ) : null}
                                    </>
                                  ) : (
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <Input
                                        value={editingValues.name}
                                        onChange={(event) =>
                                          setEditingValues((current) => ({
                                            ...current,
                                            name: event.target.value,
                                          }))
                                        }
                                        placeholder="Item name"
                                      />
                                      <Input
                                        value={editingValues.category}
                                        onChange={(event) =>
                                          setEditingValues((current) => ({
                                            ...current,
                                            category: event.target.value,
                                          }))
                                        }
                                        placeholder="Category"
                                      />
                                      <select
                                        value={editingValues.storageLocation}
                                        onChange={(event) =>
                                          setEditingValues((current) => ({
                                            ...current,
                                            storageLocation: event.target.value as StorageLocation,
                                          }))
                                        }
                                        className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none"
                                      >
                                        {storageLocationOptions.map((locationOption) => (
                                          <option key={locationOption} value={locationOption}>
                                            {storageLocationLabels[locationOption]}
                                          </option>
                                        ))}
                                      </select>
                                      <Input
                                        value={editingValues.quantity}
                                        onChange={(event) =>
                                          setEditingValues((current) => ({
                                            ...current,
                                            quantity: event.target.value,
                                          }))
                                        }
                                        placeholder="Quantity"
                                        inputMode="decimal"
                                      />
                                      <Input
                                        value={editingValues.unit}
                                        onChange={(event) =>
                                          setEditingValues((current) => ({
                                            ...current,
                                            unit: event.target.value,
                                          }))
                                        }
                                        placeholder="Unit"
                                      />
                                      <Input
                                        value={editingValues.lowStockThreshold}
                                        onChange={(event) =>
                                          setEditingValues((current) => ({
                                            ...current,
                                            lowStockThreshold: event.target.value,
                                          }))
                                        }
                                        placeholder="Low stock threshold"
                                        inputMode="decimal"
                                      />
                                      <Input
                                        type="date"
                                        value={editingValues.expirationDate}
                                        onChange={(event) =>
                                          setEditingValues((current) => ({
                                            ...current,
                                            expirationDate: event.target.value,
                                          }))
                                        }
                                      />
                                      <textarea
                                        value={editingValues.notes}
                                        onChange={(event) =>
                                          setEditingValues((current) => ({
                                            ...current,
                                            notes: event.target.value,
                                          }))
                                        }
                                        placeholder="Notes"
                                        className="min-h-[100px] rounded-[calc(var(--radius)-0.15rem)] border border-border bg-white/80 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 md:col-span-2"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2">
                                  {!isEditing ? (
                                    <>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => startEditing(item)}
                                        aria-label={`Edit ${item.name}`}
                                      >
                                        <Pencil className="size-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(item.id)}
                                        aria-label={`Delete ${item.name}`}
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleSaveEdit(item.id)}
                                        disabled={isPending}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={cancelEditing}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </section>
              ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Built for food and household essentials</CardTitle>
          <CardDescription>
            Pantry staples, fridge items, cleaning products, and bathroom supplies all
            fit the same calm workflow without feeling over-structured.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Low-stock logic",
              description:
                "Items automatically flag when quantity reaches the refill threshold.",
            },
            {
              title: "Freshness signals",
              description:
                "Expiration dates make soon-to-use and expired items easy to spot at a glance.",
            },
            {
              title: "Flexible categories",
              description:
                "Use categories for groceries today and household consumables as the app grows.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[calc(var(--radius)-0.1rem)] border border-border bg-white/70 px-4 py-4"
            >
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
