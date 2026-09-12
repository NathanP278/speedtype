# Phase 14: Google Auth Exclusive & Offline Mode Elimination

## Objective
Eliminate all legacy offline/guest/local user modes across the codebase, ensure Google OAuth is the sole method of account creation/authentication with a proper popup handshake and account selection, and present the Pilot Handle & Avatar customization screen only after Google authentication is confirmed.

## Background & Root Cause
1. **Offline / Guest Mode Legacy**: In earlier phases, offline fallback logic (`ProfileSetupModal.tsx`, `useProfile.ts`, `speedtype_auth_local_user`, "Offline Demo Mode" labels, and `provider: 'local'`) was introduced as mock fallbacks when Supabase was disconnected or for local-only testing. This created confusing states where users were auto-logged in as mock local users.
2. **Google OAuth Full-Page Redirect & Auto-Bypass**: `supabase.auth.signInWithOAuth` defaulted to a full-page browser redirect (`window.location.assign`) rather than an OAuth popup. Without `prompt: 'select_account'`, Google silently re-used cached accounts and bounced back immediately without showing an account chooser.
3. **User Mandate**: No offline mode, no local user mode, no guest mode. Only Google authentication. Once authenticated with Google, if the user does not have a profile, prompt them to choose their pilot handle (username) and avatar before entering the arena.

## Plans

| Plan | Title | Wave | Scope | Status |
|------|-------|------|-------|--------|
| **14.1** | Eradicate Offline / Guest / Local Modes & Dead Code | 1 | Purge `ProfileSetupModal.tsx`, `useProfile.ts`, local storage profile logic, and `provider: 'local'` references | PLANNED |
| **14.2** | Google OAuth Popup Handshake & Account Selection | 2 | Refactor `signInWithGoogle` in `useAuth.ts` to use popup flow with `prompt: 'select_account'` and cross-window sync | PLANNED |
| **14.3** | Post-Authentication Pilot Handle & Avatar Setup Gate | 3 | Harden `AuthModal.tsx` and `App.tsx` so only authenticated Google users configure handle/avatar before entering arena | PLANNED |

## Verification Criteria
- [ ] Zero references to `local` provider or offline demo accounts in source files.
- [ ] Legacy files `src/components/ProfileSetupModal.tsx` and `src/profile/useProfile.ts` removed.
- [ ] Google OAuth opens in a clean popup dialog with `prompt: 'select_account'`.
- [ ] Users must authenticate via Google before they can select a pilot handle and avatar.
- [ ] Profile setup saves to Supabase `profiles` table with `onboarding_complete = true`.
- [ ] Existing users with completed profiles bypass the setup step and enter the arena directly.
- [ ] `npx tsc --noEmit` and `npm run build` pass with 0 errors.
