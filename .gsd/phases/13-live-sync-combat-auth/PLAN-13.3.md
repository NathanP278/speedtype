---
phase: 13
plan: 3
wave: 2
depends_on:
  - "13.1"
  - "13.2"
files_modified:
  - src/App.tsx
  - src/components/ChallengeModal.tsx
  - src/components/LeaderboardModal.tsx
  - src/components/ModernResultModal.tsx
  - src/services/leaderboardService.ts
autonomous: true
must_haves:
  truths:
    - "1v1 Friend Challenge modal immediately recognizes a freshly finished duel run without requiring a webpage refresh"
    - "Leaderboard updates live upon match score submission without requiring manual page reload or modal restart"
    - "Match result modal provides direct 1-click actions to generate a 1v1 challenge code or open the leaderboard"
    - "All player ghost recordings and personal bests synchronize across components reactively"
  artifacts:
    - "src/App.tsx with live state updates on duel completion"
    - "src/components/ChallengeModal.tsx with immediate run detection on open"
    - "src/components/LeaderboardModal.tsx with event-driven and Supabase Realtime live sync"
    - "src/components/ModernResultModal.tsx with connected challenge and leaderboard buttons"
---

# Plan 13.3: Live Realtime Synchronization Without Webpage Refresh

<objective>
Eliminate every requirement for manual webpage refreshes across the entire SpeedType platform.
1. Fix 1v1 Challenge generation: when a player completes a duel, update `lastPlayerGhost` in `App.tsx` immediately so opening the 1v1 Friend Challenge modal displays the fresh run without refreshing the page.
2. In `ChallengeModal.tsx`, automatically re-check `getLastRun()` when the modal opens or when tab switches to ensure the latest run is always loaded.
3. In `LeaderboardModal.tsx` and `leaderboardService.ts`, introduce live score synchronization via Supabase Realtime channel subscription (and local custom event dispatching `speedtype:score-submitted`) so scores submitted in any tab or by any user appear live without clicking refresh.
4. In `ModernResultModal.tsx`, wire direct action buttons: "[⚔️ CHALLENGE A FRIEND]" (opens ChallengeModal with the just-completed run pre-loaded) and "[📊 VIEW LEADERBOARD]".

Purpose: Provide an ultra-smooth, native-app feel where all match data, challenges, and leaderboards update live in real-time.
Output: Reactive state management, event-driven leaderboard updates, and connected match result actions.
</objective>

<context>
Load for context:
- src/App.tsx
- src/components/ChallengeModal.tsx
- src/components/LeaderboardModal.tsx
- src/components/ModernResultModal.tsx
- src/services/leaderboardService.ts
</context>

<tasks>

<task type="auto">
  <name>Live ghost and challenge synchronization in App.tsx and ChallengeModal.tsx</name>
  <files>src/App.tsx, src/components/ChallengeModal.tsx</files>
  <action>
    1. In `src/App.tsx`:
       - In `handleDuelResultRecorded`:
         Immediately read and set state:
         `const freshLastRun = getLastRun();`
         `setLastPlayerGhost(freshLastRun);`
         `const freshPb = getPersonalBest();`
         `setPersonalBestGhost(freshPb);`
       - Ensure `lastPlayerGhost` is never stale when passed to `ChallengeModal` and `GhostDuelSelector`.
       - Add callback `onOpenChallengeFromDuel` so player can jump directly from result modal into challenge modal.
    2. In `src/components/ChallengeModal.tsx`:
       - When `isOpen` becomes true, or on tab change, refresh `lastRun` from `getLastRun()` if prop is null.
       - Auto-generate challenge code if the user clicks "Create Challenge" directly after completing a match.

    AVOID: Relying solely on initial `useState(() => getLastRun())` in `App.tsx` which never updates on subsequent match completions.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - Finishing a duel immediately enables challenge code generation in `ChallengeModal` without page refresh.
  </done>
</task>

<task type="auto">
  <name>Live event-driven & realtime cloud leaderboard updates</name>
  <files>src/services/leaderboardService.ts, src/components/LeaderboardModal.tsx</files>
  <action>
    1. In `src/services/leaderboardService.ts`:
       - In `submitScore`:
         Dispatch a window event `window.dispatchEvent(new CustomEvent('speedtype:score-submitted', { detail: localRecord }));` after score submission.
       - Export a helper `subscribeToLeaderboardLive(callback: () => void): () => void` that:
         - Listens to the `speedtype:score-submitted` window event.
         - If `isSupabaseConfigured` and `supabase`, sets up a Supabase Realtime channel on `public.leaderboard` (INSERT events) to trigger the callback.
         - Returns an unsubscribe cleanup function.
    2. In `src/components/LeaderboardModal.tsx`:
       - Use `subscribeToLeaderboardLive` inside `useEffect` while modal is open to auto-refresh rankings without user clicking "↻ REFRESH".
       - Automatically trigger `loadData()` whenever `isOpen` changes from false to true.

    AVOID: Polling in tight intervals; use event-driven window events and Supabase Realtime channels.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - Leaderboard updates live as soon as a duel finishes and score is submitted.
    - Opening leaderboard always displays the most recent scores.
  </done>
</task>

<task type="auto">
  <name>Connect ModernResultModal directly to Challenge & Leaderboard</name>
  <files>src/components/ModernResultModal.tsx, src/App.tsx</files>
  <action>
    1. In `src/components/ModernResultModal.tsx`:
       - Add optional props `onOpenChallenge?: () => void` and `onOpenLeaderboard?: () => void`.
       - Render direct action buttons in the footer of the modal:
         - `[⚔️ CHALLENGE FRIEND]` (copies or generates challenge code from this run).
         - `[📊 HALL OF FIGHTERS]` (opens leaderboard).
    2. In `src/App.tsx`:
       - Pass `onOpenChallenge={() => { duel.resetDuel(); setChallengeOpen(true); }}` and `onOpenLeaderboard={() => setLeaderboardOpen(true)}` to `ModernResultModal`.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - After completing a duel, user can immediately challenge a friend or check rankings with one click.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Finishing a duel updates `lastPlayerGhost` immediately without page refresh.
- [ ] Challenge modal immediately shows "Your Last Run" with accurate WPM and enabled "GENERATE CHALLENGE CODE".
- [ ] Scores update live in the leaderboard without page reload.
- [ ] `npx tsc --noEmit` exits 0.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
