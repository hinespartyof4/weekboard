begin;

alter table public.shopping_items
add column barcode text;

alter table public.inventory_items
add column barcode text;

create index shopping_items_household_barcode_idx
  on public.shopping_items (household_id, barcode)
  where barcode is not null;

create index inventory_items_household_barcode_idx
  on public.inventory_items (household_id, barcode)
  where barcode is not null;

commit;
