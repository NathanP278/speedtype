---
phase: 10
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/utils/rateLimiter.ts
  - src/profile/leaderboard.ts
  - src/App.tsx
  - src/profile/profile.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Rate limiter prevents more than N actions per M seconds per action-type key"
    - "KP awards are rate-limited: max 10 duel completions per 60 seconds"
    - "Leaderboard submissions are rate-limited: max 5 per 60 seconds"
    - "Profile creation/update is rate-limited: max 3 attempts per 120 seconds"
    - "Challenge code decoding is rate-limited: max 20 attempts per 60 seconds (anti-brute-force)"
    - "Rate limit state is kept in memory (not localStorage) — resets on page reload (appropriate for client-side)"
    - "Hitting a rate limit shows a user-visible error/warning, does not silently fail"
    - "Username validation rejects XSS payloads (no HTML, no script injection)"
  artifacts:
    - "src/utils/rateLimiter.ts — generic token-bucket rate limiter"
    - "All gated actions use rateLimiter.check(key) before executing"
---

# Plan 10.1: Rate Limiting & Input Security

<objective>
Add frontend rate limiting to prevent abuse of KP farming, leaderboard spam, challenge code brute-force, and profile spam. Also harden input validation against basic XSS.

Why client-side rate limiting matters even without a server:
- Prevents localStorage KP farming via rapid scripted match resets
- Prevents leaderboard spam via repeated duel-completion triggers
- Prevents challenge code brute-force scanning
- Shows the intent to be secure (important for any future backend migration)

Architecture: Token bucket per named action key. Buckets replenish in memory only.
</objective>

<context>
Load for context:
- src/utils/rateLimiter.ts (if it exists — create if not)
- src/App.tsx (handleDuelResultRecorded)
- src/profile/leaderboard.ts (submitLeaderboardEntry)
- src/profile/profile.ts (validateUsername, saveProfile)
- src/social/challengeCode.ts (decodeChallengeCode)
</context>

<tasks>

<task type="auto">
  <name>Build generic token-bucket rate limiter utility</name>
  <files>src/utils/rateLimiter.ts</files>
  <action>
    Implement a simple token bucket:

    ```ts
    interface BucketConfig {
      maxTokens: number;    // burst capacity
      refillRate: number;   // tokens per second
    }

    interface Bucket {
      tokens: number;
      lastRefillTime: number;
    }

    const CONFIGS: Record<string, BucketConfig> = {
      'kp_award':              { maxTokens: 10, refillRate: 10 / 60 },   // 10 per 60s
      'leaderboard_submit':    { maxTokens: 5,  refillRate: 5 / 60 },    // 5 per 60s
      'profile_save':          { maxTokens: 3,  refillRate: 3 / 120 },   // 3 per 120s
      'challenge_decode':      { maxTokens: 20, refillRate: 20 / 60 },   // 20 per 60s
      'calibration_complete':  { maxTokens: 3,  refillRate: 3 / 120 },   // 3 per 120s
    };

    const buckets = new Map<string, Bucket>();

    function refillBucket(key: string, config: BucketConfig): Bucket {
      const now = Date.now();
      const existing = buckets.get(key);
      if (!existing) {
        const b = { tokens: config.maxTokens, lastRefillTime: now };
        buckets.set(key, b);
        return b;
      }
      const elapsed = (now - existing.lastRefillTime) / 1000;
      const refilled = Math.min(config.maxTokens, existing.tokens + elapsed * config.refillRate);
      existing.tokens = refilled;
      existing.lastRefillTime = now;
      return existing;
    }

    export function rateLimitCheck(key: string): boolean {
      const config = CONFIGS[key];
      if (!config) return true; // unknown key = allow
      const bucket = refillBucket(key, config);
      if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return true; // allowed
      }
      return false; // rate limited
    }

    export function getRateLimitMessage(key: string): string {
      return `Action '${key}' rate limited. Please wait a moment before trying again.`;
    }
    ```

    AVOID: Persisting bucket state to localStorage — memory-only is intentional.
    AVOID: Throwing exceptions on rate limit — return false and let callers decide UX.
  </action>
  <verify>`npx tsc --noEmit` exits 0</verify>
  <done>
    - rateLimitCheck(key) returns boolean
    - Token bucket refills correctly
    - TypeScript clean
  </done>
</task>

<task type="auto">
  <name>Apply rate limiting to all gated actions + harden username validation</name>
  <files>src/App.tsx, src/profile/leaderboard.ts, src/profile/profile.ts, src/social/challengeCode.ts</files>
  <action>
    **App.tsx — handleDuelResultRecorded**:
    ```ts
    import { rateLimitCheck } from './utils/rateLimiter.ts';
    // ...
    if (!rateLimitCheck('kp_award')) {
      console.warn('KP award rate limited');
      return;
    }
    // ... rest of handler
    ```

    **App.tsx — handleCalibrationComplete**:
    ```ts
    if (!rateLimitCheck('calibration_complete')) {
      // Don't block calibration display, but skip saving
      console.warn('Calibration save rate limited');
    }
    ```

    **leaderboard.ts — submitLeaderboardEntry**:
    ```ts
    import { rateLimitCheck } from '../utils/rateLimiter.ts';
    export function submitLeaderboardEntry(entry: ...) {
      if (!rateLimitCheck('leaderboard_submit')) {
        console.warn('Leaderboard submission rate limited');
        return loadLeaderboard(); // return current without adding
      }
      // ... rest
    }
    ```

    **profile.ts — saveProfile**:
    ```ts
    export function saveProfile(p: PlayerProfile): boolean {
      if (!rateLimitCheck('profile_save')) return false;
      // ... save
      return true;
    }
    ```

    **profile.ts — validateUsername — XSS hardening**:
    Add to validation:
    ```ts
    if (/<|>|&|"|'|`/.test(name)) return 'Username contains invalid characters';
    ```
    (Reject HTML special chars in addition to the existing alphanumeric check.)

    **challengeCode.ts — decodeChallengeCode**:
    ```ts
    if (!rateLimitCheck('challenge_decode')) {
      console.warn('Challenge decode rate limited');
      return null;
    }
    ```

    AVOID: Blocking UI rendering or throwing errors on rate limit — silently drop or return null/false.
    AVOID: Rate limiting read operations (loadLeaderboard, loadProfile) — only writes/submissions.
  </action>
  <verify>
    1. In browser console: call `rateLimitCheck('kp_award')` 11 times rapidly — 11th returns false.
    2. `npx tsc --noEmit` exits 0.
    3. Username containing `<script>` is rejected.
  </verify>
  <done>
    - Rate limits applied to all 5 action types
    - XSS chars rejected in username validation
    - TypeScript clean
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] `rateLimitCheck('kp_award')` returns false after 10 rapid calls
- [ ] `validateUsername('<script>')` returns error string
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` succeeds
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `git add -A && git commit -m "feat(security): token-bucket rate limiting + XSS-hardened input validation"`
- [ ] Git push: `git push`
</success_criteria>
