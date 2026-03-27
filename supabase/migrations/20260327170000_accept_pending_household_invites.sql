begin;

create or replace function public.accept_pending_household_invitation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text := lower(nullif(btrim(coalesce(auth.jwt() ->> 'email', '')), ''));
  v_invitation public.household_invitations%rowtype;
begin
  if v_user_id is null or v_user_email is null then
    return null;
  end if;

  update public.household_invitations
  set status = 'expired'
  where status = 'pending'
    and expires_at is not null
    and expires_at <= timezone('utc', now())
    and lower(invitee_email) = v_user_email;

  select *
  into v_invitation
  from public.household_invitations
  where status = 'pending'
    and lower(invitee_email) = v_user_email
  order by created_at asc
  limit 1
  for update skip locked;

  if not found then
    return null;
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

revoke all on function public.accept_pending_household_invitation() from public;
grant execute on function public.accept_pending_household_invitation() to authenticated;

commit;
