import {
  CalendarRange,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  PackageOpen,
  Repeat,
  Settings,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

export const siteConfig = {
  name: "Weekboard",
  tagline: "The weekly control center for your home",
  description:
    "One clean place to know what the house needs this week.",
};

export const marketingNavigation = [
  { title: "Overview", href: "/#overview" },
  { title: "Weekly Reset", href: "/#weekly-reset" },
  { title: "Pricing", href: "/#pricing" },
  { title: "FAQ", href: "/#faq" },
];

export const appNavigation = [
  {
    title: "Dashboard",
    href: "/app",
    icon: LayoutDashboard,
    description: "Weekly overview, highlights, and what's next.",
  },
  {
    title: "Shopping",
    href: "/app/shopping",
    icon: ShoppingCart,
    description: "Shared grocery lists and household restocks.",
  },
  {
    title: "Pantry",
    href: "/app/pantry",
    icon: PackageOpen,
    description: "Inventory tracking for pantry, fridge, and freezer.",
  },
  {
    title: "Tasks",
    href: "/app/tasks",
    icon: ClipboardList,
    description: "Chores, to-dos, and weekly accountability.",
  },
  {
    title: "Recurring",
    href: "/app/recurring",
    icon: Repeat,
    description: "Automate regular needs before they become urgent.",
  },
  {
    title: "Weekly Reset",
    href: "/app/weekly-reset",
    icon: CalendarRange,
    description: "The calm, guided weekly reset for your home.",
  },
  {
    title: "Settings",
    href: "/app/settings",
    icon: Settings,
    description: "Household members, preferences, and account controls.",
  },
  {
    title: "Billing",
    href: "/app/billing",
    icon: CreditCard,
    description: "Plans, limits, invoices, and upgrade controls.",
  },
];

export const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    frequency: "forever",
    description: "A shared starter space for staying on top of the essentials.",
    cta: "Start free",
    featured: false,
    features: [
      "1 household",
      "Up to 2 members",
      "Limited inventory items",
      "Limited recurring items",
      "Limited tasks",
      "Limited AI usage",
    ],
  },
  {
    name: "Plus",
    price: "$12",
    frequency: "per month",
    description: "Unlimited day-to-day coordination for a busy home.",
    cta: "Choose Plus",
    featured: true,
    features: [
      "Unlimited inventory",
      "Unlimited recurring items",
      "Unlimited tasks",
      "Weekly reset digest",
      "Basic AI suggestions",
      "Priority support queue",
    ],
  },
  {
    name: "Home Pro",
    price: "$24",
    frequency: "per month",
    description: "The upgraded operating system for multi-list, high-traffic homes.",
    cta: "Choose Home Pro",
    featured: false,
    features: [
      "All Plus features",
      "Multiple shopping lists",
      "Enhanced recurring automation",
      "More AI usage",
      "Future advanced analytics support",
      "Early access to household insights",
    ],
  },
];

export const dashboardHighlights = [
  {
    label: "Open tasks",
    value: "12",
    detail: "4 due today",
  },
  {
    label: "Shopping items",
    value: "18",
    detail: "7 added this week",
  },
  {
    label: "Low-stock items",
    value: "6",
    detail: "Pantry + fridge",
  },
  {
    label: "Recurring due soon",
    value: "5",
    detail: "Within 3 days",
  },
];

export const featureCallouts = [
  {
    title: "Weekly Reset",
    description:
      "A calm summary that shows what the house needs before the week gets away from you.",
    icon: Sparkles,
  },
  {
    title: "Fast shared entry",
    description:
      "Quick-add flows for groceries, chores, and restocks without clutter or extra taps.",
    icon: ShoppingCart,
  },
  {
    title: "Household visibility",
    description:
      "One shared view across shopping, pantry, recurring needs, and responsibilities.",
    icon: LayoutDashboard,
  },
];
