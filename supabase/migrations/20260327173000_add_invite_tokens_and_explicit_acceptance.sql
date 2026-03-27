begin;

alter table public.household_invitations
add column invite_token uuid not null default gen_random_uuid();

create unique index household_invitations_invite_token_key
  on public.household_invitations (invite_token);

create or replace function public.get_household_invitation_details(
  p_invite_token uuid
)
returns table (
  invitation_id uuid,
  household_id uuid,
  household_name text,
  invitee_email text,
  role public.household_member_role,
  status public.household_invitation_status,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    hi.id as invitation_id,
    hi.household_id,
    h.name as household_name,
    hi.invitee_email,
    hi.role,
    hi.status,
    hi.expires_at
  from public.household_invitations hi
  join public.households h on h.id = hi.household_id
  where hi.invite_token = p_invite_token
  limit 1;
$$;

revoke all on function public.get_household_invitation_details(uuid) from public;
grant execute on function public.get_household_invitation_details(uuid) to anon, authenticated;

create or replace function public.accept_household_invitation(
  p_invite_token uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text := lower(nullif(btrim(coalesce(auth.jwt() ->> 'email', '')), ''));
  v_invitation public.household_invitations%rowtype;
  v_existing_household_id uuid;
begin
  if v_user_id is null or v_user_email is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into v_invitation
  from public.household_invitations
  where invite_token = p_invite_token
  limit 1
  for update;

  if not found then
    raise exception 'Invitation link is invalid.';
  end if;

  if lower(v_invitation.invitee_email) <> v_user_email then
    raise exception 'This invitation is for a different email address.';
  end if;

  if v_invitation.status = 'accepted' then
    return v_invitation.household_id;
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'This invitation is no longer available.';
  end if;

  if v_invitation.expires_at is not null and v_invitation.expires_at <= timezone('utc', now()) then
    update public.household_invitations
    set
      status = 'expired',
      updated_at = timezone('utc', now())
    where id = v_invitation.id;

    raise exception 'This invitation has expired.';
  end if;

  select household_id
  into v_existing_household_id
  from public.household_members
  where user_id = v_user_id
    and status = 'active'
  order by created_at asc
  limit 1;

  if v_existing_household_id is not null and v_existing_household_id <> v_invitation.household_id then
    raise exception 'This account is already active in another household. Weekboard currently supports one active household in the app experience.';
  end if;

  insert into public.household_members (
    household_id,
    user_id,
    role,
    status
  )
  values (
    v_invitation.household_id,
    v_user_id,
    v_invitation.role,
    'active'
  )
  on conflict (household_id, user_id) do update
  set
    role = excluded.role,
    status = 'active',
    updated_at = timezone('utc', now());

  update public.household_invitations
  set
    status = 'accepted',
    accepted_by = v_user_id,
    updated_at = timezone('utc', now())
  where id = v_invitation.id;

  return v_invitation.household_id;
end;
$$;

revoke all on function public.accept_household_invitation(uuid) from public;
grant execute on function public.accept_household_invitation(uuid) to authenticated;

commit;
