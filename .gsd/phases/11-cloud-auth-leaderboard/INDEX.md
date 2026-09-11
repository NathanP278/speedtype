# Phase 11: Cloud Auth, Accounts & Global Leaderboard

## Overview
Comprehensive overhaul of user accounts, authentication (Email/Password + Google OAuth via Supabase), and the leaderboard system to support real cross-device identities and verified competitive rankings.

---

## Wave Execution Map

```
Wave 1 (Foundation):
  11.1 — Supabase Client, Database Schema & Auth Hook
         [package.json, supabase/schema.sql, .env.example, src/lib/supabase.ts, src/auth/useAuth.ts]

Wave 2 (UI & Integrations, depends on 11.1):
  11.2 — Modern Account & Auth Modal (Login, Signup, Google OAuth)
         [src/components/AuthModal.tsx, src/components/TerminalViewport.tsx, src/App.tsx]

  11.3 — Global Cloud Leaderboard & Account Score Sync
         [src/services/leaderboardService.ts, src/components/LeaderboardModal.tsx, src/App.tsx]
```

---

## Plans

- **Plan 11.1**: Supabase Client, Database Schema & Auth Hook
  - `@supabase/supabase-js` installation
  - PostgreSQL schema (`supabase/schema.sql`) for profiles and leaderboard with RLS policies
  - `src/lib/supabase.ts` client wrapper with graceful unconfigured fallback
  - `src/auth/useAuth.ts` managing sessions, email auth, Google OAuth, and profile sync

- **Plan 11.2**: Modern Account & Auth Modal
  - Dual-tab `AuthModal` (Sign In / Register)
  - Registration requires username, email, password, and avatar selection
  - Branded "Sign in with Google" OAuth trigger
  - Header profile pill displays authenticated username + avatar + provider badge (Google / Email)
  - Account popover with user details and Sign Out action

- **Plan 11.3**: Global Cloud Leaderboard & Account Score Sync
  - `leaderboardService` with difficulty filters and cloud insertions
  - Redesigned `LeaderboardModal` with Google/Email account badges, rank indicators, and manual refresh
  - Match completion syncing scores to authenticated user account
