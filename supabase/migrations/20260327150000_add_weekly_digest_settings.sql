begin;

alter table public.households
  add column if not exists weekly_digest_enabled boolean not null default true,
  add column if not exists weekly_digest_recipient_email text;

alter table public.households
  drop constraint if exists households_weekly_digest_recipient_not_blank;

alter table public.households
  add constraint households_weekly_digest_recipient_not_blank
  check (
    weekly_digest_recipient_email is null
    or char_length(btrim(weekly_digest_recipient_email)) > 0
  );

create index if not exists households_weekly_digest_enabled_idx
  on public.households (weekly_digest_enabled, is_archived)
  where weekly_digest_enabled = true and is_archived = false;

commit;
