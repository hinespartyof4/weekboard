begin;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  );
$$;

create or replace function public.is_household_admin(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role = 'owner'
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.is_household_admin(uuid) from public;
revoke all on function public.is_household_owner(uuid) from public;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_admin(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;
alter table public.inventory_items enable row level security;
alter table public.recurring_items enable row level security;
alter table public.household_tasks enable row level security;
alter table public.weekly_resets enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_requests enable row level security;

create policy "households_select_member"
on public.households
for select
to authenticated
using (public.is_household_member(id));

create policy "households_insert_authenticated"
on public.households
for insert
to authenticated
with check (auth.uid() is not null);

create policy "households_update_admin"
on public.households
for update
to authenticated
using (public.is_household_admin(id))
with check (public.is_household_admin(id));

create policy "households_delete_owner"
on public.households
for delete
to authenticated
using (public.is_household_owner(id));

create policy "household_members_select_member"
on public.household_members
for select
to authenticated
using (public.is_household_member(household_id));

create policy "household_members_insert_admin_or_first_owner"
on public.household_members
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    public.is_household_admin(household_id)
    or (
      user_id = auth.uid()
      and role = 'owner'
      and status = 'active'
      and not exists (
        select 1
        from public.household_members existing
        where existing.household_id = household_members.household_id
      )
    )
  )
);

create policy "household_members_update_admin"
on public.household_members
for update
to authenticated
using (public.is_household_admin(household_id))
with check (public.is_household_admin(household_id));

create policy "household_members_delete_owner"
on public.household_members
for delete
to authenticated
using (public.is_household_owner(household_id));

create policy "shopping_lists_select_member"
on public.shopping_lists
for select
to authenticated
using (public.is_household_member(household_id));

create policy "shopping_lists_insert_member"
on public.shopping_lists
for insert
to authenticated
with check (public.is_household_member(household_id));

create policy "shopping_lists_update_member"
on public.shopping_lists
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "shopping_lists_delete_member"
on public.shopping_lists
for delete
to authenticated
using (public.is_household_member(household_id));

create policy "shopping_items_select_member"
on public.shopping_items
for select
to authenticated
using (public.is_household_member(household_id));

create policy "shopping_items_insert_member"
on public.shopping_items
for insert
to authenticated
with check (public.is_household_member(household_id));

create policy "shopping_items_update_member"
on public.shopping_items
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "shopping_items_delete_member"
on public.shopping_items
for delete
to authenticated
using (public.is_household_member(household_id));

create policy "inventory_items_select_member"
on public.inventory_items
for select
to authenticated
using (public.is_household_member(household_id));

create policy "inventory_items_insert_member"
on public.inventory_items
for insert
to authenticated
with check (public.is_household_member(household_id));

create policy "inventory_items_update_member"
on public.inventory_items
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "inventory_items_delete_member"
on public.inventory_items
for delete
to authenticated
using (public.is_household_member(household_id));

create policy "recurring_items_select_member"
on public.recurring_items
for select
to authenticated
using (public.is_household_member(household_id));

create policy "recurring_items_insert_member"
on public.recurring_items
for insert
to authenticated
with check (public.is_household_member(household_id));

create policy "recurring_items_update_member"
on public.recurring_items
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "recurring_items_delete_member"
on public.recurring_items
for delete
to authenticated
using (public.is_household_member(household_id));

create policy "household_tasks_select_member"
on public.household_tasks
for select
to authenticated
using (public.is_household_member(household_id));

create policy "household_tasks_insert_member"
on public.household_tasks
for insert
to authenticated
with check (public.is_household_member(household_id));

create policy "household_tasks_update_member"
on public.household_tasks
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "household_tasks_delete_member"
on public.household_tasks
for delete
to authenticated
using (public.is_household_member(household_id));

create policy "weekly_resets_select_member"
on public.weekly_resets
for select
to authenticated
using (public.is_household_member(household_id));

create policy "weekly_resets_insert_member"
on public.weekly_resets
for insert
to authenticated
with check (public.is_household_member(household_id));

create policy "weekly_resets_update_member"
on public.weekly_resets
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "weekly_resets_delete_member"
on public.weekly_resets
for delete
to authenticated
using (public.is_household_member(household_id));

create policy "subscriptions_select_member"
on public.subscriptions
for select
to authenticated
using (public.is_household_member(household_id));

create policy "subscriptions_insert_admin"
on public.subscriptions
for insert
to authenticated
with check (public.is_household_admin(household_id));

create policy "subscriptions_update_admin"
on public.subscriptions
for update
to authenticated
using (public.is_household_admin(household_id))
with check (public.is_household_admin(household_id));

create policy "subscriptions_delete_owner"
on public.subscriptions
for delete
to authenticated
using (public.is_household_owner(household_id));

create policy "ai_requests_select_member"
on public.ai_requests
for select
to authenticated
using (public.is_household_member(household_id));

create policy "ai_requests_insert_member"
on public.ai_requests
for insert
to authenticated
with check (
  public.is_household_member(household_id)
  and user_id = auth.uid()
);

create policy "ai_requests_update_member"
on public.ai_requests
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "ai_requests_delete_member"
on public.ai_requests
for delete
to authenticated
using (public.is_household_member(household_id));

commit;

