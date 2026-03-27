begin;

create type public.household_invitation_status as enum (
  'pending',
  'accepted',
  'revoked',
  'expired'
);

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  invitee_email text not null,
  role public.household_member_role not null default 'member',
  status public.household_invitation_status not null default 'pending',
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint household_invitations_email_not_blank
    check (char_length(btrim(invitee_email)) > 0)
);

create index household_invitations_household_status_idx
  on public.household_invitations (household_id, status, created_at desc);

create unique index household_invitations_pending_unique_idx
  on public.household_invitations (household_id, lower(invitee_email))
  where status = 'pending';

create trigger set_household_invitations_updated_at
before update on public.household_invitations
for each row
execute function public.set_updated_at();

create or replace function public.create_household_with_owner_and_invite(
  p_household_name text,
  p_timezone text default 'UTC',
  p_invite_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_household_name text := btrim(coalesce(p_household_name, ''));
  v_timezone text := nullif(btrim(coalesce(p_timezone, '')), '');
  v_invite_email text := nullif(lower(btrim(coalesce(p_invite_email, ''))), '');
  v_user_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if v_household_name = '' then
    raise exception 'Household name is required.';
  end if;

  if v_timezone is null then
    v_timezone := 'UTC';
  end if;

  if exists (
    select 1
    from public.household_members hm
    where hm.user_id = v_user_id
      and hm.status = 'active'
  ) then
    raise exception 'An active household membership already exists.';
  end if;

  insert into public.households (name, timezone)
  values (v_household_name, v_timezone)
  returning id into v_household_id;

  insert into public.household_members (
    household_id,
    user_id,
    role,
    status
  )
  values (
    v_household_id,
    v_user_id,
    'owner',
    'active'
  );

  insert into public.subscriptions (household_id)
  values (v_household_id)
  on conflict (household_id) do nothing;

  if v_invite_email is not null then
    if v_invite_email = v_user_email then
      raise exception 'Invite email must be different from your own email.';
    end if;

    insert into public.household_invitations (
      household_id,
      invitee_email,
      role,
      status,
      invited_by,
      expires_at
    )
    values (
      v_household_id,
      v_invite_email,
      'member',
      'pending',
      v_user_id,
      timezone('utc', now()) + interval '14 days'
    );
  end if;

  return v_household_id;
end;
$$;

revoke all on function public.create_household_with_owner_and_invite(text, text, text)
from public;
grant execute on function public.create_household_with_owner_and_invite(text, text, text)
to authenticated;

alter table public.household_invitations enable row level security;

create policy "household_invitations_select_admin"
on public.household_invitations
for select
to authenticated
using (public.is_household_admin(household_id));

create policy "household_invitations_insert_admin"
on public.household_invitations
for insert
to authenticated
with check (public.is_household_admin(household_id));

create policy "household_invitations_update_admin"
on public.household_invitations
for update
to authenticated
using (public.is_household_admin(household_id))
with check (public.is_household_admin(household_id));

create policy "household_invitations_delete_owner"
on public.household_invitations
for delete
to authenticated
using (public.is_household_owner(household_id));

commit;

