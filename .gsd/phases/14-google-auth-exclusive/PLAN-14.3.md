---
phase: 14
plan: 3
wave: 3
depends_on:
  - 14.1
  - 14.2
files_modified:
  - src/components/AuthModal.tsx
  - src/auth/useAuth.ts
  - src/App.tsx
autonomous: true
must_haves:
  truths:
    - "Unauthenticated users see only the landing screen with the Google sign-in button"
    - "Users cannot access the pilot handle or avatar selection until their Google account is verified"
    - "New Google users are prompted to choose their pilot username (3-20 chars) and avatar emoji"
    - "Profile setup saves to public.profiles with onboarding_complete = true"
    - "Returning authenticated users with completed onboarding bypass setup and enter arena directly"
  artifacts:
    - "src/components/AuthModal.tsx with strict two-stage gate (Google Sign-In -> Onboarding)"
    - "src/App.tsx enforcing gate condition: !auth.user || !auth.user.onboardingComplete"
---

# Plan 14.3: Post-Authentication Pilot Handle & Avatar Setup Gate

<objective>
Enforce the strict user lifecycle requirement:
1. Google Sign-In is required to enter.
2. Only after a user has authenticated their Google account do we present the Pilot Handle & Avatar customization screen.
3. Once the user picks their handle and avatar, record their profile in Supabase with `onboarding_complete = true` and grant immediate entry into the arena.
4. Returning authenticated users who already completed onboarding bypass the setup step entirely.

Purpose: Prevent unauthenticated users or local guests from creating accounts while giving every authenticated Google user full control over their in-game handle and avatar.
Output: Secure, two-stage authentication and profile setup workflow.
</objective>

<context>
Load for context:
- src/components/AuthModal.tsx
- src/auth/useAuth.ts
- src/App.tsx
</context>

<tasks>

<task type="auto">
  <name>Refine AuthModal to strictly gate onboarding behind verified Google session</name>
  <files>src/components/AuthModal.tsx</files>
  <action>
    1. In `src/components/AuthModal.tsx`:
       - State A (Unauthenticated: `!currentUser`):
         Render the homepage landing with high-contrast cyber typography, zero-latency tagline, and a single prominent `[CONTINUE WITH GOOGLE]` button.
         Show verified protocol chips: `TLS 1.3`, `OAuth 2.0 PKCE`, `Google Verified Account`.
         AVOID any guest login buttons, skip links, or alternative credentials.
       - State B (Authenticated Google session, pending onboarding: `currentUser && !currentUser.onboardingComplete`):
         Show "CHOOSE YOUR PILOT HANDLE".
         Display authenticated Google user details (e.g. `Authenticated: {currentUser.email}`).
         Username input field (3-20 characters, real-time regex check `/^[a-zA-Z0-9_]+$/`, XSS sanitization, character counter).
         Avatar selector grid displaying `AVATAR_OPTIONS` with selected highlight state.
         Action button: `[ENTER ARENA ->]`.
       - Display any server errors (e.g., username collision) in an alert badge.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>AuthModal strictly presents Google OAuth first, and username/avatar selection only after authentication.</done>
</task>

<task type="auto">
  <name>Harden useAuth and App gate for seamless onboarding transition</name>
  <files>src/auth/useAuth.ts, src/App.tsx</files>
  <action>
    1. In `src/auth/useAuth.ts`:
       - Ensure `fetchAndSetProfile` sets `onboardingComplete: Boolean(data?.onboarding_complete)` when loading from Supabase.
       - If no profile row exists yet (or `!data.onboarding_complete`), set `onboardingComplete: false` so State B triggers.
       - In `updateProfile`, upsert into `public.profiles` with `onboarding_complete: true`, `username`, `avatar`, and `updated_at`.
       - Update local `user` state immediately with `onboardingComplete: true` to unlock the app without reload.
    2. In `src/App.tsx`:
       - Verify gate condition: `if (!auth.user || !auth.user.onboardingComplete) return <AuthModal ... />`.
  </action>
  <verify>npm run build</verify>
  <done>Smooth transition from Google sign-in to handle selection to arena entry.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Unauthenticated state renders Google OAuth button only
- [ ] Authenticated state renders Handle and Avatar selection
- [ ] Submitting profile updates Supabase and enters the arena immediately
- [ ] npm run build compiles cleanly with zero warnings or errors
</verification>

<success_criteria>
- [ ] Google authentication is strictly required
- [ ] Pilot handle and avatar selection occurs only after authentication
- [ ] Complete profile persists to Supabase and unlocks arena
</success_criteria>
