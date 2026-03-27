export const frequencyTypeOptions = ["day", "week", "month"] as const;

export type FrequencyType = (typeof frequencyTypeOptions)[number];

export type RecurringItemRecord = {
  id: string;
  householdId: string;
  name: string;
  category: string | null;
  defaultQuantity: number;
  unit: string | null;
  frequencyType: FrequencyType;
  frequencyInterval: number;
  nextDueDate: string;
  preferredStore: string | null;
  autoAddToShoppingList: boolean;
  active: boolean;
  isDueThisWeek: boolean;
  isDueSoon: boolean;
  isOverdue: boolean;
};

export type RecurringBoardData = {
  householdId: string;
  householdName: string;
  items: RecurringItemRecord[];
  summary: {
    totalItems: number;
    dueThisWeekCount: number;
    dueSoonCount: number;
    activeCount: number;
  };
};

export type RecurringItemInput = {
  name: string;
  category?: string;
  defaultQuantity: string;
  unit?: string;
  frequencyType: FrequencyType;
  frequencyInterval: string;
  nextDueDate: string;
  preferredStore?: string;
  autoAddToShoppingList?: boolean;
  active?: boolean;
};
