begin;

alter table public.shopping_items
add column if not exists product_brand text,
add column if not exists product_image_url text;

alter table public.inventory_items
add column if not exists product_brand text,
add column if not exists product_image_url text;

commit;
