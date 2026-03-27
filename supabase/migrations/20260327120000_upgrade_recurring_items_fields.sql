begin;

alter table public.recurring_items
rename column cadence_unit to frequency_type;

alter table public.recurring_items
rename column cadence_interval to frequency_interval;

alter table public.recurring_items
rename column next_due_on to next_due_date;

alter table public.recurring_items
rename column is_active to active;

alter table public.recurring_items
rename column automation_enabled to auto_add_to_shopping_list;

alter table public.recurring_items
add column if not exists category text,
add column if not exists default_quantity numeric(10, 2) not null default 1,
add column if not exists unit text,
add column if not exists preferred_store text;

create index if not exists recurring_items_household_active_due_category_idx
  on public.recurring_items (household_id, active, next_due_date, category);

commit;
