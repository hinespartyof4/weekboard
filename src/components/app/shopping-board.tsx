"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  CheckCircle2,
  Circle,
  Filter,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createShoppingItemAction,
  deleteShoppingItemAction,
  toggleShoppingItemStatusAction,
  updateShoppingItemAction,
} from "@/lib/shopping/actions";
import type {
  ShoppingBoardData,
  ShoppingItemInput,
  ShoppingItemRecord,
  ShoppingItemStatus,
} from "@/lib/shopping/types";
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

type ShoppingBoardProps = {
  data: ShoppingBoardData;
};

type EditingValues = {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  priority: boolean;
  preferredStore: string;
  notes: string;
  status: ShoppingItemStatus;
};

type ShoppingItemsAction =
  | { type: "add"; item: ShoppingItemRecord }
  | { type: "patch"; itemId: string; patch: Partial<ShoppingItemRecord> }
  | { type: "remove"; itemId: string };

const statusOptions: Array<{ label: string; value: ShoppingItemStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Needed", value: "needed" },
  { label: "Completed", value: "purchased" },
];

function getEditingValues(item?: ShoppingItemRecord): EditingValues {
  return {
    name: item?.name ?? "",
    category: item?.category ?? "",
    quantity: item?.quantity ?? "",
    unit: item?.unit ?? "",
    priority: item?.priority ?? false,
    preferredStore: item?.preferredStore ?? "",
    notes: item?.notes ?? "",
    status: item?.status ?? "needed",
  };
}

function formatItemMeta(item: ShoppingItemRecord) {
  const detailParts = [
    item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}` : null,
    item.preferredStore ? `Store: ${item.preferredStore}` : null,
  ].filter(Boolean);

  return detailParts.join(" • ");
}

export function ShoppingBoard({ data }: ShoppingBoardProps) {
  const router = useRouter();
  const [items, updateItems] = useOptimistic(
    data.items,
    (currentItems, action: ShoppingItemsAction) => {
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
  const [statusFilter, setStatusFilter] = useState<ShoppingItemStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDetailedForm, setShowDetailedForm] = useState(items.length === 0);
  const [createValues, setCreateValues] = useState<EditingValues>(getEditingValues());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<EditingValues>(getEditingValues());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startAction] = useTransition();

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
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all"
          ? true
          : (item.category ?? "Uncategorized") === categoryFilter;

      return matchesStatus && matchesCategory;
    });
  }, [categoryFilter, items, statusFilter]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, ShoppingItemRecord[]>>((groups, item) => {
      const key = item.category ?? "Uncategorized";
      groups[key] = groups[key] ? [...groups[key], item] : [item];
      return groups;
    }, {});
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

  function applyOptimisticItem(item: ShoppingItemRecord) {
    updateItems({ type: "add", item });
  }

  function patchOptimisticItem(itemId: string, patch: Partial<ShoppingItemRecord>) {
    updateItems({ type: "patch", itemId, patch });
  }

  function removeOptimisticItem(itemId: string) {
    updateItems({ type: "remove", itemId });
  }

  function createOptimisticItem(values: EditingValues | { name: string }): ShoppingItemRecord {
    const name = values.name.trim();

    return {
      id: `temp-${crypto.randomUUID()}`,
      householdId: data.list.householdId,
      shoppingListId: data.list.id,
      name,
      category: "category" in values ? values.category || null : null,
      quantity: "quantity" in values ? values.quantity || null : null,
      unit: "unit" in values ? values.unit || null : null,
      priority: "priority" in values ? values.priority : false,
      preferredStore: "preferredStore" in values ? values.preferredStore || null : null,
      notes: "notes" in values ? values.notes || null : null,
      status: "status" in values ? values.status : "needed",
      barcode: null,
      productBrand: null,
      productImageUrl: null,
    };
  }

  function resetCreateForm() {
    setCreateValues(getEditingValues());
  }

  function handleQuickAdd() {
    const name = quickAddName.trim();

    if (!name) {
      return;
    }

    const optimisticItem = createOptimisticItem({ name });
    applyOptimisticItem(optimisticItem);
    setQuickAddName("");

    void runAction(async () => {
      await createShoppingItemAction({ name });
    });
  }

  function handleDetailedCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = createValues.name.trim();

    if (!name) {
      setErrorMessage("Item name is required.");
      return;
    }

    const optimisticItem = createOptimisticItem(createValues);
    applyOptimisticItem(optimisticItem);
    resetCreateForm();
    setShowDetailedForm(false);

    void runAction(async () => {
      await createShoppingItemAction(createValues);
    });
  }

  function handleToggle(item: ShoppingItemRecord) {
    const nextStatus: ShoppingItemStatus =
      item.status === "purchased" ? "needed" : "purchased";

    patchOptimisticItem(item.id, { status: nextStatus });
    void runAction(async () => {
      await toggleShoppingItemStatusAction(item.id, nextStatus);
    });
  }

  function handleDelete(itemId: string) {
    removeOptimisticItem(itemId);
    void runAction(async () => {
      await deleteShoppingItemAction(itemId);
    });
  }

  function startEditing(item: ShoppingItemRecord) {
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

    patchOptimisticItem(itemId, {
      name,
      category: editingValues.category || null,
      quantity: editingValues.quantity || null,
      unit: editingValues.unit || null,
      priority: editingValues.priority,
      preferredStore: editingValues.preferredStore || null,
      notes: editingValues.notes || null,
      status: editingValues.status,
    });
    cancelEditing();

    void runAction(async () => {
      await updateShoppingItemAction(itemId, editingValues as ShoppingItemInput);
    });
  }

  const itemCountLabel = `${items.length} item${items.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="gap-5 border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>Shopping</Badge>
              <div className="space-y-2">
                <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
                  {data.list.name}
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  Fast shared grocery planning for {data.householdName}. Start with quick
                  add, then edit details when you need them.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{itemCountLabel}</Badge>
              <Badge variant="secondary">
                {data.list.isDefault ? "Default household list" : "Shared list"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-[calc(var(--radius)-0.15rem)] border border-border bg-white/70 p-2">
              <Input
                value={quickAddName}
                onChange={(event) => setQuickAddName(event.target.value)}
                placeholder="Quick add milk, bananas, paper towels..."
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
              defaultDestination="shopping"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <BarcodeSaveFeedback />
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
              <Input
                value={createValues.quantity}
                onChange={(event) =>
                  setCreateValues((current) => ({ ...current, quantity: event.target.value }))
                }
                placeholder="Quantity"
              />
              <Input
                value={createValues.unit}
                onChange={(event) =>
                  setCreateValues((current) => ({ ...current, unit: event.target.value }))
                }
                placeholder="Unit"
              />
              <Input
                value={createValues.preferredStore}
                onChange={(event) =>
                  setCreateValues((current) => ({
                    ...current,
                    preferredStore: event.target.value,
                  }))
                }
                placeholder="Preferred store"
              />
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={createValues.priority}
                  onChange={(event) =>
                    setCreateValues((current) => ({
                      ...current,
                      priority: event.target.checked,
                    }))
                  }
                  className="size-4 rounded border-border"
                />
                Mark as priority
              </label>
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
              Filter items
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ShoppingItemStatus | "all")
                }
                className="h-11 rounded-full border border-border bg-white px-4 text-sm text-foreground outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                  <ShoppingCart className="size-6" />
                </div>
                <CardTitle className="mt-4 font-serif text-3xl tracking-[-0.04em]">
                  Your first list is ready.
                </CardTitle>
                <CardDescription className="max-w-md text-base leading-7">
                  Quick add something you need this week, or open the detailed form for
                  a fuller item entry.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card className="border-dashed bg-white/55">
              <CardContent className="px-6 py-10 text-center text-sm leading-7 text-muted-foreground">
                No items match the current filters. Try another status or category.
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedItems)
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([category, categoryItems]) => (
                <section key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {category}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {categoryItems.length} item{categoryItems.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {categoryItems.map((item) => {
                      const isEditing = editingItemId === item.id;
                      const meta = formatItemMeta(item);

                      return (
                        <Card key={item.id} className="overflow-hidden">
                          <CardContent className="px-4 py-4 sm:px-5">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggle(item)}
                                className="mt-0.5 text-primary"
                                aria-label={
                                  item.status === "purchased"
                                    ? `Mark ${item.name} incomplete`
                                    : `Mark ${item.name} complete`
                                }
                              >
                                {item.status === "purchased" ? (
                                  <CheckCircle2 className="size-6" />
                                ) : (
                                  <Circle className="size-6" />
                                )}
                              </button>

                              {item.productImageUrl ? (
                                <ProductImageThumb
                                  imageUrl={item.productImageUrl}
                                  name={item.name}
                                  className="mt-0.5 size-11 rounded-[1rem]"
                                />
                              ) : null}

                              <div className="min-w-0 flex-1 space-y-2">
                                {!isEditing ? (
                                  <>
                                    <div className="flex flex-wrap items-start gap-2">
                                      <p
                                        className={cn(
                                          "text-base font-medium text-foreground",
                                          item.status === "purchased" &&
                                            "text-muted-foreground line-through",
                                        )}
                                      >
                                        {item.name}
                                      </p>
                                      {item.priority ? <Badge>Priority</Badge> : null}
                                      {item.status === "purchased" ? (
                                        <Badge variant="secondary">Completed</Badge>
                                      ) : null}
                                    </div>

                                    {item.productBrand ? (
                                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                        {item.productBrand}
                                      </p>
                                    ) : null}

                                    {meta ? (
                                      <p className="text-sm text-muted-foreground">{meta}</p>
                                    ) : null}

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
                                    <Input
                                      value={editingValues.quantity}
                                      onChange={(event) =>
                                        setEditingValues((current) => ({
                                          ...current,
                                          quantity: event.target.value,
                                        }))
                                      }
                                      placeholder="Quantity"
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
                                      value={editingValues.preferredStore}
                                      onChange={(event) =>
                                        setEditingValues((current) => ({
                                          ...current,
                                          preferredStore: event.target.value,
                                        }))
                                      }
                                      placeholder="Preferred store"
                                    />
                                    <select
                                      value={editingValues.status}
                                      onChange={(event) =>
                                        setEditingValues((current) => ({
                                          ...current,
                                          status: event.target.value as ShoppingItemStatus,
                                        }))
                                      }
                                      className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none"
                                    >
                                      <option value="needed">Needed</option>
                                      <option value="purchased">Completed</option>
                                    </select>
                                    <label className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground md:col-span-2">
                                      <input
                                        type="checkbox"
                                        checked={editingValues.priority}
                                        onChange={(event) =>
                                          setEditingValues((current) => ({
                                            ...current,
                                            priority: event.target.checked,
                                          }))
                                        }
                                        className="size-4 rounded border-border"
                                      />
                                      Mark as priority
                                    </label>
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
                                    <Button type="button" size="sm" variant="ghost" onClick={cancelEditing}>
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
          <CardTitle>Mobile-friendly by default</CardTitle>
          <CardDescription>
            Quick add stays at the top, completion is a single tap, and the detailed
            edit form only opens when you need it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Quick add",
              description: "Capture a new item in seconds while you’re moving through the house.",
            },
            {
              title: "Grouped scan",
              description: "Categories keep the list readable instead of feeling like one long feed.",
            },
            {
              title: "Low-friction edits",
              description: "Preferred store, notes, quantity, and priority are there when you need more detail.",
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
