---
phase: 11
plan: 2
wave: 2
depends_on: [11.1]
files_modified:
  - src/components/AuthModal.tsx
  - src/components/TerminalViewport.tsx
  - src/App.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Application requires user authentication to enter the arena"
    - "User can toggle between Sign In and Create Account tabs"
    - "Create Account requires username, valid email, password, and avatar selection"
    - "Sign in with Google button is rendered prominently with Google G logo"
    - "Header profile pill displays authenticated username, avatar, and Google/Email provider icon"
    - "User can click their profile pill to view account info or Sign Out"
    - "Invalid credentials and registration errors are displayed clearly"
  artifacts:
    - "src/components/AuthModal.tsx — dual-tab modal (Sign In / Register) with Google OAuth button"
    - "src/components/TerminalViewport.tsx — updated header profile pill with account popover / sign out"
    - "src/App.tsx — integrated with useAuth, blocking gate until logged in"
---

# Plan 11.2: Modern Account & Auth Modal (Login, Signup, Google OAuth)

<objective>
Replace the simple `ProfileSetupModal` with a full-fledged authentication modal supporting email/password accounts, registration with username and avatar, and official Google Sign-In button.
Wire the authenticated user state into the application header with user menu (Sign Out, Account Info).

Purpose: Fulfill user requirement: "for the account you can make them use username email password and much better if you get a sign in with google button then add that".
Output: AuthModal component, App gate integration, and header account popover.
</objective>

<context>
Load for context:
- src/auth/authTypes.ts (UserAccount, AuthState, SignInData, SignUpData)
- src/auth/useAuth.ts
- src/components/ProfileSetupModal.tsx (existing avatar picker & styling)
- src/components/TerminalViewport.tsx
- src/App.tsx
</context>

<tasks>

<task type="auto">
  <name>Build AuthModal with Sign In, Sign Up, and Google OAuth buttons</name>
  <files>src/components/AuthModal.tsx</files>
  <action>
    Create `src/components/AuthModal.tsx`:
    1. Tabs:
       - **Sign In Tab**:
         - Email input
         - Password input
         - "[SIGN IN]" button
       - **Create Account Tab**:
         - Username input (3-20 chars, /^[a-zA-Z0-9_]+$/)
         - Email input (validated format)
         - Password input (min 6 characters)
         - Avatar picker grid from `AVATAR_OPTIONS` (⚡, 🔥, 💀, 🤖, etc.)
         - "[CREATE FIGHTER ACCOUNT]" button
    2. Shared OAuth Divider & Google Button:
       - "── OR CONTINUE WITH ──"
       - "[G  Sign in with Google]" branded button calling `onGoogleSignIn()`.
       - Full WCAG AA focus rings and hover glow.
    3. Notice / Offline banner:
       - If cloud connection is in demo mode (no Supabase keys), show a subtle tag: "⚡ Offline Demo Mode Active (Credentials saved locally)".
    4. Input validation and error displays (e.g. "Invalid email or password", "Username already in use").

    AVOID: Unmasked passwords in plain text or console logs.
    AVOID: Blocking UI without clear loading spinner during auth request.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - AuthModal has functional Sign In and Sign Up tabs
    - Username, email, password, and avatar picker correctly validated
    - Sign in with Google button present with clear branding
    - Accessible keyboard navigation and error states
  </done>
</task>

<task type="auto">
  <name>Integrate AuthModal and Account Popover into App.tsx and TerminalViewport</name>
  <files>src/components/TerminalViewport.tsx, src/App.tsx</files>
  <action>
    1. In `src/components/TerminalViewport.tsx`:
       - Accept `currentUser: UserAccount | null` and `onSignOut: () => void`.
       - Update the header center pill to show `[avatar] [username] [Google/Email badge]`.
       - Make the pill clickable to toggle a compact Account Popover displaying:
         - Fighter Name & Email
         - Auth Provider (Google Account vs Email)
         - "[SIGN OUT]" button with confirmation
    2. In `src/App.tsx`:
       - Replace `useProfile` with `useAuth`.
       - If `!user`: render `<AuthModal />` (blocking gate).
       - Pass `currentUser` and `onSignOut` to `<TerminalViewport />`.
       - Update match completions and dossier to tie directly to `user.username` and `user.id`.

    AVOID: Regressing offline play if Supabase keys are not set — fallback gracefully through `useAuth` demo mode.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - App gates on authenticated user from useAuth
    - Header displays real account information with provider indicator
    - User can sign out and switch accounts
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] AuthModal renders cleanly with both tabs and Google OAuth button
- [ ] User can register with username + email + password + avatar
- [ ] User can log in with email + password
- [ ] Sign out resets app state and returns to AuthModal
- [ ] `npx tsc --noEmit` exits 0
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `feat(auth): modern account modal with email/password and Google OAuth`
</success_criteria>
