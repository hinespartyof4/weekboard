export type WeeklyDigestTaskItem = {
  id: string;
  title: string;
  assignedLabel: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
};

export type WeeklyDigestInventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  storageLocation: string;
  expirationDate: string | null;
};

export type WeeklyDigestRecurringItem = {
  id: string;
  name: string;
  defaultQuantity: number;
  unit: string | null;
  nextDueDate: string;
  frequencyLabel: string;
  preferredStore: string | null;
};

export type WeeklyDigestData = {
  householdId: string;
  householdName: string;
  recipientEmail: string;
  weekStartDate: string;
  weekRangeLabel: string;
  resetDay: number;
  appUrl: string;
  aiSummary: string | null;
  summary: {
    lowStockCount: number;
    expiringSoonCount: number;
    recurringDueCount: number;
    overdueTasksCount: number;
    dueThisWeekTasksCount: number;
    totalNeedsAttention: number;
  };
  lowStockItems: WeeklyDigestInventoryItem[];
  expiringSoonItems: WeeklyDigestInventoryItem[];
  recurringDueItems: WeeklyDigestRecurringItem[];
  overdueTasks: WeeklyDigestTaskItem[];
  dueThisWeekTasks: WeeklyDigestTaskItem[];
};
