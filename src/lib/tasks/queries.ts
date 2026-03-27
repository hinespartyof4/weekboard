import { createClient } from "@/lib/supabase/server";
import { addDays, getTodayInTimeZone } from "@/lib/date";
import { getPreviewTaskBoardData } from "@/lib/preview/data";
import { isPreviewModeEnabled } from "@/lib/supabase/env";
import type {
  HouseholdMemberOption,
  TaskBoardData,
  TaskPriority,
  TaskRecord,
  TaskRecurrenceType,
  TaskStatus,
} from "@/lib/tasks/types";

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
  completed_at: string | null;
  completed_by: string | null;
};

type MemberRow = {
  user_id: string;
  display_name: string | null;
  role: "owner" | "admin" | "member";
};

function getMemberLabel(member: MemberRow, currentUserId: string) {
  if (member.user_id === currentUserId) {
    return "You";
  }

  const displayName = member.display_name?.trim();

  if (displayName) {
    return displayName;
  }

  switch (member.role) {
    case "owner":
      return "Household owner";
    case "admin":
      return "Household admin";
    default:
      return "Household member";
  }
}

function mapTask(
  item: TaskRow,
  labels: Map<string, string>,
  today: string,
  weekEnd: string,
): TaskRecord {
  const isCompleted = item.status === "done";
  const isOverdue = !isCompleted && item.due_date !== null && item.due_date < today;
  const isDueThisWeek =
    !isCompleted &&
    item.due_date !== null &&
    item.due_date >= today &&
    item.due_date <= weekEnd;
  const isUpcoming =
    !isCompleted &&
    (item.due_date === null || item.due_date > weekEnd);

  return {
    id: item.id,
    householdId: item.household_id,
    title: item.title,
    description: item.description,
    assignedTo: item.assigned_to,
    dueDate: item.due_date,
    recurrenceType: item.recurrence_type,
    recurrenceInterval: item.recurrence_interval,
    status: item.status,
    priority: item.priority,
    completedAt: item.completed_at,
    completedBy: item.completed_by,
    assignedLabel: item.assigned_to ? (labels.get(item.assigned_to) ?? "Household member") : null,
    isOverdue,
    isDueThisWeek,
    isUpcoming,
  };
}

export async function getTaskBoardData(args: {
  householdId: string;
  householdName: string;
  currentUserId: string;
  timeZone: string;
}): Promise<TaskBoardData> {
  if (isPreviewModeEnabled()) {
    return getPreviewTaskBoardData(args.timeZone);
  }

  const supabase = await createClient();
  const today = getTodayInTimeZone(args.timeZone);
  const weekEnd = addDays(today, 6);

  const [tasksResult, membersResult] = await Promise.all([
    supabase
      .from("household_tasks")
      .select(
        "id, household_id, title, description, assigned_to, due_date, recurrence_type, recurrence_interval, status, priority, completed_at, completed_by",
      )
      .eq("household_id", args.householdId)
      .order("status", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("household_members")
      .select("user_id, display_name, role")
      .eq("household_id", args.householdId)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
  ]);

  const members = ((membersResult.data ?? []) as MemberRow[]).map((member) => ({
    userId: member.user_id,
    label: getMemberLabel(member, args.currentUserId),
    role: member.role,
  })) satisfies HouseholdMemberOption[];

  const labels = new Map(members.map((member) => [member.userId, member.label]));
  const items = ((tasksResult.data ?? []) as TaskRow[]).map((item) =>
    mapTask(item, labels, today, weekEnd),
  );

  return {
    householdId: args.householdId,
    householdName: args.householdName,
    currentUserId: args.currentUserId,
    items,
    members,
    summary: {
      overdueCount: items.filter((item) => item.isOverdue).length,
      dueThisWeekCount: items.filter((item) => item.isDueThisWeek).length,
      upcomingCount: items.filter((item) => item.isUpcoming).length,
      completedCount: items.filter((item) => item.status === "done").length,
    },
  };
}
