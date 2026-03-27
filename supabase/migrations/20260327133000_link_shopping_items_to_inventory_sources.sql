begin;

alter table public.shopping_items
add column if not exists source_inventory_item_id uuid references public.inventory_items(id) on delete set null;

create index if not exists shopping_items_source_inventory_item_idx
  on public.shopping_items (source_inventory_item_id);

commit;
