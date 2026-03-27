"use server";

import { revalidatePath } from "next/cache";

import { getActiveHouseholdContext } from "@/lib/app/context";
import { analyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { assertCanCreateRecord } from "@/lib/billing/gates";
import { assertWritesEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase/server";
import { advanceTaskDueDate } from "@/lib/tasks/automation";
import type {
  TaskInput,
  TaskPriority,
  TaskRecurrenceType,
  TaskStatus,
} from "@/lib/tasks/types";

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseRecurrenceInterval(value?: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error("Recurrence interval must be a valid number greater than zero.");
  }

  return parsed;
}

function getTaskPatch(input: TaskInput) {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Task title is required.");
  }

  const recurrenceType =
    input.recurrenceType && input.recurrenceType !== "none"
      ? input.recurrenceType
      : null;
  const recurrenceInterval = parseRecurrenceInterval(input.recurrenceInterval);
  const dueDate = normalizeOptional(input.dueDate);

  if (recurrenceType && !recurrenceInterval) {
    throw new Error("Recurring tasks need a repeat interval.");
  }

  if (recurrenceType && !dueDate) {
    throw new Error("Recurring tasks need a due date to repeat from.");
  }

  if (!recurrenceType && recurrenceInterval !== null) {
    throw new Error("Choose a recurrence pattern before setting an interval.");
  }

  return {
    title,
    description: normalizeOptional(input.description),
    assigned_to: normalizeOptional(input.assignedTo),
    due_date: dueDate,
    recurrence_type: recurrenceType,
    recurrence_interval: recurrenceInterval,
    status: input.status,
    priority: input.priority,
  };
}

type TaskRow = {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  recurrence_type: TaskRecurrenceType | null;
  recurrence_interval: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_by: string;
  series_id: string | null;
};

async function fetchTaskForHousehold(taskId: string, householdId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("household_tasks")
    .select(
      "id, household_id, title, description, assigned_to, due_date, recurrence_type, recurrence_interval, status, priority, created_by, series_id",
    )
    .eq("id", taskId)
    .eq("household_id", householdId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TaskRow | null;
}

async function completeTaskWithRecurrence(args: {
  task: TaskRow;
  householdId: string;
  userId: string;
  patch: ReturnType<typeof getTaskPatch>;
}) {
  const supabase = await createClient();
  const seriesId =
    args.patch.recurrence_type !== null ? (args.task.series_id ?? args.task.id) : args.task.series_id;
  const completedAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("household_tasks")
    .update({
      ...args.patch,
      status: "done",
      completed_at: completedAt,
      completed_by: args.userId,
      series_id: seriesId,
    })
    .eq("id", args.task.id)
    .eq("household_id", args.householdId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (args.patch.recurrence_type && args.patch.recurrence_interval && args.patch.due_date) {
    const { error: insertError } = await supabase.from("household_tasks").insert({
      household_id: args.householdId,
      title: args.patch.title,
      description: args.patch.description,
      assigned_to: args.patch.assigned_to,
      due_date: advanceTaskDueDate(
        args.patch.due_date,
        args.patch.recurrence_type,
        args.patch.recurrence_interval,
      ),
      recurrence_type: args.patch.recurrence_type,
      recurrence_interval: args.patch.recurrence_interval,
      status: "open",
      priority: args.patch.priority,
      created_by: args.task.created_by,
      series_id: seriesId,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

export async function createTaskAction(input: TaskInput) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  await assertCanCreateRecord(context, "household_tasks");
  const supabase = await createClient();
  const patch = getTaskPatch(input);
  const { count: existingCount } = await supabase
    .from("household_tasks")
    .select("*", { count: "exact", head: true })
    .eq("household_id", context.household.id);
  const completionPatch =
    patch.status === "done"
      ? {
          completed_at: new Date().toISOString(),
          completed_by: context.user.id,
        }
      : {
          completed_at: null,
          completed_by: null,
        };

  const { error } = await supabase.from("household_tasks").insert({
    household_id: context.household.id,
    created_by: context.user.id,
    ...patch,
    ...completionPatch,
  });

  if (error) {
    throw new Error(error.message);
  }

  if ((existingCount ?? 0) === 0) {
    await captureServerEvent({
      distinctId: context.user.id,
      event: analyticsEvents.firstTaskCreated,
      properties: {
        household_id: context.household.id,
        priority: patch.priority,
      },
    });
  }

  revalidatePath("/app/tasks");
  revalidatePath("/app");
}

export async function updateTaskAction(taskId: string, input: TaskInput) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const supabase = await createClient();
  const task = await fetchTaskForHousehold(taskId, context.household.id);

  if (!task) {
    throw new Error("Task not found.");
  }

  const patch = getTaskPatch(input);

  if (patch.status === "done" && task.status !== "done") {
    await completeTaskWithRecurrence({
      task,
      householdId: context.household.id,
      userId: context.user.id,
      patch,
    });
  } else {
    const completionPatch =
      patch.status === "done"
        ? {
            completed_at: new Date().toISOString(),
            completed_by: context.user.id,
          }
        : {
            completed_at: null,
            completed_by: null,
          };

    const { error } = await supabase
      .from("household_tasks")
      .update({
        ...patch,
        ...completionPatch,
      })
      .eq("id", taskId)
      .eq("household_id", context.household.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/app/tasks");
  revalidatePath("/app");
}

export async function completeTaskAction(taskId: string) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const task = await fetchTaskForHousehold(taskId, context.household.id);

  if (!task) {
    throw new Error("Task not found.");
  }

  if (task.status === "done") {
    return;
  }

  await completeTaskWithRecurrence({
    task,
    householdId: context.household.id,
    userId: context.user.id,
    patch: {
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to,
      due_date: task.due_date,
      recurrence_type: task.recurrence_type,
      recurrence_interval: task.recurrence_interval,
      status: "done",
      priority: task.priority,
    },
  });

  revalidatePath("/app/tasks");
  revalidatePath("/app");
}

export async function deleteTaskAction(taskId: string) {
  assertWritesEnabled();
  const context = await getActiveHouseholdContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("household_tasks")
    .delete()
    .eq("id", taskId)
    .eq("household_id", context.household.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/tasks");
  revalidatePath("/app");
}
