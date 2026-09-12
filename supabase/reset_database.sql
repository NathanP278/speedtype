-- ==============================================================================
-- SPEEDTYPE: Reset / Purge Database Script
-- Run this in Supabase SQL Editor to wipe all leaderboard entries, profiles,
-- and reset tables clean with the latest schema.
-- ==============================================================================

-- 1. Wipe all user data
truncate table public.leaderboard cascade;
truncate table public.profiles cascade;

-- (Optional) If you also want to delete all registered auth users:
delete from auth.users;

-- 2. Ensure profiles table has all columns
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists call_sign text default 'PILOT';
alter table public.profiles add column if not exists telemetry jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists onboarding_complete boolean default false;
