---
phase: 11
plan: 3
wave: 2
depends_on: [11.1]
files_modified:
  - src/services/leaderboardService.ts
  - src/components/LeaderboardModal.tsx
  - src/App.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Leaderboard shows real account-backed entries from Supabase (falling back to local cache if offline)"
    - "Each leaderboard row displays avatar, username, and account badge (Google vs Email verified)"
    - "Players can filter by difficulty (All, Warmup, Even, Challenger, Boss)"
    - "Current logged-in user is prominently highlighted with their global rank"
    - "Match completions automatically record scores tied to authenticated user ID"
    - "Leaderboard modal includes a manual refresh button with loading state"
  artifacts:
    - "src/services/leaderboardService.ts — cloud fetch, filter, and score submission service"
    - "src/components/LeaderboardModal.tsx — overhauled leaderboard table with account indicators and filters"
---

# Plan 11.3: Global Cloud Leaderboard & Account Score Sync

<objective>
Revise the leaderboard to be cloud-backed and tightly coupled to the user account system.
1. Implement `src/services/leaderboardService.ts` providing typed queries for global top-100 scores, per-difficulty filtering, and authenticated score submission.
2. Redesign `src/components/LeaderboardModal.tsx` to display verified account indicators (Google vs Email), difficulty filters, and user rank.
3. Wire match completions in `App.tsx` to submit scores to the cloud leaderboard under the authenticated user's credentials.

Purpose: Fulfill user requirement: "then the leader board should be revised wi that in mind".
Output: Leaderboard service, redesigned LeaderboardModal, and App score sync.
</objective>

<context>
Load for context:
- supabase/schema.sql (leaderboard table schema)
- src/auth/authTypes.ts
- src/auth/useAuth.ts
- src/profile/leaderboard.ts (existing local storage model)
- src/components/LeaderboardModal.tsx
- src/App.tsx
</context>

<tasks>

<task type="auto">
  <name>Build cloud leaderboard service with local fallback</name>
  <files>src/services/leaderboardService.ts</files>
  <action>
    Create `src/services/leaderboardService.ts`:
    1. Define `CloudLeaderboardEntry`:
       ```ts
       export interface CloudLeaderboardEntry {
         id: string;
         userId: string;
         username: string;
         avatar: string;
         provider: 'google' | 'email';
         netWpm: number;
         accuracy: number;
         difficulty: string;
         createdAt: number;
       }
       ```
    2. Implement `fetchLeaderboard(difficultyFilter?: string): Promise<CloudLeaderboardEntry[]>`:
       - If `isSupabaseConfigured`: query `leaderboard` table sorted by `net_wpm desc, created_at desc` limit 100. If `difficultyFilter` specified (and not 'all'), apply `.eq('difficulty', difficultyFilter)`.
       - If offline/unconfigured: query `localStorage` cache.
    3. Implement `submitScore(user: UserAccount, netWpm: number, accuracy: number, difficulty: string): Promise<boolean>`:
       - Rate limit check via `rateLimitCheck('leaderboard_submit')`.
       - Sanity bounds: $1 \le \text{netWpm} \le 300$, $0 \le \text{accuracy} \le 100$.
       - If `isSupabaseConfigured`: insert into `leaderboard` table `{ user_id: user.id, username: user.username, avatar: user.avatar, provider: user.provider, net_wpm: netWpm, accuracy, difficulty }`.
       - Also update local storage cache for instant offline access.

    AVOID: Throwing unhandled exceptions when network fails — return empty list or local cache gracefully.
  </action>
  <verify>`npx tsc --noEmit` exits 0.</verify>
  <done>
    - fetchLeaderboard queries Supabase with difficulty filter and limit
    - submitScore handles validation, rate limiting, and insertion
    - Safe fallback to local storage if offline
  </done>
</task>

<task type="auto">
  <name>Redesign LeaderboardModal with account badges and difficulty filters</name>
  <files>src/components/LeaderboardModal.tsx, src/App.tsx</files>
  <action>
    1. Update `src/components/LeaderboardModal.tsx`:
       - Add difficulty filter tabs at the top: `[ALL]`, `[WARMUP]`, `[EVEN]`, `[CHALLENGER]`, `[BOSS]`.
       - Table columns:
         - `# Rank` (🥇, 🥈, 🥉 for top 3)
         - `Fighter` (Avatar + Username + small `[G]` or `[✉]` account verification badge)
         - `Net WPM` (Hero theme colored)
         - `Accuracy` (Cyan)
         - `Difficulty`
         - `Date`
       - Highlight the logged-in user's entry with theme border and `(you)` tag.
       - If current user is not in top 20, show sticky bottom row with their rank and best score.
       - Header includes a `[REFRESH]` button that triggers re-fetch with a spinning icon.
       - Display cloud indicator: "🌐 Global Live Leaderboard" (or "⚡ Local Offline Mode" if unconfigured).
    2. In `src/App.tsx`:
       - On match completion, call `submitScore` from `leaderboardService` using `currentUser`.
       - Pass `currentUser` to `<LeaderboardModal />`.

    AVOID: Unnecessary re-fetches when modal is closed.
  </action>
  <verify>`npx tsc --noEmit` exits 0; `npm run build` succeeds.</verify>
  <done>
    - LeaderboardModal renders difficulty filters and account badges
    - User scores persist to cloud/local leaderboard
    - TypeScript clean and build passes
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] Leaderboard shows accounts with Google/Email badges
- [ ] Difficulty filter filters scores correctly
- [ ] Current user highlighted in the table
- [ ] Match completion submits score
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` succeeds
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `feat(leaderboard): cloud leaderboard service with account badges and filters`
</success_criteria>
