export const analyticsEvents = {
  signupCompleted: "signup_completed",
  householdCreated: "household_created",
  firstShoppingItemAdded: "first_shopping_item_added",
  firstInventoryItemAdded: "first_inventory_item_added",
  firstRecurringItemCreated: "first_recurring_item_created",
  firstTaskCreated: "first_task_created",
  weeklyResetViewed: "weekly_reset_viewed",
  aiHelperUsed: "ai_helper_used",
  checkoutStarted: "checkout_started",
  subscriptionActivated: "subscription_activated",
} as const;

export type AnalyticsEventName =
  (typeof analyticsEvents)[keyof typeof analyticsEvents];
