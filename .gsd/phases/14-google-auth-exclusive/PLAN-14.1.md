---
phase: 14
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/components/ProfileSetupModal.tsx
  - src/profile/useProfile.ts
  - src/profile/profile.ts
  - src/services/leaderboardService.ts
  - src/utils/storagePurge.ts
  - src/components/TerminalViewport.tsx
autonomous: true
must_haves:
  truths:
    - "No offline mode or local demo user accounts exist in the application"
    - "Legacy ProfileSetupModal.tsx and useProfile.ts are deleted from the codebase"
    - "Profile utilities contain only validation and avatar constants without local storage persistence"
    - "LeaderboardService uses strict cloud provider types without 'local' fallback mocks"
  artifacts:
    - "src/profile/profile.ts containing only validateUsername and AVATAR_OPTIONS"
    - "src/services/leaderboardService.ts cleaned of 'local' provider and local ID checks"
---

# Plan 14.1: Eradicate Offline / Guest / Local Modes & Dead Code

<objective>
Purge all traces of offline mode, guest mode, and local user mode across the codebase.
1. Remove legacy files `src/components/ProfileSetupModal.tsx` and `src/profile/useProfile.ts` which handled unauthenticated local profile storage.
2. Strip `loadProfile`, `saveProfile`, and `clearProfile` from `src/profile/profile.ts`, keeping only `validateUsername` and `AVATAR_OPTIONS`.
3. Clean `src/services/leaderboardService.ts` to remove `'local'` from the `provider` type union (`'google' | 'email'`), remove `!user.id.startsWith('local-')`, and eliminate local fallback mock data structures.
4. Clean `src/components/TerminalViewport.tsx` to remove `local_fighter` fallback strings.
5. Update `src/utils/storagePurge.ts` to ensure clean purging without referencing dead local user concepts.

Purpose: Enforce single-source of truth: authentication is cloud-exclusive with Google OAuth. No guest or offline paths exist.
Output: Clean codebase with zero legacy offline/guest code.
</objective>

<context>
Load for context:
- src/components/ProfileSetupModal.tsx
- src/profile/useProfile.ts
- src/profile/profile.ts
- src/services/leaderboardService.ts
- src/components/TerminalViewport.tsx
- src/utils/storagePurge.ts
</context>

<tasks>

<task type="auto">
  <name>Delete legacy offline profile modal and hook, simplify profile.ts</name>
  <files>src/components/ProfileSetupModal.tsx, src/profile/useProfile.ts, src/profile/profile.ts</files>
  <action>
    1. Delete `src/components/ProfileSetupModal.tsx` (unused legacy local setup modal with 'Profile saved locally · no account required').
    2. Delete `src/profile/useProfile.ts` (unused legacy local storage profile hook).
    3. In `src/profile/profile.ts`:
       - Remove `PROFILE_KEY`, `loadProfile`, `saveProfile`, `clearProfile`.
       - Keep and export only `AVATAR_OPTIONS` and `validateUsername`.
       - AVOID keeping any `localStorage` getters or setters for profile state in `profile.ts`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Legacy files deleted; profile.ts contains only AVATAR_OPTIONS and validateUsername.</done>
</task>

<task type="auto">
  <name>Clean leaderboardService and TerminalViewport of local account artifacts</name>
  <files>src/services/leaderboardService.ts, src/components/TerminalViewport.tsx, src/utils/storagePurge.ts</files>
  <action>
    1. In `src/services/leaderboardService.ts`:
       - Update `provider` field type on `LeaderboardRecord`: change `'google' | 'email' | 'local'` to `'google' | 'email'`.
       - Remove `!user.id.startsWith('local-')` check in `submitScore`.
       - AVOID generating mock local records when Supabase returns an error; return explicit error state instead.
    2. In `src/components/TerminalViewport.tsx`:
       - In the account popover, replace `{currentUser?.email || 'local_fighter'}` with `{currentUser?.email || 'authenticated_pilot'}`.
    3. In `src/utils/storagePurge.ts`:
       - Remove unused references to `speedtype_auth_local_user`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>All references to local user mode and guest fallbacks removed from services and components.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] No files reference ProfileSetupModal or useProfile
- [ ] profile.ts has no localStorage persistence code
- [ ] LeaderboardRecord provider is strictly 'google' | 'email'
- [ ] npx tsc --noEmit passes with 0 errors
</verification>

<success_criteria>
- [ ] All offline and local user code eliminated
- [ ] Typecheck passes cleanly
</success_criteria>
