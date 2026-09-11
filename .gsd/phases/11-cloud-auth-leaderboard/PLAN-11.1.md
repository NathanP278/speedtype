---
phase: 11
plan: 1
wave: 1
depends_on: []
files_modified:
  - package.json
  - .env.example
  - supabase/schema.sql
  - src/lib/supabase.ts
  - src/auth/authTypes.ts
  - src/auth/useAuth.ts
autonomous: true
user_setup:
  - service: supabase
    why: "Cloud database for cross-device accounts and global leaderboard"
    env_vars:
      - name: VITE_SUPABASE_URL
        source: "Supabase Dashboard -> Project Settings -> API -> Project URL"
      - name: VITE_SUPABASE_ANON_KEY
        source: "Supabase Dashboard -> Project Settings -> API -> Project API keys (anon public)"
    dashboard_config:
      - task: "Run supabase/schema.sql in the Supabase SQL Editor"
        location: "Supabase Dashboard -> SQL Editor"
      - task: "Enable Google Provider under Authentication -> Providers (optional for Google OAuth)"
        location: "Supabase Dashboard -> Authentication -> Providers -> Google"

must_haves:
  truths:
    - "Supabase client initializes safely, falling back to offline/local mode if env vars are missing"
    - "Database schema defines profiles and leaderboard tables with Row Level Security (RLS)"
    - "useAuth hook provides session, user profile, login, signup, Google OAuth trigger, and signOut methods"
    - "TypeScript compilation passes cleanly with strict types"
  artifacts:
    - ".env.example — template for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    - "supabase/schema.sql — SQL DDL with profiles, leaderboard, trigger on auth.users, and RLS"
    - "src/lib/supabase.ts — Supabase client instance with isConfigured flag"
    - "src/auth/authTypes.ts — types for UserAccount, AuthState, and Credentials"
    - "src/auth/useAuth.ts — custom React hook managing authentication lifecycle"
---

# Plan 11.1: Supabase Client, Database Schema & Auth Hook

<objective>
Lay the foundational cloud infrastructure for Speedtype authentication and global persistence using Supabase.
1. Add `@supabase/supabase-js` to package.json.
2. Provide a PostgreSQL schema script (`supabase/schema.sql`) for user profiles, leaderboard records, and RLS policies.
3. Configure the client wrapper in `src/lib/supabase.ts` with graceful fallback for unconfigured/offline environments.
4. Implement `src/auth/useAuth.ts` hook managing email/password authentication, Google OAuth sign-in, session state, and profile synchronization.

Purpose: Replace client-only localStorage mock profiles with genuine, cross-device cloud accounts and Google OAuth sign-in.
Output: Supabase setup script, client singleton, and auth hook.
</objective>

<context>
Load for context:
- package.json
- src/profile/profile.ts (existing PlayerProfile type and localStorage helpers)
- src/utils/rateLimiter.ts
</context>

<tasks>

<task type="auto">
  <name>Install @supabase/supabase-js, provide schema.sql, and create Supabase client</name>
  <files>package.json, .env.example, supabase/schema.sql, src/lib/supabase.ts</files>
  <action>
    1. Install `@supabase/supabase-js` via `npm install @supabase/supabase-js`.
    2. Create `.env.example` documenting `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
    3. Create `supabase/schema.sql`:
       - `profiles` table: `id uuid references auth.users on delete cascade primary key`, `username text unique not null`, `avatar text not null default '⚡'`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`.
       - Trigger on `auth.users` insert to automatically populate `public.profiles` using raw_user_meta_data or default values.
       - `leaderboard` table: `id uuid default gen_random_uuid() primary key`, `user_id uuid references auth.users on delete cascade not null`, `username text not null`, `avatar text not null`, `provider text not null default 'email'`, `net_wpm integer not null`, `accuracy numeric not null`, `difficulty text not null`, `created_at timestamptz default now()`.
       - Indexes on `leaderboard (net_wpm desc)` and `leaderboard (difficulty, net_wpm desc)`.
       - RLS policies:
         - Profiles: public read, update own profile (`auth.uid() = id`).
         - Leaderboard: public read, authenticated insert own records (`auth.uid() = user_id`).
    4. Create `src/lib/supabase.ts`:
       - Read `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.
       - Check `isSupabaseConfigured = Boolean(url && anonKey)`.
       - Create and export `supabase` client if configured, or a dummy/null client with clear warnings.

    AVOID: Crashing if env vars are missing — provide safe fallback so local development without Supabase continues to run.
  </action>
  <verify>`npm list @supabase/supabase-js` exits 0; `npx tsc --noEmit` exits 0.</verify>
  <done>
    - @supabase/supabase-js installed
    - .env.example created
    - supabase/schema.sql created with RLS and triggers
    - src/lib/supabase.ts exports client and isSupabaseConfigured
  </done>
</task>

<task type="auto">
  <name>Implement auth types and useAuth React hook</name>
  <files>src/auth/authTypes.ts, src/auth/useAuth.ts</files>
  <action>
    1. Create `src/auth/authTypes.ts`:
       - `UserAccount` interface: `{ id: string; email: string; username: string; avatar: string; provider: 'email' | 'google'; createdAt: number; }`
       - `AuthState` interface: `{ user: UserAccount | null; isLoading: boolean; error: string | null; isCloudEnabled: boolean; }`
       - Credential interfaces for `SignUpData` (username, email, password, avatar) and `SignInData` (email, password).
    2. Create `src/auth/useAuth.ts`:
       - Listen to `supabase.auth.onAuthStateChange` to keep session in sync.
       - Handle `signUpWithEmail(data: SignUpData)`: calls `supabase.auth.signUp`, passing username & avatar in `options.data`, then syncs profile.
       - Handle `signInWithEmail(data: SignInData)`: calls `supabase.auth.signInWithPassword`, loads user profile from `profiles` table.
       - Handle `signInWithGoogle()`: calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
       - Handle `signOut()`: calls `supabase.auth.signOut()`.
       - Fallback mode: if `!isSupabaseConfigured`, support local demo accounts saved in `localStorage` so developer/user can still test without credentials.

    AVOID: Leaking plaintext passwords into localStorage or error traces.
    AVOID: Unhandled promise rejections on network failure.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - authTypes.ts defines all necessary account and auth interfaces
    - useAuth hook handles email auth, Google OAuth, session listener, and signout
    - Offline/demo fallback preserved if Supabase credentials are not provided
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] @supabase/supabase-js installed and resolvable
- [ ] supabase/schema.sql contains valid PostgreSQL DDL with RLS
- [ ] useAuth hook compiles cleanly with TypeScript strict mode
- [ ] `npx tsc --noEmit` exits 0
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `feat(auth): supabase client setup, sql schema, and useAuth hook`
</success_criteria>
