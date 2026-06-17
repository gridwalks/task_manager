-- ============================================================
-- taskboard schema
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Tasks table
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  short_id      text,                          -- e.g. YPR-001, auto-generated below
  title         text not null,
  status        text not null default 'todo',  -- matches column ids in config
  tag           text,
  assignee_id   text,
  priority      text check (priority in ('high', 'med', 'low', '')),
  due_date      date,
  notes         text default '',
  position      integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-generate short_id like YPR-001 per user
create sequence if not exists task_short_id_seq;

create or replace function generate_short_id()
returns trigger language plpgsql as $$
begin
  new.short_id := 'TSK-' || lpad(nextval('task_short_id_seq')::text, 3, '0');
  return new;
end;
$$;

create trigger set_short_id
  before insert on public.tasks
  for each row when (new.short_id is null)
  execute function generate_short_id();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function update_updated_at();

-- Board config (tags, assignees, columns, board name) — one row per user
create table if not exists public.board_config (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  config     jsonb not null default '{}',
  updated_at timestamptz default now()
);

create trigger board_config_updated_at
  before update on public.board_config
  for each row execute function update_updated_at();

-- ============================================================
-- Row Level Security — users can only see/edit their own data
-- ============================================================

alter table public.tasks enable row level security;
alter table public.board_config enable row level security;

-- Tasks policies
create policy "Users read own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Config policies
create policy "Users read own config"
  on public.board_config for select
  using (auth.uid() = user_id);

create policy "Users upsert own config"
  on public.board_config for insert
  with check (auth.uid() = user_id);

create policy "Users update own config"
  on public.board_config for update
  using (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists tasks_user_status on public.tasks(user_id, status);
create index if not exists tasks_user_position on public.tasks(user_id, position);


-- ============================================================
-- Journal entries (added in v2)
-- ============================================================

create table if not exists public.journal_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  entry_date      date not null default current_date,
  title           text,
  body            text default '',
  entry_type      text default 'reflection'
                  check (entry_type in ('reflection','decision','meeting','idea','win')),
  mood            smallint check (mood between 1 and 5),
  tags            text[] default '{}',
  linked_task_id  uuid references public.tasks(id) on delete set null,
  is_private      boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create trigger journal_updated_at
  before update on public.journal_entries
  for each row execute function update_updated_at();

-- RLS
alter table public.journal_entries enable row level security;

create policy "Users read own journal entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "Users insert own journal entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users update own journal entries"
  on public.journal_entries for update
  using (auth.uid() = user_id);

create policy "Users delete own journal entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- Indexes
create index if not exists journal_user_date
  on public.journal_entries(user_id, entry_date desc);

create index if not exists journal_user_type
  on public.journal_entries(user_id, entry_type);

-- Full-text search index
create index if not exists journal_fts
  on public.journal_entries
  using gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')));

-- ============================================================
-- User profiles & admin access control (added in v3)
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  role         text not null default 'user' check (role in ('user', 'admin')),
  status       text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at   timestamptz default now(),
  approved_at  timestamptz,
  approved_by  uuid references auth.users(id)
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Security-definer helper — bypasses RLS so policies can call it without recursion
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where id = uid and role = 'admin'
  );
$$;

-- RLS
alter table public.user_profiles enable row level security;

create policy "Users read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Admins read all profiles"
  on public.user_profiles for select
  using (public.is_admin(auth.uid()));

create policy "Admins update profiles"
  on public.user_profiles for update
  using (public.is_admin(auth.uid()));

-- Users can update their own display name
create policy "Users update own profile"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create index if not exists user_profiles_status on public.user_profiles(status);
create index if not exists user_profiles_role   on public.user_profiles(role);

-- ⚠️  Bootstrap: after running this SQL, promote yourself to admin:
--   update public.user_profiles
--   set role = 'admin', status = 'active'
--   where email = 'your@email.com';

-- ============================================================
-- Expenses (added in v4)
-- ============================================================

create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null default current_date,
  vendor      text not null,
  amount      numeric(10,2) not null check (amount >= 0),
  currency    text not null default 'USD',
  category    text,
  description text,
  notes       text default '',
  status      text not null default 'draft'
              check (status in ('draft','submitted','approved','rejected')),
  receipt_url text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function update_updated_at();

alter table public.expenses enable row level security;

create policy "Users read own expenses"
  on public.expenses for select using (auth.uid() = user_id);

create policy "Users insert own expenses"
  on public.expenses for insert with check (auth.uid() = user_id);

create policy "Users update own expenses"
  on public.expenses for update using (auth.uid() = user_id);

create policy "Users delete own expenses"
  on public.expenses for delete using (auth.uid() = user_id);

create index if not exists expenses_user_date     on public.expenses(user_id, date desc);
create index if not exists expenses_user_status   on public.expenses(user_id, status);
create index if not exists expenses_user_category on public.expenses(user_id, category);
