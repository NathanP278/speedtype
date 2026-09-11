-- ==============================================================================
-- SPEEDTYPE: Supabase PostgreSQL Schema
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Create public.profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar text not null default '⚡',
  provider text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Trigger to automatically create profile on signup (both Email and Google OAuth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  candidate_username text;
  candidate_avatar text;
  auth_provider text;
begin
  candidate_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  -- Sanitize username: replace spaces or non-alphanumeric with underscore
  candidate_username := regexp_replace(candidate_username, '[^a-zA-Z0-9_]', '_', 'g');
  if length(candidate_username) < 3 then
    candidate_username := 'pilot_' || substr(new.id::text, 1, 6);
  end if;

  candidate_avatar := coalesce(new.raw_user_meta_data->>'avatar', '⚡');
  auth_provider := coalesce(new.app_metadata->>'provider', 'email');

  insert into public.profiles (id, username, avatar, provider, created_at, updated_at)
  values (new.id, candidate_username, candidate_avatar, auth_provider, now(), now())
  on conflict (id) do update
  set updated_at = now();

  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Create public.leaderboard table
create table if not exists public.leaderboard (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  username text not null,
  avatar text not null default '⚡',
  provider text not null default 'email',
  net_wpm integer not null check (net_wpm >= 1 and net_wpm <= 350),
  accuracy numeric(5,2) not null check (accuracy >= 0 and accuracy <= 100),
  difficulty text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS on leaderboard
alter table public.leaderboard enable row level security;

-- Leaderboard RLS policies
create policy "Leaderboard entries are viewable by everyone"
  on public.leaderboard for select
  using (true);

create policy "Authenticated users can submit leaderboard scores"
  on public.leaderboard for insert
  with check (auth.uid() = user_id);

-- Performance Indexes
create index if not exists idx_leaderboard_wpm on public.leaderboard (net_wpm desc, created_at desc);
create index if not exists idx_leaderboard_difficulty_wpm on public.leaderboard (difficulty, net_wpm desc);
create index if not exists idx_leaderboard_user on public.leaderboard (user_id);
