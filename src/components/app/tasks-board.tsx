"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  CheckCircle2,
  Circle,
  ListChecks,
  Pencil,
  Plus,
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  completeTaskAction,
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
} from "@/lib/tasks/actions";
import type {
  HouseholdMemberOption,
  TaskBoardData,
  TaskInput,
  TaskPriority,
  TaskRecord,
} from "@/lib/tasks/types";
import { TaskItemForm, type TaskFormValues } from "@/components/app/task-item-form";

type TasksBoardProps = {
  data: TaskBoardData;
};

type TaskItemsAction =
  | { type: "add"; item: TaskRecord }
  | { type: "patch"; itemId: string; patch: Partial<TaskRecord> }
  | { type: "remove"; itemId: string };

type TaskSection = {
  key: string;
  title: string;
  description: string;
  items: TaskRecord[];
};

function addDays(dateString: string, days: number) {
  const base = new Date(`${dateString}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultValues(): TaskFormValues {
  const today = getTodayDateString();

  return {
    title: "",
    description: "",
    assignedTo: "",
    dueDate: addDays(today, 3),
    recurrenceType: "none",
    recurrenceInterval: "",
    status: "open",
    priority: "medium",
  };
}

function getValuesFromTask(task?: TaskRecord): TaskFormValues {
  if (!task) {
    return getDefaultValues();
  }

  return {
    title: task.title,
    description: task.description ?? "",
    assignedTo: task.assignedTo ?? "",
    dueDate: task.dueDate ?? "",
    recurrenceType: task.recurrenceType ?? "none",
    recurrenceInterval: task.recurrenceInterval ? String(task.recurrenceInterval) : "",
    status: task.status,
    priority: task.priority,
  };
}

function createInput(values: TaskFormValues): TaskInput {
  return {
    title: values.title,
    description: values.description,
    assignedTo: values.assignedTo,
    dueDate: values.dueDate,
    recurrenceType: values.recurrenceType,
    recurrenceInterval: values.recurrenceInterval,
    status: values.status,
    priority: values.priority,
  };
}

function getAssignedLabel(assignedTo: string | null, members: HouseholdMemberOption[]) {
  if (!assignedTo) {
    return null;
  }

  return members.find((member) => member.userId === assignedTo)?.label ?? "Household member";
}

function buildOptimisticTask(
  values: TaskFormValues,
  householdId: string,
  currentUserId: string,
  members: HouseholdMemberOption[],
): TaskRecord {
  const today = getTodayDateString();
  const weekEnd = addDays(today, 6);
  const isCompleted = values.status === "done";
  const isOverdue = !isCompleted && Boolean(values.dueDate) && values.dueDate < today;
  const isDueThisWeek =
    !isCompleted &&
    Boolean(values.dueDate) &&
    values.dueDate >= today &&
    values.dueDate <= weekEnd;
  const isUpcoming =
    !isCompleted &&
    (!values.dueDate || values.dueDate > weekEnd);

  return {
    id: `temp-${crypto.randomUUID()}`,
    householdId,
    title: values.title.trim(),
    description: values.description.trim() || null,
    assignedTo: values.assignedTo || null,
    dueDate: values.dueDate || null,
    recurrenceType: values.recurrenceType === "none" ? null : values.recurrenceType,
    recurrenceInterval:
      values.recurrenceType === "none" || !values.recurrenceInterval
        ? null
        : Number(values.recurrenceInterval),
    status: values.status,
    priority: values.priority,
    completedAt: values.status === "done" ? new Date().toISOString() : null,
    completedBy: values.status === "done" ? currentUserId : null,
    assignedLabel: getAssignedLabel(values.assignedTo || null, members),
    isOverdue,
    isDueThisWeek,
    isUpcoming,
  };
}

function getSummary(items: TaskRecord[]) {
  return {
    overdueCount: items.filter((item) => item.isOverdue).length,
    dueThisWeekCount: items.filter((item) => item.isDueThisWeek).length,
    upcomingCount: items.filter((item) => item.isUpcoming).length,
    completedCount: items.filter((item) => item.status === "done").length,
  };
}

function formatDueDate(date: string | null) {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatRecurrence(task: TaskRecord) {
  if (!task.recurrenceType || !task.recurrenceInterval) {
    return null;
  }

  const unit =
    task.recurrenceInterval === 1 ? task.recurrenceType : `${task.recurrenceType}s`;

  return `Every ${task.recurrenceInterval} ${unit}`;
}

function getPriorityTone(priority: TaskPriority) {
  switch (priority) {
    case "high":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function TasksBoard({ data }: TasksBoardProps) {
  const router = useRouter();
  const [items, updateItems] = useOptimistic(
    data.items,
    (currentItems, action: TaskItemsAction) => {
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
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(items.length === 0);
  const [createValues, setCreateValues] = useState<TaskFormValues>(getDefaultValues());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<TaskFormValues>(getDefaultValues());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startAction] = useTransition();

  const summary = useMemo(() => getSummary(items), [items]);

  const sections = useMemo<TaskSection[]>(() => {
    const overdue = items.filter((item) => item.isOverdue);
    const dueThisWeek = items.filter((item) => item.isDueThisWeek);
    const upcoming = items.filter((item) => item.isUpcoming);
    const completed = items.filter((item) => item.status === "done");

    return [
      {
        key: "overdue",
        title: "Overdue",
        description: "Tasks that still need attention from earlier in the week.",
        items: overdue,
      },
      {
        key: "due-this-week",
        title: "Due this week",
        description: "The current week in one clear view.",
        items: dueThisWeek,
      },
      {
        key: "upcoming",
        title: "Upcoming",
        description: "Tasks scheduled later or still flexible.",
        items: upcoming,
      },
      {
        key: "completed",
        title: "Completed",
        description: "Recently finished work for the household.",
        items: completed,
      },
    ].filter((section) => section.items.length > 0);
  }, [items]);

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

  function applyOptimisticTask(item: TaskRecord) {
    updateItems({ type: "add", item });
  }

  function patchOptimisticTask(itemId: string, patch: Partial<TaskRecord>) {
    updateItems({ type: "patch", itemId, patch });
  }

  function removeOptimisticTask(itemId: string) {
    updateItems({ type: "remove", itemId });
  }

  function resetCreateForm() {
    setCreateValues(getDefaultValues());
  }

  function isValid(values: TaskFormValues) {
    if (!values.title.trim()) {
      setErrorMessage("Task title is required.");
      return false;
    }

    if (values.recurrenceType !== "none" && !values.dueDate) {
      setErrorMessage("Recurring tasks need a due date.");
      return false;
    }

    if (values.recurrenceType !== "none") {
      const interval = Number(values.recurrenceInterval);

      if (Number.isNaN(interval) || interval <= 0) {
        setErrorMessage("Recurring tasks need a repeat interval greater than zero.");
        return false;
      }
    }

    return true;
  }

  function handleQuickAdd() {
    const title = quickAddTitle.trim();

    if (!title) {
      return;
    }

    const optimisticTask = buildOptimisticTask(
      { ...getDefaultValues(), title, dueDate: "" },
      data.householdId,
      data.currentUserId,
      data.members,
    );

    applyOptimisticTask(optimisticTask);
    setQuickAddTitle("");

    void runAction(async () => {
      await createTaskAction({
        title,
        status: "open",
        priority: "medium",
      });
    });
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid(createValues)) {
      return;
    }

    const optimisticTask = buildOptimisticTask(
      createValues,
      data.householdId,
      data.currentUserId,
      data.members,
    );
    applyOptimisticTask(optimisticTask);
    resetCreateForm();
    setShowCreateForm(false);

    void runAction(async () => {
      await createTaskAction(createInput(createValues));
    });
  }

  function startEditing(item: TaskRecord) {
    setEditingItemId(item.id);
    setEditingValues(getValuesFromTask(item));
  }

  function cancelEditing() {
    setEditingItemId(null);
    setEditingValues(getDefaultValues());
  }

  function handleSaveEdit(itemId: string) {
    if (!isValid(editingValues)) {
      return;
    }

    const optimisticTask = buildOptimisticTask(
      editingValues,
      data.householdId,
      data.currentUserId,
      data.members,
    );

    patchOptimisticTask(itemId, {
      title: optimisticTask.title,
      description: optimisticTask.description,
      assignedTo: optimisticTask.assignedTo,
      dueDate: optimisticTask.dueDate,
      recurrenceType: optimisticTask.recurrenceType,
      recurrenceInterval: optimisticTask.recurrenceInterval,
      status: optimisticTask.status,
      priority: optimisticTask.priority,
      completedAt: optimisticTask.completedAt,
      assignedLabel: optimisticTask.assignedLabel,
      isOverdue: optimisticTask.isOverdue,
      isDueThisWeek: optimisticTask.isDueThisWeek,
      isUpcoming: optimisticTask.isUpcoming,
    });
    cancelEditing();

    void runAction(async () => {
      await updateTaskAction(itemId, createInput(editingValues));
    });
  }

  function handleComplete(item: TaskRecord) {
    if (item.status === "done") {
      return;
    }

    patchOptimisticTask(item.id, {
      status: "done",
      isOverdue: false,
      isDueThisWeek: false,
      isUpcoming: false,
      completedAt: new Date().toISOString(),
      completedBy: data.currentUserId,
    });

    void runAction(async () => {
      await completeTaskAction(item.id);
    });
  }

  function handleDelete(itemId: string) {
    removeOptimisticTask(itemId);

    void runAction(async () => {
      await deleteTaskAction(itemId);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="gap-5 border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>Tasks</Badge>
              <div className="space-y-2">
                <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
                  Household tasks
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  Shared chores, one-time to-dos, and recurring household work for{" "}
                  {data.householdName}, without the noise or gimmicks.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{summary.overdueCount} overdue</Badge>
              <Badge variant="secondary">{summary.dueThisWeekCount} due this week</Badge>
              <Badge variant="secondary">{summary.completedCount} completed</Badge>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {[
              { label: "Overdue", value: summary.overdueCount },
              { label: "Due this week", value: summary.dueThisWeekCount },
              { label: "Upcoming", value: summary.upcomingCount },
              { label: "Completed", value: summary.completedCount },
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
                value={quickAddTitle}
                onChange={(event) => setQuickAddTitle(event.target.value)}
                placeholder="Quick add unload dishwasher, change sheets, take out recycling..."
                className="border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleQuickAdd();
                  }
                }}
              />
              <Button onClick={handleQuickAdd} disabled={isPending || !quickAddTitle.trim()}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateForm((current) => !current)}
            >
              {showCreateForm ? "Hide details form" : "Add with details"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {showCreateForm ? (
            <form
              onSubmit={handleCreate}
              className="grid gap-3 rounded-[calc(var(--radius)-0.05rem)] border border-border bg-white/70 p-4 md:grid-cols-2"
            >
              <TaskItemForm
                values={createValues}
                setValues={setCreateValues}
                members={data.members}
                className="contents"
              />
              <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Create task
                </Button>
              </div>
            </form>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-900">
              {errorMessage}
            </div>
          ) : null}

          {items.length === 0 ? (
            <Card className="border-dashed bg-white/55">
              <CardHeader className="items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <ListChecks className="size-6" />
                </div>
                <CardTitle className="mt-4 font-serif text-3xl tracking-[-0.04em]">
                  Keep the week visible.
                </CardTitle>
                <CardDescription className="max-w-md text-base leading-7">
                  Start with a few real household tasks like dishes, trash, bathrooms, or
                  school prep so the week feels shared instead of carried by memory.
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
                    {section.items.length} task{section.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-3">
                  {section.items.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const recurrenceLabel = formatRecurrence(item);

                    return (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="px-4 py-4 sm:px-5">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleComplete(item)}
                              className="mt-0.5 text-primary"
                              aria-label={
                                item.status === "done"
                                  ? `${item.title} already completed`
                                  : `Mark ${item.title} complete`
                              }
                              disabled={item.status === "done"}
                            >
                              {item.status === "done" ? (
                                <CheckCircle2 className="size-6" />
                              ) : (
                                <Circle className="size-6" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1 space-y-2">
                              {!isEditing ? (
                                <>
                                  <div className="flex flex-wrap items-start gap-2">
                                    <p
                                      className={cn(
                                        "text-base font-medium text-foreground",
                                        item.status === "done" &&
                                          "text-muted-foreground line-through",
                                      )}
                                    >
                                      {item.title}
                                    </p>
                                    <span
                                      className={cn(
                                        "rounded-full border px-2.5 py-1 text-xs",
                                        getPriorityTone(item.priority),
                                      )}
                                    >
                                      {item.priority}
                                    </span>
                                    {item.assignedLabel ? (
                                      <Badge variant="secondary">{item.assignedLabel}</Badge>
                                    ) : null}
                                    {item.status === "in_progress" ? (
                                      <Badge variant="secondary">In progress</Badge>
                                    ) : null}
                                    {item.isOverdue ? (
                                      <Badge className="bg-rose-600 text-white hover:bg-rose-600">
                                        Overdue
                                      </Badge>
                                    ) : null}
                                  </div>

                                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                    <span>{formatDueDate(item.dueDate)}</span>
                                    {recurrenceLabel ? <span>{recurrenceLabel}</span> : null}
                                  </div>

                                  {item.description ? (
                                    <p className="text-sm leading-6 text-muted-foreground">
                                      {item.description}
                                    </p>
                                  ) : null}
                                </>
                              ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                  <TaskItemForm
                                    values={editingValues}
                                    setValues={setEditingValues}
                                    members={data.members}
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
                                    aria-label={`Edit ${item.title}`}
                                  >
                                    <Pencil className="size-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(item.id)}
                                    aria-label={`Delete ${item.title}`}
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
          <CardTitle>Made for real households</CardTitle>
          <CardDescription>
            Clear assignments, quiet accountability, and enough recurring structure to
            keep chores moving without turning the home into a productivity game.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "One-time and repeating",
              description:
                "Use the same calm workflow for a single errand or the weekly trash routine.",
            },
            {
              title: "Shared visibility",
              description:
                "Assignments keep responsibilities clear without adding pressure or clutter.",
            },
            {
              title: "Completion that moves forward",
              description:
                "Recurring tasks create the next occurrence when completed so the schedule stays alive.",
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
