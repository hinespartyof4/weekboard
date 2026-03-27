import type { User } from "@supabase/supabase-js";

import type {
  AppContextSnapshot,
  DashboardSummary,
  DashboardAttentionItem,
} from "@/lib/app/types";
import { getBarcodeFeatureEntitlement } from "@/lib/barcode/entitlements";
import { addDays, formatShortDate, getTodayInTimeZone, getWeekStartDate, subtractDays } from "@/lib/date";
import type { PantryBoardData, PantryItemRecord } from "@/lib/pantry/types";
import type { RecurringBoardData, RecurringItemRecord } from "@/lib/recurring/types";
import type { ShoppingBoardData, ShoppingItemRecord } from "@/lib/shopping/types";
import type { TaskBoardData, TaskRecord } from "@/lib/tasks/types";
import type { WeeklyResetData } from "@/lib/weekly-reset/types";

const previewUser = {
  id: "preview-user",
  app_metadata: {
    provider: "preview",
    providers: ["preview"],
  },
  user_metadata: {
    display_name: "Alex",
  },
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00.000Z",
  email: "alex@weekboard.preview",
  role: "authenticated",
  identities: [],
} as User;

const previewHousehold = {
  id: "preview-household",
  name: "The Parker Home",
  timezone: "America/New_York",
  weekStartsOn: 0,
  resetDay: 0,
} as const;

const previewMembership = {
  id: "preview-membership",
  householdId: previewHousehold.id,
  role: "owner",
  status: "active",
} as const;

const previewShoppingList = {
  id: "preview-shopping-list",
  householdId: previewHousehold.id,
  name: "Main shopping list",
  isDefault: true,
} as const;

const previewMembers = [
  {
    userId: previewUser.id,
    label: "You",
    role: "owner" as const,
  },
  {
    userId: "preview-member-jordan",
    label: "Jordan",
    role: "member" as const,
  },
];

function getPreviewPlanTier() {
  const value = process.env.WEEKBOARD_PREVIEW_PLAN_TIER;

  if (value === "free" || value === "plus" || value === "home_pro") {
    return value;
  }

  return "home_pro" as const;
}

function getPreviewPantryItems(timeZone: string): PantryItemRecord[] {
  const today = getTodayInTimeZone(timeZone);

  return [
    {
      id: "pantry-olive-oil",
      householdId: previewHousehold.id,
      name: "Olive oil",
      category: "Pantry staples",
      storageLocation: "pantry",
      quantity: 1,
      unit: "bottle",
      lowStockThreshold: 1,
      expirationDate: null,
      notes: "Good for one more weekly cook-up.",
      status: "low",
      barcode: "001111111111",
      productBrand: null,
      productImageUrl: null,
      isLowStock: true,
      isExpiringSoon: false,
      isExpired: false,
    },
    {
      id: "pantry-eggs",
      householdId: previewHousehold.id,
      name: "Eggs",
      category: "Dairy & eggs",
      storageLocation: "fridge",
      quantity: 4,
      unit: "count",
      lowStockThreshold: 6,
      expirationDate: addDays(today, 5),
      notes: null,
      status: "low",
      barcode: "002222222222",
      productBrand: null,
      productImageUrl: null,
      isLowStock: true,
      isExpiringSoon: true,
      isExpired: false,
    },
    {
      id: "pantry-milk",
      householdId: previewHousehold.id,
      name: "Milk",
      category: "Dairy & eggs",
      storageLocation: "fridge",
      quantity: 1,
      unit: "carton",
      lowStockThreshold: 1,
      expirationDate: addDays(today, 2),
      notes: null,
      status: "low",
      barcode: "003333333333",
      productBrand: null,
      productImageUrl: null,
      isLowStock: true,
      isExpiringSoon: true,
      isExpired: false,
    },
    {
      id: "pantry-spinach",
      householdId: previewHousehold.id,
      name: "Spinach",
      category: "Produce",
      storageLocation: "fridge",
      quantity: 1,
      unit: "box",
      lowStockThreshold: null,
      expirationDate: addDays(today, 1),
      notes: "Best used in the next dinner or lunch prep.",
      status: "in_stock",
      barcode: null,
      productBrand: null,
      productImageUrl: null,
      isLowStock: false,
      isExpiringSoon: true,
      isExpired: false,
    },
    {
      id: "pantry-frozen-berries",
      householdId: previewHousehold.id,
      name: "Frozen berries",
      category: "Frozen",
      storageLocation: "freezer",
      quantity: 1,
      unit: "bag",
      lowStockThreshold: 1,
      expirationDate: null,
      notes: null,
      status: "low",
      barcode: null,
      productBrand: null,
      productImageUrl: null,
      isLowStock: true,
      isExpiringSoon: false,
      isExpired: false,
    },
    {
      id: "pantry-dish-soap",
      householdId: previewHousehold.id,
      name: "Dish soap",
      category: "Cleaning",
      storageLocation: "cleaning",
      quantity: 0.25,
      unit: "bottle",
      lowStockThreshold: 1,
      expirationDate: null,
      notes: null,
      status: "low",
      barcode: "036000291452",
      productBrand: "Clean Kitchen",
      productImageUrl: null,
      isLowStock: true,
      isExpiringSoon: false,
      isExpired: false,
    },
    {
      id: "pantry-detergent",
      householdId: previewHousehold.id,
      name: "Laundry detergent",
      category: "Laundry",
      storageLocation: "laundry",
      quantity: 2,
      unit: "bottle",
      lowStockThreshold: 1,
      expirationDate: null,
      notes: null,
      status: "in_stock",
      barcode: "041196910118",
      productBrand: "Fresh Home",
      productImageUrl: null,
      isLowStock: false,
      isExpiringSoon: false,
      isExpired: false,
    },
    {
      id: "pantry-yogurt",
      householdId: previewHousehold.id,
      name: "Greek yogurt",
      category: "Dairy & eggs",
      storageLocation: "fridge",
      quantity: 3,
      unit: "cup",
      lowStockThreshold: 2,
      expirationDate: subtractDays(today, 1),
      notes: null,
      status: "in_stock",
      barcode: null,
      productBrand: null,
      productImageUrl: null,
      isLowStock: false,
      isExpiringSoon: false,
      isExpired: true,
    },
  ];
}

function getPreviewShoppingItems(): ShoppingItemRecord[] {
  return [
    {
      id: "shopping-paper-towels",
      householdId: previewHousehold.id,
      shoppingListId: previewShoppingList.id,
      name: "Paper towels",
      category: "Household",
      quantity: "1",
      unit: "pack",
      priority: true,
      preferredStore: "Target",
      notes: null,
      status: "needed",
      barcode: "012345678905",
      productBrand: "Household Co.",
      productImageUrl: null,
    },
    {
      id: "shopping-bananas",
      householdId: previewHousehold.id,
      shoppingListId: previewShoppingList.id,
      name: "Bananas",
      category: "Produce",
      quantity: "6",
      unit: null,
      priority: false,
      preferredStore: "Trader Joe's",
      notes: null,
      status: "needed",
      barcode: null,
      productBrand: null,
      productImageUrl: null,
    },
    {
      id: "shopping-dog-food",
      householdId: previewHousehold.id,
      shoppingListId: previewShoppingList.id,
      name: "Dog food",
      category: "Pets",
      quantity: "1",
      unit: "bag",
      priority: true,
      preferredStore: "Chewy",
      notes: "Chicken recipe if available.",
      status: "needed",
      barcode: "073366118238",
      productBrand: "Good Pup",
      productImageUrl: null,
    },
    {
      id: "shopping-vitamins",
      householdId: previewHousehold.id,
      shoppingListId: previewShoppingList.id,
      name: "Multivitamins",
      category: "Health",
      quantity: "1",
      unit: "bottle",
      priority: false,
      preferredStore: "Costco",
      notes: null,
      status: "needed",
      barcode: "030000012345",
      productBrand: "Daily Basics",
      productImageUrl: null,
    },
    {
      id: "shopping-spinach",
      householdId: previewHousehold.id,
      shoppingListId: previewShoppingList.id,
      name: "Spinach",
      category: "Produce",
      quantity: "1",
      unit: "box",
      priority: false,
      preferredStore: null,
      notes: null,
      status: "purchased",
      barcode: null,
      productBrand: null,
      productImageUrl: null,
    },
  ];
}

function getPreviewRecurringItems(timeZone: string): RecurringItemRecord[] {
  const today = getTodayInTimeZone(timeZone);
  const dueSoonEnd = addDays(today, 14);

  const items: RecurringItemRecord[] = [
    {
      id: "recurring-paper-towels",
      householdId: previewHousehold.id,
      name: "Paper towels",
      category: "Household",
      defaultQuantity: 1,
      unit: "pack",
      frequencyType: "week",
      frequencyInterval: 2,
      nextDueDate: today,
      preferredStore: "Target",
      autoAddToShoppingList: true,
      active: true,
      isDueThisWeek: true,
      isDueSoon: false,
      isOverdue: false,
    },
    {
      id: "recurring-vitamins",
      householdId: previewHousehold.id,
      name: "Vitamins",
      category: "Health",
      defaultQuantity: 1,
      unit: "bottle",
      frequencyType: "month",
      frequencyInterval: 1,
      nextDueDate: addDays(today, 2),
      preferredStore: "Costco",
      autoAddToShoppingList: true,
      active: true,
      isDueThisWeek: true,
      isDueSoon: false,
      isOverdue: false,
    },
    {
      id: "recurring-air-filters",
      householdId: previewHousehold.id,
      name: "Air filters",
      category: "Home maintenance",
      defaultQuantity: 1,
      unit: "filter",
      frequencyType: "month",
      frequencyInterval: 3,
      nextDueDate: addDays(today, 5),
      preferredStore: "Amazon",
      autoAddToShoppingList: false,
      active: true,
      isDueThisWeek: true,
      isDueSoon: false,
      isOverdue: false,
    },
    {
      id: "recurring-dog-food",
      householdId: previewHousehold.id,
      name: "Dog food",
      category: "Pets",
      defaultQuantity: 1,
      unit: "bag",
      frequencyType: "week",
      frequencyInterval: 3,
      nextDueDate: addDays(today, 8),
      preferredStore: "Chewy",
      autoAddToShoppingList: true,
      active: true,
      isDueThisWeek: false,
      isDueSoon: true,
      isOverdue: false,
    },
    {
      id: "recurring-dishwasher-tabs",
      householdId: previewHousehold.id,
      name: "Dishwasher tabs",
      category: "Cleaning",
      defaultQuantity: 1,
      unit: "bag",
      frequencyType: "month",
      frequencyInterval: 1,
      nextDueDate: subtractDays(today, 1),
      preferredStore: "Target",
      autoAddToShoppingList: true,
      active: true,
      isDueThisWeek: true,
      isDueSoon: false,
      isOverdue: true,
    },
    {
      id: "recurring-detergent",
      householdId: previewHousehold.id,
      name: "Detergent",
      category: "Laundry",
      defaultQuantity: 1,
      unit: "bottle",
      frequencyType: "month",
      frequencyInterval: 1,
      nextDueDate: addDays(dueSoonEnd, 7),
      preferredStore: "Costco",
      autoAddToShoppingList: false,
      active: false,
      isDueThisWeek: false,
      isDueSoon: false,
      isOverdue: false,
    },
  ];

  return items;
}

function getPreviewTasks(timeZone: string): TaskRecord[] {
  const today = getTodayInTimeZone(timeZone);
  const weekEnd = addDays(today, 6);

  return [
    {
      id: "task-recycling",
      householdId: previewHousehold.id,
      title: "Take out recycling",
      description: "Boxes are stacking up near the pantry door.",
      assignedTo: previewUser.id,
      dueDate: subtractDays(today, 1),
      recurrenceType: "week",
      recurrenceInterval: 1,
      status: "open",
      priority: "high",
      completedAt: null,
      completedBy: null,
      assignedLabel: "You",
      isOverdue: true,
      isDueThisWeek: false,
      isUpcoming: false,
    },
    {
      id: "task-laundry-reset",
      householdId: previewHousehold.id,
      title: "Laundry reset",
      description: "Wash, fold, and put away one full cycle before Wednesday.",
      assignedTo: "preview-member-jordan",
      dueDate: today,
      recurrenceType: "week",
      recurrenceInterval: 1,
      status: "open",
      priority: "medium",
      completedAt: null,
      completedBy: null,
      assignedLabel: "Jordan",
      isOverdue: false,
      isDueThisWeek: true,
      isUpcoming: false,
    },
    {
      id: "task-school-forms",
      householdId: previewHousehold.id,
      title: "Send school forms",
      description: "Return the signed permission slip.",
      assignedTo: null,
      dueDate: addDays(today, 3),
      recurrenceType: null,
      recurrenceInterval: null,
      status: "in_progress",
      priority: "medium",
      completedAt: null,
      completedBy: null,
      assignedLabel: null,
      isOverdue: false,
      isDueThisWeek: true,
      isUpcoming: false,
    },
    {
      id: "task-clean-fridge",
      householdId: previewHousehold.id,
      title: "Clean fridge shelves",
      description: "Wipe drawers and clear out leftovers during reset.",
      assignedTo: previewUser.id,
      dueDate: addDays(today, 2),
      recurrenceType: "month",
      recurrenceInterval: 1,
      status: "open",
      priority: "medium",
      completedAt: null,
      completedBy: null,
      assignedLabel: "You",
      isOverdue: false,
      isDueThisWeek: true,
      isUpcoming: false,
    },
    {
      id: "task-filter",
      householdId: previewHousehold.id,
      title: "Replace HVAC filter",
      description: "Good one to pair with the next hardware run.",
      assignedTo: "preview-member-jordan",
      dueDate: addDays(weekEnd, 3),
      recurrenceType: "month",
      recurrenceInterval: 3,
      status: "open",
      priority: "low",
      completedAt: null,
      completedBy: null,
      assignedLabel: "Jordan",
      isOverdue: false,
      isDueThisWeek: false,
      isUpcoming: true,
    },
    {
      id: "task-bathrooms",
      householdId: previewHousehold.id,
      title: "Bathroom refresh",
      description: "Quick wipe-down and towel swap.",
      assignedTo: null,
      dueDate: subtractDays(today, 2),
      recurrenceType: "week",
      recurrenceInterval: 1,
      status: "done",
      priority: "low",
      completedAt: subtractDays(today, 1),
      completedBy: previewUser.id,
      assignedLabel: null,
      isOverdue: false,
      isDueThisWeek: false,
      isUpcoming: false,
    },
  ];
}

function mapAttention(primary: string, secondary: string, id: string): DashboardAttentionItem {
  return { id, primary, secondary };
}

export function getPreviewUser() {
  return previewUser;
}

export function getPreviewMembership() {
  return {
    id: previewMembership.id,
    household_id: previewMembership.householdId,
    role: previewMembership.role,
    status: previewMembership.status,
  } as const;
}

export function createPreviewAppContext(): AppContextSnapshot {
  return {
    user: previewUser,
    household: previewHousehold,
    membership: previewMembership,
    subscription: {
      planTier: getPreviewPlanTier(),
      status: "trialing",
    },
    memberCount: 2,
    isPreview: true,
  };
}

export function getPreviewShoppingBoardData(): ShoppingBoardData {
  const subscription = {
    planTier: getPreviewPlanTier(),
    status: "trialing",
  } as const;

  return {
    householdName: previewHousehold.name,
    list: previewShoppingList,
    items: getPreviewShoppingItems(),
    barcodeScanning: getBarcodeFeatureEntitlement(subscription),
  };
}

export function getPreviewPantryBoardData(timeZone: string): PantryBoardData {
  const items = getPreviewPantryItems(timeZone);
  const subscription = {
    planTier: getPreviewPlanTier(),
    status: "trialing",
  } as const;

  return {
    householdId: previewHousehold.id,
    householdName: previewHousehold.name,
    items,
    barcodeScanning: getBarcodeFeatureEntitlement(subscription),
    summary: {
      totalItems: items.length,
      lowStockCount: items.filter((item) => item.isLowStock).length,
      expiringSoonCount: items.filter((item) => item.isExpiringSoon).length,
      expiredCount: items.filter((item) => item.isExpired).length,
    },
  };
}

export function getPreviewRecurringBoardData(timeZone: string): RecurringBoardData {
  const items = getPreviewRecurringItems(timeZone);

  return {
    householdId: previewHousehold.id,
    householdName: previewHousehold.name,
    items,
    summary: {
      totalItems: items.length,
      dueThisWeekCount: items.filter((item) => item.isDueThisWeek).length,
      dueSoonCount: items.filter((item) => item.isDueSoon).length,
      activeCount: items.filter((item) => item.active).length,
    },
  };
}

export function getPreviewTaskBoardData(timeZone: string): TaskBoardData {
  const items = getPreviewTasks(timeZone);

  return {
    householdId: previewHousehold.id,
    householdName: previewHousehold.name,
    currentUserId: previewUser.id,
    items,
    members: previewMembers,
    summary: {
      overdueCount: items.filter((item) => item.isOverdue).length,
      dueThisWeekCount: items.filter((item) => item.isDueThisWeek).length,
      upcomingCount: items.filter((item) => item.isUpcoming).length,
      completedCount: items.filter((item) => item.status === "done").length,
    },
  };
}

export function getPreviewWeeklyResetData(timeZone: string, weekStartsOn: number): WeeklyResetData {
  const today = getTodayInTimeZone(timeZone);
  const weekEnd = addDays(today, 6);
  const pantry = getPreviewPantryBoardData(timeZone);
  const recurring = getPreviewRecurringBoardData(timeZone);
  const tasks = getPreviewTaskBoardData(timeZone);

  const lowStockItems = pantry.items.filter((item) => item.isLowStock);
  const expiringSoonItems = pantry.items.filter((item) => item.isExpiringSoon || item.isExpired);
  const recurringDueItems = recurring.items
    .filter((item) => item.active && (item.isDueThisWeek || item.isOverdue))
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      defaultQuantity: item.defaultQuantity,
      unit: item.unit,
      preferredStore: item.preferredStore,
      nextDueDate: item.nextDueDate,
      frequencyLabel: `Every ${item.frequencyInterval} ${item.frequencyInterval === 1 ? item.frequencyType : `${item.frequencyType}s`}`,
      autoAddToShoppingList: item.autoAddToShoppingList,
    }));
  const overdueTasks = tasks.items
    .filter((item) => item.isOverdue)
    .map((item) => ({
      id: item.id,
      title: item.title,
      assignedLabel: item.assignedLabel,
      dueDate: item.dueDate,
      priority: item.priority,
    }));
  const dueThisWeekTasks = tasks.items
    .filter((item) => item.isDueThisWeek)
    .map((item) => ({
      id: item.id,
      title: item.title,
      assignedLabel: item.assignedLabel,
      dueDate: item.dueDate,
      priority: item.priority,
    }));
  const weekStartDate = getWeekStartDate(today, weekStartsOn);

  return {
    householdId: previewHousehold.id,
    householdName: previewHousehold.name,
    weekStartDate,
    weekRangeLabel: `${formatShortDate(today)} - ${formatShortDate(weekEnd)}`,
    aiSummary:
      "Restock paper towels, eggs, milk, and dish soap early this week, then clear the recycling and stay ahead of laundry and school forms before midweek.",
    aiSummaryGeneratedAt: new Date().toISOString(),
    summary: {
      lowStockCount: lowStockItems.length,
      expiringSoonCount: expiringSoonItems.length,
      recurringDueCount: recurringDueItems.length,
      overdueTasksCount: overdueTasks.length,
      dueThisWeekTasksCount: dueThisWeekTasks.length,
      totalNeedsAttention:
        lowStockItems.length +
        expiringSoonItems.length +
        recurringDueItems.length +
        overdueTasks.length +
        dueThisWeekTasks.length,
    },
    lowStockItems,
    expiringSoonItems,
    recurringDueItems,
    overdueTasks,
    dueThisWeekTasks,
  };
}

export function getPreviewDashboardSummary(timeZone: string): DashboardSummary {
  const shopping = getPreviewShoppingBoardData();
  const pantry = getPreviewPantryBoardData(timeZone);
  const recurring = getPreviewRecurringBoardData(timeZone);
  const tasks = getPreviewTaskBoardData(timeZone);
  const weeklyReset = getPreviewWeeklyResetData(timeZone, previewHousehold.weekStartsOn);
  const shoppingNeeded = shopping.items.filter((item) => item.status === "needed");
  const lowStockItems = pantry.items.filter((item) => item.isLowStock);
  const expiringSoonItems = pantry.items.filter((item) => item.isExpiringSoon || item.isExpired);
  const overdueTasks = tasks.items.filter((item) => item.isOverdue);
  const dueRecurringItems = recurring.items.filter(
    (item) => item.active && (item.isDueThisWeek || item.isDueSoon || item.isOverdue),
  );

  return {
    cards: [
      {
        title: "Items on shopping list",
        value: shoppingNeeded.length,
        href: "/app/shopping",
        detail: `${shopping.items.filter((item) => item.priority && item.status === "needed").length} priority items across 1 shared list`,
        emptyDetail: "Start a list for groceries, restocks, or the weekly run.",
      },
      {
        title: "Inventory items",
        value: pantry.items.length,
        href: "/app/pantry",
        detail: `${lowStockItems.length} low-stock items need attention`,
        emptyDetail: "Add a few staples to make the Weekly Reset more useful.",
      },
      {
        title: "Tasks due this week",
        value: tasks.items.filter((item) => item.isDueThisWeek).length,
        href: "/app/tasks",
        detail: `${overdueTasks.length} overdue tasks also need a look`,
        emptyDetail: "Add a few shared chores to keep the week visible for everyone.",
      },
      {
        title: "Recurring due soon",
        value: dueRecurringItems.length,
        href: "/app/recurring",
        detail: `${recurring.items.filter((item) => item.active).length} active recurring items in rotation`,
        emptyDetail: "Set up recurring essentials like paper towels, vitamins, or pet food.",
      },
    ],
    hasAnyData: true,
    householdName: previewHousehold.name,
    totalItemsTracked:
      shopping.items.length + pantry.items.length + tasks.items.length + recurring.items.length,
    latestWeeklyReset: {
      weekStart: weeklyReset.weekStartDate,
      status: "draft",
    },
    overdueTasks: overdueTasks.slice(0, 4).map((item) =>
      mapAttention(
        item.title,
        `${item.priority} priority • due ${formatShortDate(item.dueDate)}${item.assignedLabel ? ` • ${item.assignedLabel}` : ""}`,
        item.id,
      ),
    ),
    lowStockItems: lowStockItems.slice(0, 4).map((item) =>
      mapAttention(
        item.name,
        `${item.storageLocation} • ${item.quantity}${item.unit ? ` ${item.unit}` : ""} on hand${item.lowStockThreshold !== null ? ` • refill at ${item.lowStockThreshold}${item.unit ? ` ${item.unit}` : ""}` : ""}`,
        item.id,
      ),
    ),
    expiringSoonItems: expiringSoonItems.slice(0, 4).map((item) =>
      mapAttention(
        item.name,
        `${item.isExpired ? "Expired" : "Use by"} ${formatShortDate(item.expirationDate)} • ${item.storageLocation}`,
        item.id,
      ),
    ),
    dueRecurringItems: dueRecurringItems.slice(0, 4).map((item) =>
      mapAttention(
        item.name,
        `Due ${formatShortDate(item.nextDueDate)} • Every ${item.frequencyInterval} ${item.frequencyInterval === 1 ? item.frequencyType : `${item.frequencyType}s`}${item.preferredStore ? ` • ${item.preferredStore}` : ""}`,
        item.id,
      ),
    ),
  };
}

export function getPreviewPantryItemsByIds(itemIds: string[], timeZone: string) {
  return getPreviewPantryBoardData(timeZone).items.filter((item) => itemIds.includes(item.id));
}
