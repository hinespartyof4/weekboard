"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  CalendarClock,
  Pencil,
  Plus,
  Repeat2,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  createRecurringItemAction,
  deleteRecurringItemAction,
  generateDueRecurringShoppingItemsAction,
  updateRecurringItemAction,
} from "@/lib/recurring/actions";
import { isRecurringItemReadyForAutoAdd } from "@/lib/recurring/automation";
import type {
  FrequencyType,
  RecurringBoardData,
  RecurringItemInput,
  RecurringItemRecord,
} from "@/lib/recurring/types";
import {
  RecurringItemForm,
  type RecurringFormValues,
} from "@/components/app/recurring-item-form";

type RecurringBoardProps = {
  data: RecurringBoardData;
};

type RecurringItemsAction =
  | { type: "add"; item: RecurringItemRecord }
  | { type: "patch"; itemId: string; patch: Partial<RecurringItemRecord> }
  | { type: "remove"; itemId: string };

type RecurringSection = {
  key: string;
  title: string;
  description: string;
  items: RecurringItemRecord[];
};

const suggestionPresets: Array<{
  name: string;
  category: string;
  frequencyType: FrequencyType;
  frequencyInterval: string;
  unit: string;
}> = [
  { name: "Paper towels", category: "Household", frequencyType: "month", frequencyInterval: "1", unit: "pack" },
  { name: "Dish soap", category: "Kitchen", frequencyType: "month", frequencyInterval: "1", unit: "bottle" },
  { name: "Dog food", category: "Pets", frequencyType: "week", frequencyInterval: "2", unit: "bag" },
  { name: "Detergent", category: "Laundry", frequencyType: "month", frequencyInterval: "1", unit: "bottle" },
  { name: "Vitamins", category: "Wellness", frequencyType: "month", frequencyInterval: "1", unit: "bottle" },
  { name: "Air filters", category: "Home care", frequencyType: "month", frequencyInterval: "3", unit: "filter" },
];

function addDays(dateString: string, days: number) {
  const base = new Date(`${dateString}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultValues(): RecurringFormValues {
  const today = getTodayDateString();

  return {
    name: "",
    category: "",
    defaultQuantity: "1",
    unit: "",
    frequencyType: "week",
    frequencyInterval: "1",
    nextDueDate: addDays(today, 7),
    preferredStore: "",
    autoAddToShoppingList: false,
    active: true,
  };
}

function getValuesFromItem(item?: RecurringItemRecord): RecurringFormValues {
  if (!item) {
    return getDefaultValues();
  }

  return {
    name: item.name,
    category: item.category ?? "",
    defaultQuantity: String(item.defaultQuantity),
    unit: item.unit ?? "",
    frequencyType: item.frequencyType,
    frequencyInterval: String(item.frequencyInterval),
    nextDueDate: item.nextDueDate,
    preferredStore: item.preferredStore ?? "",
    autoAddToShoppingList: item.autoAddToShoppingList,
    active: item.active,
  };
}

function createInput(values: RecurringFormValues): RecurringItemInput {
  return {
    name: values.name,
    category: values.category,
    defaultQuantity: values.defaultQuantity,
    unit: values.unit,
    frequencyType: values.frequencyType,
    frequencyInterval: values.frequencyInterval,
    nextDueDate: values.nextDueDate,
    preferredStore: values.preferredStore,
    autoAddToShoppingList: values.autoAddToShoppingList,
    active: values.active,
  };
}

function hasPositiveNumber(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  const parsed = Number(normalized);
  return !Number.isNaN(parsed) && parsed > 0;
}

function buildOptimisticItem(values: RecurringFormValues, householdId: string): RecurringItemRecord {
  const today = getTodayDateString();
  const dueThisWeekEnd = addDays(today, 6);
  const dueSoonEnd = addDays(today, 14);
  const isOverdue = values.active && values.nextDueDate < today;
  const isDueThisWeek = values.active && values.nextDueDate <= dueThisWeekEnd;
  const isDueSoon =
    values.active &&
    values.nextDueDate > dueThisWeekEnd &&
    values.nextDueDate <= dueSoonEnd;

  return {
    id: `temp-${crypto.randomUUID()}`,
    householdId,
    name: values.name.trim(),
    category: values.category.trim() || null,
    defaultQuantity: Number(values.defaultQuantity),
    unit: values.unit.trim() || null,
    frequencyType: values.frequencyType,
    frequencyInterval: Number(values.frequencyInterval),
    nextDueDate: values.nextDueDate,
    preferredStore: values.preferredStore.trim() || null,
    autoAddToShoppingList: values.autoAddToShoppingList,
    active: values.active,
    isDueThisWeek,
    isDueSoon,
    isOverdue,
  };
}

function formatFrequency(item: RecurringItemRecord) {
  const unitLabel =
    item.frequencyInterval === 1 ? item.frequencyType : `${item.frequencyType}s`;

  return `Every ${item.frequencyInterval} ${unitLabel}`;
}

function formatQuantity(item: RecurringItemRecord) {
  if (item.unit) {
    return `${item.defaultQuantity} ${item.unit}`;
  }

  return String(item.defaultQuantity);
}

function formatDueDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function getSummary(items: RecurringItemRecord[]) {
  return {
    totalItems: items.length,
    dueThisWeekCount: items.filter((item) => item.isDueThisWeek).length,
    dueSoonCount: items.filter((item) => item.isDueSoon).length,
    activeCount: items.filter((item) => item.active).length,
  };
}

export function RecurringBoard({ data }: RecurringBoardProps) {
  const router = useRouter();
  const [items, updateItems] = useOptimistic(
    data.items,
    (currentItems, action: RecurringItemsAction) => {
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
  const [showCreateForm, setShowCreateForm] = useState(items.length === 0);
  const [createValues, setCreateValues] = useState<RecurringFormValues>(getDefaultValues());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<RecurringFormValues>(getDefaultValues());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startAction] = useTransition();

  const summary = useMemo(() => getSummary(items), [items]);
  const today = getTodayDateString();
  const readyToGenerateCount = useMemo(
    () => items.filter((item) => isRecurringItemReadyForAutoAdd(item, today)).length,
    [items, today],
  );

  const sections = useMemo<RecurringSection[]>(() => {
    const dueThisWeek = items.filter((item) => item.active && item.isDueThisWeek);
    const dueSoon = items.filter((item) => item.active && item.isDueSoon);
    const later = items.filter(
      (item) => item.active && !item.isDueThisWeek && !item.isDueSoon,
    );
    const paused = items.filter((item) => !item.active);

    return [
      {
        key: "due-this-week",
        title: "Due this week",
        description: "Needs that are already due or coming up in the next 7 days.",
        items: dueThisWeek,
      },
      {
        key: "due-soon",
        title: "Due soon",
        description: "Regular restocks that are approaching after this week.",
        items: dueSoon,
      },
      {
        key: "later",
        title: "Later",
        description: "Active recurring items that are scheduled farther out.",
        items: later,
      },
      {
        key: "paused",
        title: "Paused",
        description: "Items kept for reference without showing up in the near-term plan.",
        items: paused,
      },
    ].filter((section) => section.items.length > 0);
  }, [items]);

  async function runAction(action: () => Promise<void>) {
    setErrorMessage(null);
    setSuccessMessage(null);
    startAction(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  function applyOptimisticItem(item: RecurringItemRecord) {
    updateItems({ type: "add", item });
  }

  function patchOptimisticItem(itemId: string, patch: Partial<RecurringItemRecord>) {
    updateItems({ type: "patch", itemId, patch });
  }

  function removeOptimisticItem(itemId: string) {
    updateItems({ type: "remove", itemId });
  }

  function resetCreateForm() {
    setCreateValues(getDefaultValues());
  }

  function isValid(values: RecurringFormValues) {
    if (!values.name.trim()) {
      setErrorMessage("Item name is required.");
      return false;
    }

    if (!hasPositiveNumber(values.defaultQuantity)) {
      setErrorMessage("Default quantity must be a valid number greater than zero.");
      return false;
    }

    if (!hasPositiveNumber(values.frequencyInterval)) {
      setErrorMessage("Frequency interval must be a valid number greater than zero.");
      return false;
    }

    if (!values.nextDueDate.trim()) {
      setErrorMessage("Next due date is required.");
      return false;
    }

    return true;
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid(createValues)) {
      return;
    }

    const optimisticItem = buildOptimisticItem(createValues, data.householdId);
    applyOptimisticItem(optimisticItem);
    resetCreateForm();
    setShowCreateForm(false);

    void runAction(async () => {
      await createRecurringItemAction(createInput(createValues));
    });
  }

  function startEditing(item: RecurringItemRecord) {
    setEditingItemId(item.id);
    setEditingValues(getValuesFromItem(item));
  }

  function cancelEditing() {
    setEditingItemId(null);
    setEditingValues(getDefaultValues());
  }

  function handleSaveEdit(itemId: string) {
    if (!isValid(editingValues)) {
      return;
    }

    const optimisticItem = buildOptimisticItem(editingValues, data.householdId);
    patchOptimisticItem(itemId, {
      name: optimisticItem.name,
      category: optimisticItem.category,
      defaultQuantity: optimisticItem.defaultQuantity,
      unit: optimisticItem.unit,
      frequencyType: optimisticItem.frequencyType,
      frequencyInterval: optimisticItem.frequencyInterval,
      nextDueDate: optimisticItem.nextDueDate,
      preferredStore: optimisticItem.preferredStore,
      autoAddToShoppingList: optimisticItem.autoAddToShoppingList,
      active: optimisticItem.active,
      isDueThisWeek: optimisticItem.isDueThisWeek,
      isDueSoon: optimisticItem.isDueSoon,
      isOverdue: optimisticItem.isOverdue,
    });
    cancelEditing();

    void runAction(async () => {
      await updateRecurringItemAction(itemId, createInput(editingValues));
    });
  }

  function handleDelete(itemId: string) {
    removeOptimisticItem(itemId);

    void runAction(async () => {
      await deleteRecurringItemAction(itemId);
    });
  }

  function applySuggestion(preset: (typeof suggestionPresets)[number]) {
    setShowCreateForm(true);
    setCreateValues((current) => ({
      ...current,
      name: preset.name,
      category: preset.category,
      unit: preset.unit,
      frequencyType: preset.frequencyType,
      frequencyInterval: preset.frequencyInterval,
    }));
  }

  function handleGenerateDueItems() {
    setErrorMessage(null);
    setSuccessMessage(null);

    startAction(async () => {
      try {
        const result = await generateDueRecurringShoppingItemsAction();
        setSuccessMessage(result.message);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="gap-5 border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>Recurring</Badge>
              <div className="space-y-2">
                <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
                  Household rhythms
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  Keep regular restocks visible for {data.householdName} so paper goods,
                  pet supplies, vitamins, and home care never become last-minute errands.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{summary.totalItems} items</Badge>
              <Badge variant="secondary">{summary.dueThisWeekCount} due this week</Badge>
              <Badge variant="secondary">{summary.dueSoonCount} due soon</Badge>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {[
              { label: "Total tracked", value: summary.totalItems },
              { label: "Due this week", value: summary.dueThisWeekCount },
              { label: "Due soon", value: summary.dueSoonCount },
              { label: "Active", value: summary.activeCount },
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

          <div className="flex flex-wrap gap-2">
            {suggestionPresets.map((preset) => (
              <Button
                key={preset.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applySuggestion(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </div>

          <div className="flex justify-start">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateDueItems}
                disabled={isPending}
              >
                <ShoppingCart className="size-4" />
                {readyToGenerateCount > 0
                  ? `Generate due items (${readyToGenerateCount})`
                  : "Generate due items"}
              </Button>
              <Button
                type="button"
                variant={showCreateForm ? "outline" : "default"}
                onClick={() => setShowCreateForm((current) => !current)}
              >
                <Plus className="size-4" />
                {showCreateForm ? "Hide form" : "Add recurring item"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {showCreateForm ? (
            <form
              onSubmit={handleCreate}
              className="grid gap-3 rounded-[calc(var(--radius)-0.05rem)] border border-border bg-white/70 p-4 md:grid-cols-2"
            >
              <RecurringItemForm
                values={createValues}
                setValues={setCreateValues}
                className="contents"
              />
              <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Create item
                </Button>
              </div>
            </form>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-900">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
              {successMessage}
            </div>
          ) : null}

          {items.length === 0 ? (
            <Card className="border-dashed bg-white/55">
              <CardHeader className="items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <Repeat2 className="size-6" />
                </div>
                <CardTitle className="mt-4 font-serif text-3xl tracking-[-0.04em]">
                  Start with a few essentials.
                </CardTitle>
                <CardDescription className="max-w-md text-base leading-7">
                  Paper towels, dish soap, dog food, detergent, vitamins, and air filters
                  are all strong first recurring items for a calmer weekly plan.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            sections.map((section) => (
              <section key={section.key} className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {section.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {section.items.length} item{section.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-3">
                  {section.items.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const isReadyForAutoAdd = isRecurringItemReadyForAutoAdd(item, today);

                    return (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="px-4 py-4 sm:px-5">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl",
                                item.isOverdue
                                  ? "bg-rose-100 text-rose-700"
                                  : item.isDueThisWeek
                                    ? "bg-primary/10 text-primary"
                                    : item.isDueSoon
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-muted text-muted-foreground",
                              )}
                            >
                              {item.autoAddToShoppingList ? (
                                <ShoppingCart className="size-5" />
                              ) : (
                                <CalendarClock className="size-5" />
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
                                    {!item.active ? (
                                      <Badge variant="secondary">Paused</Badge>
                                    ) : null}
                                    {item.isOverdue ? (
                                      <Badge className="bg-rose-600 text-white hover:bg-rose-600">
                                        Overdue
                                      </Badge>
                                    ) : item.isDueThisWeek ? (
                                      <Badge>Due this week</Badge>
                                    ) : item.isDueSoon ? (
                                      <Badge variant="secondary">Due soon</Badge>
                                    ) : null}
                                    {item.autoAddToShoppingList ? (
                                      <Badge variant="secondary">
                                        {isReadyForAutoAdd ? "Auto-add ready" : "Auto-add enabled"}
                                      </Badge>
                                    ) : null}
                                  </div>

                                  <p className="text-sm text-muted-foreground">
                                    {formatQuantity(item)} • {formatFrequency(item)} • Next due{" "}
                                    {formatDueDate(item.nextDueDate)}
                                  </p>

                                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                    {item.preferredStore ? (
                                      <span>Store: {item.preferredStore}</span>
                                    ) : null}
                                    {item.autoAddToShoppingList ? (
                                      <span>
                                        {isReadyForAutoAdd
                                          ? "Ready for manual add to shopping"
                                          : "Will be included once it reaches its due date"}
                                      </span>
                                    ) : null}
                                  </div>
                                </>
                              ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                  <RecurringItemForm
                                    values={editingValues}
                                    setValues={setEditingValues}
                                    className="contents"
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
          <CardTitle>Practical by design</CardTitle>
          <CardDescription>
            The recurring model stays simple today while leaving a clean path for future
            automation into shopping and Weekly Reset.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Thoughtful defaults",
              description:
                "New items start active, weekly, and ready for small households without extra setup.",
            },
            {
              title: "Automation-ready",
              description:
                "Auto-add is stored now so we can connect it to shopping later without reshaping the data model.",
            },
            {
              title: "Mobile-friendly",
              description:
                "Create, scan, and edit regular household needs in a single column without extra clutter.",
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
