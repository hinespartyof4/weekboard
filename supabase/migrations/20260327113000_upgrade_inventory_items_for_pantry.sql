begin;

alter table public.inventory_items
add column if not exists category text;

alter table public.inventory_items
rename column expires_on to expiration_date;

create index if not exists inventory_items_household_category_location_idx
  on public.inventory_items (household_id, category, storage_location)
  where is_archived = false;

create index if not exists inventory_items_household_expiration_idx
  on public.inventory_items (household_id, expiration_date)
  where is_archived = false;

commit;
