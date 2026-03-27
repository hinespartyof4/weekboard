"use client";

import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import { frequencyTypeOptions, type FrequencyType } from "@/lib/recurring/types";

export type RecurringFormValues = {
  name: string;
  category: string;
  defaultQuantity: string;
  unit: string;
  frequencyType: FrequencyType;
  frequencyInterval: string;
  nextDueDate: string;
  preferredStore: string;
  autoAddToShoppingList: boolean;
  active: boolean;
};

type RecurringItemFormProps = {
  values: RecurringFormValues;
  setValues: Dispatch<SetStateAction<RecurringFormValues>>;
  className?: string;
};

const frequencyTypeLabels: Record<FrequencyType, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

export function RecurringItemForm({
  values,
  setValues,
  className,
}: RecurringItemFormProps) {
  return (
    <div className={className}>
      <Input
        value={values.name}
        onChange={(event) =>
          setValues((current) => ({ ...current, name: event.target.value }))
        }
        placeholder="Item name"
        required
      />
      <Input
        value={values.category}
        onChange={(event) =>
          setValues((current) => ({ ...current, category: event.target.value }))
        }
        placeholder="Category"
      />
      <Input
        value={values.defaultQuantity}
        onChange={(event) =>
          setValues((current) => ({ ...current, defaultQuantity: event.target.value }))
        }
        placeholder="Default quantity"
        inputMode="decimal"
      />
      <Input
        value={values.unit}
        onChange={(event) =>
          setValues((current) => ({ ...current, unit: event.target.value }))
        }
        placeholder="Unit"
      />
      <div className="grid grid-cols-[1fr_1fr] gap-3">
        <select
          value={values.frequencyType}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              frequencyType: event.target.value as FrequencyType,
            }))
          }
          className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none"
        >
          {frequencyTypeOptions.map((option) => (
            <option key={option} value={option}>
              {frequencyTypeLabels[option]}
            </option>
          ))}
        </select>
        <Input
          value={values.frequencyInterval}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              frequencyInterval: event.target.value,
            }))
          }
          placeholder="Every"
          inputMode="numeric"
        />
      </div>
      <Input
        type="date"
        value={values.nextDueDate}
        onChange={(event) =>
          setValues((current) => ({ ...current, nextDueDate: event.target.value }))
        }
      />
      <Input
        value={values.preferredStore}
        onChange={(event) =>
          setValues((current) => ({ ...current, preferredStore: event.target.value }))
        }
        placeholder="Preferred store"
      />
      <label className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={values.autoAddToShoppingList}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              autoAddToShoppingList: event.target.checked,
            }))
          }
          className="size-4 rounded border-border"
        />
        Auto-add to shopping list later
      </label>
      <label className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={values.active}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              active: event.target.checked,
            }))
          }
          className="size-4 rounded border-border"
        />
        Active
      </label>
    </div>
  );
}
