begin;

create extension if not exists pgcrypto with schema extensions;

create type public.household_member_role as enum ('owner', 'admin', 'member');
create type public.household_member_status as enum ('active', 'paused', 'removed');
create type public.shopping_item_status as enum ('needed', 'purchased', 'archived');
create type public.inventory_status as enum ('in_stock', 'low', 'out_of_stock');
create type public.storage_location as enum (
  'pantry',
  'fridge',
  'freezer',
  'cleaning',
  'bathroom',
  'laundry',
  'other'
);
create type public.recurring_frequency_unit as enum ('day', 'week', 'month');
create type public.task_status as enum ('open', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.weekly_reset_status as enum ('draft', 'ready', 'sent', 'archived');
create type public.plan_tier as enum ('free', 'plus', 'home_pro');
create type public.subscription_status as enum (
  'free',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'unpaid'
);
create type public.billing_interval as enum ('month', 'year');
create type public.ai_request_feature as enum (
  'weekly_reset',
  'use_what_we_have',
  'inventory_suggestion',
  'general'
);
create type public.ai_request_status as enum ('pending', 'completed', 'failed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'UTC',
  week_starts_on smallint not null default 0,
  reset_day smallint not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint households_name_not_blank check (char_length(btrim(name)) > 0),
  constraint households_week_starts_on_valid check (week_starts_on between 0 and 6),
  constraint households_reset_day_valid check (reset_day between 0 and 6)
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.household_member_role not null default 'member',
  status public.household_member_status not null default 'active',
  display_name text,
  joined_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint household_members_household_user_key unique (household_id, user_id)
);

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  description text,
  color_token text,
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint shopping_lists_name_not_blank check (char_length(btrim(name)) > 0),
  constraint shopping_lists_id_household_unique unique (id, household_id)
);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  shopping_list_id uuid not null,
  name text not null,
  quantity text,
  note text,
  category text,
  status public.shopping_item_status not null default 'needed',
  is_priority boolean not null default false,
  sort_order integer not null default 0,
  added_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint shopping_items_name_not_blank check (char_length(btrim(name)) > 0),
  constraint shopping_items_completion_pair check (
    (completed_at is null and completed_by is null)
    or (completed_at is not null and completed_by is not null)
  ),
  constraint shopping_items_list_fk
    foreign key (shopping_list_id, household_id)
    references public.shopping_lists(id, household_id)
    on delete cascade
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  quantity numeric(10, 2) not null default 1,
  unit text,
  storage_location public.storage_location not null default 'pantry',
  status public.inventory_status not null default 'in_stock',
  low_stock_threshold numeric(10, 2),
  expires_on date,
  notes text,
  is_archived boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint inventory_items_name_not_blank check (char_length(btrim(name)) > 0),
  constraint inventory_items_quantity_nonnegative check (quantity >= 0),
  constraint inventory_items_low_stock_threshold_nonnegative check (
    low_stock_threshold is null or low_stock_threshold >= 0
  )
);

create table public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  description text,
  cadence_unit public.recurring_frequency_unit not null default 'week',
  cadence_interval integer not null default 1,
  next_due_on date not null,
  last_completed_on date,
  is_active boolean not null default true,
  automation_enabled boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recurring_items_name_not_blank check (char_length(btrim(name)) > 0),
  constraint recurring_items_interval_positive check (cadence_interval > 0)
);

create table public.household_tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'open',
  priority public.task_priority not null default 'medium',
  assigned_to uuid references auth.users(id) on delete set null,
  due_on date,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint household_tasks_title_not_blank check (char_length(btrim(title)) > 0),
  constraint household_tasks_completion_pair check (
    (completed_at is null and completed_by is null)
    or (completed_at is not null and completed_by is not null)
  )
);

create table public.weekly_resets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  week_start date not null,
  status public.weekly_reset_status not null default 'draft',
  summary text,
  ai_summary text,
  generated_at timestamptz,
  generated_by uuid references auth.users(id) on delete set null,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint weekly_resets_household_week_key unique (household_id, week_start)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  plan_tier public.plan_tier not null default 'free',
  status public.subscription_status not null default 'free',
  billing_interval public.billing_interval not null default 'month',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint subscriptions_household_key unique (household_id),
  constraint subscriptions_stripe_customer_key unique (stripe_customer_id),
  constraint subscriptions_stripe_subscription_key unique (stripe_subscription_id),
  constraint subscriptions_period_order check (
    current_period_end is null
    or current_period_start is null
    or current_period_end >= current_period_start
  )
);

create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  feature public.ai_request_feature not null,
  status public.ai_request_status not null default 'pending',
  model text,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  request_excerpt text,
  response_excerpt text,
  error_message text,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ai_requests_prompt_tokens_nonnegative check (prompt_tokens >= 0),
  constraint ai_requests_completion_tokens_nonnegative check (completion_tokens >= 0)
);

create index households_archived_idx
  on public.households (is_archived)
  where is_archived = false;

create index household_members_user_id_idx
  on public.household_members (user_id);

create index household_members_household_status_idx
  on public.household_members (household_id, status);

create index shopping_lists_household_archived_idx
  on public.shopping_lists (household_id, is_archived, sort_order);

create index shopping_items_household_status_idx
  on public.shopping_items (household_id, status, sort_order);

create index shopping_items_list_status_idx
  on public.shopping_items (shopping_list_id, status, sort_order);

create index inventory_items_household_status_idx
  on public.inventory_items (household_id, status, is_archived);

create index inventory_items_household_location_idx
  on public.inventory_items (household_id, storage_location);

create index recurring_items_household_due_idx
  on public.recurring_items (household_id, is_active, next_due_on);

create index household_tasks_household_status_idx
  on public.household_tasks (household_id, status, due_on);

create index household_tasks_household_assigned_idx
  on public.household_tasks (household_id, assigned_to);

create index weekly_resets_household_week_idx
  on public.weekly_resets (household_id, week_start desc);

create index subscriptions_plan_status_idx
  on public.subscriptions (plan_tier, status);

create index ai_requests_household_created_idx
  on public.ai_requests (household_id, created_at desc);

create index ai_requests_household_feature_idx
  on public.ai_requests (household_id, feature, status);

create trigger set_households_updated_at
before update on public.households
for each row
execute function public.set_updated_at();

create trigger set_household_members_updated_at
before update on public.household_members
for each row
execute function public.set_updated_at();

create trigger set_shopping_lists_updated_at
before update on public.shopping_lists
for each row
execute function public.set_updated_at();

create trigger set_shopping_items_updated_at
before update on public.shopping_items
for each row
execute function public.set_updated_at();

create trigger set_inventory_items_updated_at
before update on public.inventory_items
for each row
execute function public.set_updated_at();

create trigger set_recurring_items_updated_at
before update on public.recurring_items
for each row
execute function public.set_updated_at();

create trigger set_household_tasks_updated_at
before update on public.household_tasks
for each row
execute function public.set_updated_at();

create trigger set_weekly_resets_updated_at
before update on public.weekly_resets
for each row
execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

create trigger set_ai_requests_updated_at
before update on public.ai_requests
for each row
execute function public.set_updated_at();

commit;

