"use client";

import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import {
  taskPriorityOptions,
  taskRecurrenceOptions,
  taskStatusOptions,
  type HouseholdMemberOption,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

export type TaskFormValues = {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  recurrenceType: "none" | "day" | "week" | "month";
  recurrenceInterval: string;
  status: TaskStatus;
  priority: TaskPriority;
};

type TaskItemFormProps = {
  values: TaskFormValues;
  setValues: Dispatch<SetStateAction<TaskFormValues>>;
  members: HouseholdMemberOption[];
  className?: string;
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const statusLabels: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Completed",
};

const recurrenceLabels: Record<(typeof taskRecurrenceOptions)[number], string> = {
  none: "One-time",
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

export function TaskItemForm({
  values,
  setValues,
  members,
  className,
}: TaskItemFormProps) {
  return (
    <div className={className}>
      <Input
        value={values.title}
        onChange={(event) =>
          setValues((current) => ({ ...current, title: event.target.value }))
        }
        placeholder="Task title"
        required
      />
      <select
        value={values.assignedTo}
        onChange={(event) =>
          setValues((current) => ({ ...current, assignedTo: event.target.value }))
        }
        className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none"
      >
        <option value="">Unassigned</option>
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.label}
          </option>
        ))}
      </select>
      <Input
        type="date"
        value={values.dueDate}
        onChange={(event) =>
          setValues((current) => ({ ...current, dueDate: event.target.value }))
        }
      />
      <select
        value={values.priority}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            priority: event.target.value as TaskPriority,
          }))
        }
        className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none"
      >
        {taskPriorityOptions.map((option) => (
          <option key={option} value={option}>
            {priorityLabels[option]}
          </option>
        ))}
      </select>
      <select
        value={values.recurrenceType}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            recurrenceType: event.target.value as TaskFormValues["recurrenceType"],
            recurrenceInterval:
              event.target.value === "none" ? "" : current.recurrenceInterval || "1",
          }))
        }
        className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none"
      >
        {taskRecurrenceOptions.map((option) => (
          <option key={option} value={option}>
            {recurrenceLabels[option]}
          </option>
        ))}
      </select>
      <Input
        value={values.recurrenceInterval}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            recurrenceInterval: event.target.value,
          }))
        }
        placeholder="Repeat every"
        inputMode="numeric"
        disabled={values.recurrenceType === "none"}
      />
      <select
        value={values.status}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            status: event.target.value as TaskStatus,
          }))
        }
        className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none"
      >
        {taskStatusOptions.map((option) => (
          <option key={option} value={option}>
            {statusLabels[option]}
          </option>
        ))}
      </select>
      <textarea
        value={values.description}
        onChange={(event) =>
          setValues((current) => ({ ...current, description: event.target.value }))
        }
        placeholder="Description"
        className="min-h-[112px] rounded-[calc(var(--radius)-0.15rem)] border border-border bg-white/80 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 md:col-span-2"
      />
    </div>
  );
}
