export const taskStatusOptions = ["open", "in_progress", "done"] as const;
export const taskPriorityOptions = ["low", "medium", "high"] as const;
export const taskRecurrenceOptions = ["none", "day", "week", "month"] as const;

export type TaskStatus = (typeof taskStatusOptions)[number];
export type TaskPriority = (typeof taskPriorityOptions)[number];
export type TaskRecurrenceType = Exclude<(typeof taskRecurrenceOptions)[number], "none">;

export type HouseholdMemberOption = {
  userId: string;
  label: string;
  role: "owner" | "admin" | "member";
};

export type TaskRecord = {
  id: string;
  householdId: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  recurrenceType: TaskRecurrenceType | null;
  recurrenceInterval: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  completedAt: string | null;
  completedBy: string | null;
  assignedLabel: string | null;
  isOverdue: boolean;
  isDueThisWeek: boolean;
  isUpcoming: boolean;
};

export type TaskBoardData = {
  householdId: string;
  householdName: string;
  currentUserId: string;
  items: TaskRecord[];
  members: HouseholdMemberOption[];
  summary: {
    overdueCount: number;
    dueThisWeekCount: number;
    upcomingCount: number;
    completedCount: number;
  };
};

export type TaskInput = {
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  recurrenceType?: "none" | TaskRecurrenceType;
  recurrenceInterval?: string;
  status: TaskStatus;
  priority: TaskPriority;
};
