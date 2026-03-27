export type WeeklyResetInventoryItem = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  quantity: number;
  lowStockThreshold: number | null;
  storageLocation: string;
  expirationDate: string | null;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
};

export type WeeklyResetRecurringItem = {
  id: string;
  name: string;
  category: string | null;
  defaultQuantity: number;
  unit: string | null;
  preferredStore: string | null;
  nextDueDate: string;
  frequencyLabel: string;
  autoAddToShoppingList: boolean;
};

export type WeeklyResetTaskItem = {
  id: string;
  title: string;
  assignedLabel: string | null;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
};

export type WeeklyResetData = {
  householdId: string;
  householdName: string;
  weekStartDate: string;
  weekRangeLabel: string;
  aiSummary: string | null;
  aiSummaryGeneratedAt: string | null;
  summary: {
    lowStockCount: number;
    expiringSoonCount: number;
    recurringDueCount: number;
    overdueTasksCount: number;
    dueThisWeekTasksCount: number;
    totalNeedsAttention: number;
  };
  lowStockItems: WeeklyResetInventoryItem[];
  expiringSoonItems: WeeklyResetInventoryItem[];
  recurringDueItems: WeeklyResetRecurringItem[];
  overdueTasks: WeeklyResetTaskItem[];
  dueThisWeekTasks: WeeklyResetTaskItem[];
};
