---
phase: 7
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/profile/useProfile.ts
  - src/profile/profile.ts
  - src/components/ProfileSetupModal.tsx
  - src/App.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "App is fully gated behind profile creation — nothing is accessible until a username is set"
    - "Profile is stored in localStorage under 'speedtype_profile'"
    - "Profile contains: username (3-20 chars, alphanumeric + underscores), selected avatar (emoji from list), createdAt timestamp"
    - "Profile setup modal is a full-screen overlay, cannot be dismissed without completing setup"
    - "Once profile exists, user goes directly into the app on subsequent visits"
  artifacts:
    - "src/profile/profile.ts — PlayerProfile interface + CRUD helpers"
    - "src/profile/useProfile.ts — React hook"
    - "src/components/ProfileSetupModal.tsx — full-screen setup UI"
    - "src/App.tsx — conditional render gated on profile"
---

# Plan 7.1: Mandatory Player Profile Gate

<objective>
Require every user to create a profile (username + avatar) before accessing the game. This profile is the identity anchor for leaderboards, 1v1 challenges, and dossier attribution.

Purpose: Without identity, leaderboards and 1v1 are meaningless. Profile creation takes <30 seconds but makes all social features viable.

Output: localStorage-backed profile system with a blocking setup UI.
</objective>

<context>
Load for context:
- src/App.tsx
- src/social/rivalryDossier.ts (DossierData pattern reference)
</context>

<tasks>

<task type="auto">
  <name>Create profile types, storage helpers, and useProfile hook</name>
  <files>src/profile/profile.ts, src/profile/useProfile.ts</files>
  <action>
    Create `src/profile/profile.ts`:

    ```ts
    export interface PlayerProfile {
      username: string;       // 3-20 chars, /^[a-zA-Z0-9_]+$/
      avatar: string;         // one of AVATAR_OPTIONS
      createdAt: number;      // Date.now()
    }

    export const AVATAR_OPTIONS = ['⚡', '🔥', '💀', '🤖', '👾', '🎯', '🌀', '⚔️', '🛸', '🦾'];

    const PROFILE_KEY = 'speedtype_profile';

    export function loadProfile(): PlayerProfile | null { ... }
    export function saveProfile(p: PlayerProfile): void { ... }
    export function clearProfile(): void { ... }

    export function validateUsername(name: string): string | null {
      // Returns error string or null if valid
      if (name.length < 3) return 'Too short (min 3 chars)';
      if (name.length > 20) return 'Too long (max 20 chars)';
      if (!/^[a-zA-Z0-9_]+$/.test(name)) return 'Letters, numbers, underscores only';
      return null;
    }
    ```

    Create `src/profile/useProfile.ts`:

    ```ts
    export function useProfile() {
      const [profile, setProfile] = useState<PlayerProfile | null>(() => loadProfile());

      const createProfile = useCallback((username: string, avatar: string) => {
        const p: PlayerProfile = { username: username.trim(), avatar, createdAt: Date.now() };
        saveProfile(p);
        setProfile(p);
      }, []);

      return { profile, createProfile };
    }
    ```

    AVOID: Validating against a blocklist or making network calls — pure client-side.
  </action>
  <verify>`npx tsc --noEmit` exits 0</verify>
  <done>
    - profile.ts exports all helpers
    - useProfile.ts compiles cleanly
  </done>
</task>

<task type="auto">
  <name>Build ProfileSetupModal full-screen blocking UI</name>
  <files>src/components/ProfileSetupModal.tsx</files>
  <action>
    Full-screen overlay (z-index 9999, `fixed inset-0 bg-black`). Cannot be dismissed.

    Layout — centered card, max-w-md:
    1. Header: "⚡ SPEEDTYPE" brand + "CREATE YOUR FIGHTER PROFILE" subtitle
    2. Username input: monospaced, dark, with live validation (error shown beneath as red text)
    3. Avatar selector: grid of AVATAR_OPTIONS as clickable buttons. Selected one has theme-colored border + glow.
    4. Submit button: "[ENTER THE ARENA]" — disabled + muted until username is valid and avatar selected.
    5. Username hint: "This is your public handle — visible on leaderboards and challenges."

    Props:
    ```ts
    interface Props {
      onComplete: (username: string, avatar: string) => void;
    }
    ```

    On submit: call `onComplete(username, selectedAvatar)`.

    Accessibility: auto-focus username input, Enter key submits when valid, focus-visible ring on all interactive elements.

    AVOID: Any close/dismiss button — this is mandatory.
    AVOID: Pre-filling username from any source.
  </action>
  <verify>
    Renders full-screen. Username validation shows inline errors. Submit disabled until valid input. Tab navigation works.
    `npx tsc --noEmit` exits 0.
  </verify>
  <done>
    - Full-screen blocking UI renders
    - Validation works (min 3 chars, alphanumeric+underscore)
    - Avatar selection works
    - Enter key submits
  </done>
</task>

<task type="auto">
  <name>Gate App.tsx render behind profile existence</name>
  <files>src/App.tsx</files>
  <action>
    Import `useProfile` and `ProfileSetupModal`.

    At top of App component:
    ```ts
    const { profile, createProfile } = useProfile();
    ```

    Wrap the entire return JSX:
    ```tsx
    if (!profile) {
      return <ProfileSetupModal onComplete={(username, avatar) => createProfile(username, avatar)} />;
    }
    // ... rest of App JSX
    ```

    Also: pass `profile.username` and `profile.avatar` into `TerminalViewport` as a `playerProfile` prop so the header can display the player's identity. Update `TerminalViewport` props interface to accept `playerProfile?: { username: string; avatar: string }` and render it in the header (e.g., alongside KP balance).

    AVOID: Rewriting App.tsx logic — only add the profile gate and pass profile data through.
  </action>
  <verify>
    1. Clear localStorage. Refresh app. ProfileSetupModal appears full-screen.
    2. Create profile. App loads normally.
    3. Refresh — app loads directly (no setup again).
    4. `npx tsc --noEmit` exits 0.
  </verify>
  <done>
    - App blocked until profile exists
    - Profile persists across refreshes
    - Username shown in header
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] Clearing localStorage → ProfileSetupModal gate appears
- [ ] After setup → full app accessible
- [ ] Username visible in header UI
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` succeeds
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `git add -A && git commit -m "feat(profile): mandatory player profile gate with username + avatar setup"`
- [ ] Git push: `git push`
</success_criteria>
