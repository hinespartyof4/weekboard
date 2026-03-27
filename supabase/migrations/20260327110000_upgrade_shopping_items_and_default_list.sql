begin;

alter table public.shopping_lists
add column if not exists is_default boolean not null default false;

create unique index if not exists shopping_lists_default_per_household_idx
  on public.shopping_lists (household_id)
  where is_default = true;

alter table public.shopping_items
rename column note to notes;

alter table public.shopping_items
rename column is_priority to priority;

alter table public.shopping_items
add column if not exists unit text,
add column if not exists preferred_store text;

create index if not exists shopping_items_household_category_status_idx
  on public.shopping_items (household_id, category, status);

commit;

