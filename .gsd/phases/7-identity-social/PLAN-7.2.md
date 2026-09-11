---
phase: 7
plan: 2
wave: 2
depends_on: [7.1]
files_modified:
  - src/profile/leaderboard.ts
  - src/components/LeaderboardModal.tsx
  - src/App.tsx
  - src/components/MenuModal.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Leaderboard persists in localStorage under 'speedtype_leaderboard'"
    - "An entry is added after every completed duel (not calibration) — contains username, avatar, netWpm, accuracy, difficulty, timestamp"
    - "Leaderboard is capped at 100 entries, sorted by netWpm descending"
    - "LeaderboardModal shows top 20 entries with player's own rank highlighted"
    - "Accessible from Menu modal"
  artifacts:
    - "src/profile/leaderboard.ts — LeaderboardEntry type + CRUD helpers"
    - "src/components/LeaderboardModal.tsx — UI with rank table"
    - "src/App.tsx — submits entry on duel completion"
    - "src/components/MenuModal.tsx — leaderboard button added"
---

# Plan 7.2: Local Leaderboard

<objective>
Track every completed duel result in a localStorage leaderboard. Display top 20 entries in a styled modal, with the current player's best run highlighted.

Purpose: Gives single-player sessions a competitive frame — "beat your own record" and "how do you stack up against past sessions?"

Output: leaderboard.ts CRUD, LeaderboardModal UI, wired into App duel completion.
</objective>

<context>
Load for context:
- src/profile/profile.ts (PlayerProfile)
- src/App.tsx (handleDuelResultRecorded callback)
- src/components/MenuModal.tsx
- src/components/ModernResultModal.tsx (DuelResultData shape)
</context>

<tasks>

<task type="auto">
  <name>Create leaderboard storage helpers</name>
  <files>src/profile/leaderboard.ts</files>
  <action>
    ```ts
    export interface LeaderboardEntry {
      id: string;              // crypto.randomUUID() or Date.now().toString()
      username: string;
      avatar: string;
      netWpm: number;
      accuracy: number;
      difficulty: string;      // RivalDifficultyLevel
      timestamp: number;
    }

    const LB_KEY = 'speedtype_leaderboard';
    const MAX_ENTRIES = 100;

    export function loadLeaderboard(): LeaderboardEntry[] { ... }
    
    export function submitLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id'>): LeaderboardEntry[] {
      // Load, push with generated ID, sort by netWpm desc, slice to MAX_ENTRIES, save, return
    }

    export function getPlayerBestEntry(username: string): LeaderboardEntry | null {
      // Find highest netWpm entry for this username
    }
    ```

    AVOID: Network calls. AVOID: Trusting client-submitted WPM without sanity checks.
    Add sanity check: reject entries with netWpm > 250 or accuracy < 0 or > 100.
  </action>
  <verify>`npx tsc --noEmit` exits 0</verify>
  <done>
    - LeaderboardEntry type exported
    - submitLeaderboardEntry sorts + caps at 100
    - Sanity checks reject impossible values
  </done>
</task>

<task type="auto">
  <name>Build LeaderboardModal UI + wire into App and Menu</name>
  <files>src/components/LeaderboardModal.tsx, src/App.tsx, src/components/MenuModal.tsx</files>
  <action>
    **LeaderboardModal.tsx**:
    Props: `{ isOpen: boolean; onClose: () => void; username: string; }`
    
    Layout inside modal:
    1. Title: "⚡ TOP TYPISTS // LOCAL LEADERBOARD"
    2. Subtitle: "Tracking all sessions on this device"
    3. Table with columns: Rank | Avatar | Username | Net WPM | Accuracy | Difficulty | Date
       - Show top 20 entries (slice from 100-cap sorted array)
       - Highlight rows where `entry.username === props.username` with theme-colored left border
       - If current user not in top 20, show a separator "..." then their best entry at bottom
    4. Empty state: "No runs recorded yet. Complete a duel to get on the board."
    5. Close button.

    **App.tsx** — in `handleDuelResultRecorded`:
    ```ts
    import { submitLeaderboardEntry } from './profile/leaderboard.ts';
    // After economy.awardKp:
    submitLeaderboardEntry({
      username: profile!.username,
      avatar: profile!.avatar,
      netWpm: playerWpm,
      accuracy: duel.playerStats.accuracy,
      difficulty,
      timestamp: Date.now(),
    });
    ```

    **MenuModal.tsx** — add a "[LEADERBOARD]" button alongside existing options. Calls `onOpenLeaderboard` prop. Add the prop to MenuModal's interface.

    Update App.tsx to manage `leaderboardOpen` state and render `<LeaderboardModal>`.

    AVOID: Re-sorting on every render — sort once in `loadLeaderboard`.
  </action>
  <verify>
    1. Complete a duel — open Menu → Leaderboard — entry appears.
    2. Player's own entries are highlighted.
    3. `npx tsc --noEmit` exits 0.
  </verify>
  <done>
    - Entries appear after duel completion
    - Player rows highlighted
    - Modal accessible from Menu
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] Duel completion writes to leaderboard
- [ ] LeaderboardModal shows ranked table
- [ ] Player's own entries highlighted
- [ ] Impossible WPM values rejected
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` succeeds
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `git add -A && git commit -m "feat(leaderboard): local leaderboard with entry submission and ranked display"`
- [ ] Git push: `git push`
</success_criteria>
