---
phase: 13
plan: 2
wave: 1
depends_on: []
files_modified:
  - supabase/schema.sql
  - supabase/reset_database.sql
  - src/auth/useAuth.ts
  - src/auth/authTypes.ts
  - src/components/AuthModal.tsx
  - src/utils/storagePurge.ts
autonomous: true
must_haves:
  truths:
    - "Login/Signup page is a clean, minimalist homepage: bold SPEEDTYPE title in thick font, lightning icon, short punchy description, and a single Google Sign In/Sign Up button"
    - "Eliminated the complex 5-stage telemetry wizard and questionnaires in favor of a fast, simple 1-field username setup after Google auth"
    - "Google OAuth is strictly mandatory — zero local fallback, zero guest accounts, zero mock profiles"
    - "Unauthenticated users cannot bypass AuthModal or access any gameplay mode without authenticating with Google"
    - "All user identities and leaderboard records are strictly authenticated and verified via Supabase Google Auth tokens"
    - "Database reset script cleanly wipes all leaderboard and profile entries, with updated idempotent schema DDL"
    - "Storage purge utility completely removes local cache keys without leaving lingering bypass mock users"
  artifacts:
    - "supabase/schema.sql with IF NOT EXISTS idempotent table creation and strict RLS bound to Google auth.uid()"
    - "supabase/reset_database.sql with complete truncate and reset commands"
    - "src/auth/useAuth.ts with 100% Google-exclusive session verification and zero local fallback"
    - "src/components/AuthModal.tsx redesigned into a minimalist, bold homepage landing screen"
    - "src/utils/storagePurge.ts with full wipe of all local Speedtype data"
---

# Plan 13.2: Database Reset, Schema Verification & Minimalist Google Auth Gate

<objective>
Redesign the login/signup screen into a sleek, minimalist homepage with a thick bold `SPEEDTYPE` title, lightning logo, short punchy description, and a prominent Google Sign In / Sign Up button. Completely remove the bloated 5-stage survey/telemetry wizard in favor of a clean, 1-step username choice upon first login. Strictly enforce Google OAuth with zero local fallbacks or guest escapes.
1. Minimalist Homepage Landing Auth UI:
   - Centered aesthetic: Electric lightning logo `⚡`.
   - Massive, thick bold title: `SPEEDTYPE` in heavy modern typography.
   - Ultra-short punchy description: "Zero-latency cyber combat typing engine."
   - Single prominent action: "CONTINUE WITH GOOGLE" (handles both login and sign up).
   - Once authenticated with Google, if first-time user: a simple 1-field prompt: "CHOOSE YOUR PILOT USERNAME" with avatar picker, then immediate entry into the game.
   - Purged: All 5-stage surveys, telemetry questionnaires, referral drop-downs, and timeline steps.
2. Strictly mandate Google OAuth: remove all `LOCAL_FALLBACK_USER_KEY` mock data, offline demo pilots, and local guest login fallbacks. If a user is not authenticated via Google OAuth, they cannot access any mode of the game.
3. Harden security: all identities and scores are cryptographically bound to Supabase Google auth tokens (`auth.uid()`). No passwords are used or stored; authentication is protected via OAuth 2.0 PKCE.
4. Update `supabase/schema.sql` and `supabase/reset_database.sql` to cleanly reset all users and leaderboard data.

Purpose: Deliver the clean, bold, simple homepage the user requested, backed by strict, zero-friction Google OAuth.
Output: Sleek minimalist auth landing screen, strict Google session management, and database reset scripts.
</objective>

<context>
Load for context:
- supabase/schema.sql
- supabase/reset_database.sql
- src/auth/useAuth.ts
- src/auth/authTypes.ts
- src/components/AuthModal.tsx
- src/utils/storagePurge.ts
</context>

<tasks>

<task type="auto">
  <name>Harden Supabase schema for Google-exclusive auth and provide database reset script</name>
  <files>supabase/schema.sql, supabase/reset_database.sql, src/utils/storagePurge.ts</files>
  <action>
    1. In `supabase/schema.sql`:
       - Verify and ensure idempotent DDL for `public.profiles` and `public.leaderboard`.
       - Enforce `provider text not null default 'google'` in both tables.
       - Enforce strict RLS policies:
         - Profiles: public SELECT, INSERT/UPDATE requires `auth.uid() = id`.
         - Leaderboard: public SELECT, INSERT requires `auth.uid() = user_id`.
       - Update `handle_new_user()` trigger to extract Google profile metadata (email, avatar_url, full_name) safely.
    2. In `supabase/reset_database.sql`:
       - Provide complete wipe statements:
         `truncate table public.leaderboard cascade;`
         `truncate table public.profiles cascade;`
         `delete from auth.users;`
       - Ensure all columns (`display_name`, `call_sign`, `telemetry`, `onboarding_complete`) exist.
    3. In `src/utils/storagePurge.ts`:
       - Purge all speedtype storage keys:
         `speedtype_user_calibration`, `speedtype_economy_balance`, `speedtype_economy_unlocked`,
         `speedtype_economy_equipped`, `speedtype_last_run`, `speedtype_personal_best`,
         `speedtype_rivalry_dossier`, `speedtype_cloud_leaderboard_cache`, `speedtype_auth_local_user`.
       - Ensure zero residual mock/guest user data remains.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - `supabase/schema.sql` and `supabase/reset_database.sql` enforce verified Google auth identities.
    - `storagePurge.ts` completely clears all local storage.
  </done>
</task>

<task type="auto">
  <name>Redesign AuthModal into minimalist homepage landing screen with Google OAuth</name>
  <files>src/auth/authTypes.ts, src/auth/useAuth.ts, src/components/AuthModal.tsx</files>
  <action>
    1. In `src/auth/useAuth.ts`:
       - Strip all `LOCAL_FALLBACK_USER_KEY`, `getLocalFallbackUser`, `setLocalFallbackUser`, and offline demo mock accounts.
       - Session state must be 100% sourced from `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()`.
       - If no active Supabase Google session exists, `user` is strictly `null`.
       - Handle OAuth: `signInWithGoogle` initiates OAuth flow with redirect to current origin.
       - Handle profile sync: if `onboarding_complete` is false, prompt for username; otherwise enter game directly.
    2. In `src/components/AuthModal.tsx`:
       - Redesign into a clean, minimalist homepage:
         - Large glowing logo: `⚡`
         - Extra-bold, heavy heading: `SPEEDTYPE` (e.g. `text-5xl sm:text-6xl font-black tracking-widest text-white`).
         - Short, clean tagline underneath: "Zero-latency cyber combat typing engine."
         - High-impact Google action button:
           - Branded Google logo SVG.
           - Text: "CONTINUE WITH GOOGLE" (Sign In / Sign Up).
           - Loading spinner when connecting.
         - Subtle security note at bottom: "TLS 1.3 Encryption • Google OAuth 2.0 PKCE • Zero Passwords Stored".
       - First-time username prompt (only shown if Google authenticated but username not chosen):
         - Clean card: "WELCOME, PILOT. CHOOSE YOUR HANDLE".
         - 1 text input for username (3-20 chars).
         - Quick avatar selector (5 emojis).
         - Single button: "[ENTER ARENA →]".
       - COMPLETELY REMOVE: All 5-stage timeline progress bars, referral questions, typing proficiency quiz, daily minutes selection, and dossier inspection screens.

    AVOID: Complex multi-stage wizards, questionnaires, or guest/mock login bypasses — keep the landing page bold, beautiful, and dead-simple.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - Auth landing screen is a clean, bold homepage with thick font and short description.
    - Single Google button for login/signup.
    - Zero questionnaire clutter; 1-step username choice on first login.
    - Google OAuth strictly required to access the game.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Landing page renders thick bold SPEEDTYPE title, short description, and Google button.
- [ ] Complex multi-step wizard is replaced with simple 1-field username setup.
- [ ] Google OAuth is strictly enforced with zero local fallback.
- [ ] Storage purge and database reset scripts cleanly wipe all data.
- [ ] `npx tsc --noEmit` exits 0.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
