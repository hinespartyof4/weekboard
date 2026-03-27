begin;

alter table public.household_tasks
rename column due_on to due_date;

alter table public.household_tasks
add column if not exists recurrence_type public.recurring_frequency_unit,
add column if not exists recurrence_interval integer,
add column if not exists series_id uuid;

alter table public.household_tasks
add constraint household_tasks_recurrence_interval_positive check (
  recurrence_interval is null or recurrence_interval > 0
);

alter table public.household_tasks
add constraint household_tasks_recurrence_pair check (
  (recurrence_type is null and recurrence_interval is null)
  or (recurrence_type is not null and recurrence_interval is not null)
);

drop index if exists household_tasks_household_status_idx;

create index if not exists household_tasks_household_status_due_date_idx
  on public.household_tasks (household_id, status, due_date);

create index if not exists household_tasks_series_id_idx
  on public.household_tasks (series_id);

commit;
