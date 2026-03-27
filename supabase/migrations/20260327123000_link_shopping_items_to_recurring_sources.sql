begin;

alter table public.shopping_items
add column if not exists source_recurring_item_id uuid references public.recurring_items(id) on delete set null;

create index if not exists shopping_items_source_recurring_item_idx
  on public.shopping_items (source_recurring_item_id);

commit;
