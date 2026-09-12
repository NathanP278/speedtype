-- ==============================================================================
-- SPEEDTYPE: Quick Fix / Emergency Script for "Database error saving new user"
-- Run this in Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- Option 1: Drop failing trigger completely (App handles profile creation dynamically in State B)
drop trigger if exists on_auth_user_created on auth.users;

-- Ensure public.profiles has all needed columns
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar text not null default '⚡',
  display_name text,
  call_sign text default 'PILOT',
  telemetry jsonb default '{}'::jsonb,
  onboarding_complete boolean default false,
  provider text not null default 'google',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists call_sign text default 'PILOT';
alter table public.profiles add column if not exists telemetry jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists onboarding_complete boolean default false;
alter table public.profiles add column if not exists provider text not null default 'google';

-- Re-enable RLS
alter table public.profiles enable row level security;

-- Ensure clean RLS policies
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
