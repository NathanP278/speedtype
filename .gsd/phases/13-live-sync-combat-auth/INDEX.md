# Phase 13: Live Synchronization, Rigorous Combat Calculations & Hardened Authentication

## Overview
Comprehensive overhaul resolving critical gameplay and infrastructure issues:
1. **WPM Math & Rival AI Pacing**: Eliminate the 54 WPM vs 74 WPM player win contradiction by fixing character-based standard WPM calculations, removing negative-skewed rival variance, and using drift-free timestamp-based rival scheduling.
2. **Authentication Security & Strict Google Gate**: 100% mandatory Google OAuth with zero local fallback, zero guest modes, and zero mock profiles. Fix Google sign-up/login flow to reliably advance to the handle/profile wizard, secure session tokens with PKCE, and prevent localStorage tampering.
3. **Live Data Synchronization**: Remove all required page refreshes so 1v1 challenges, ghost runs, and leaderboard rankings update instantaneously.
4. **Intuitive Subsystem Connections**: Auto-equip cosmetics (palettes, soundboards, trails) upon marketplace purchase with an instant theme preview, and connect duel results directly to 1v1 challenge generation and leaderboards.
5. **Database Reset & Clean Purge**: Wipe all stale database entries and provide clear scripts for both Supabase tables and local storage.

---

## Wave Execution Map

```
Wave 1 (Foundation & Math Engine):
  13.1 — WPM Math Normalization & Rival AI Pacing Engine
         [src/engine/calibration.ts, src/engine/adaptiveRival.ts, src/engine/useSimpleDuel.ts, src/social/tournamentSimulator.ts]

  13.2 — Database Reset, Schema Verification & Strict Google Auth Hardening
         [supabase/schema.sql, supabase/reset_database.sql, src/auth/useAuth.ts, src/auth/authTypes.ts, src/components/AuthModal.tsx, src/utils/storagePurge.ts]

Wave 2 (Realtime Data & Connected Experience, depends on Wave 1):
  13.3 — Live Realtime Synchronization Without Webpage Refresh
         [src/App.tsx, src/components/ChallengeModal.tsx, src/components/LeaderboardModal.tsx, src/components/ModernResultModal.tsx, src/services/leaderboardService.ts]

  13.4 — Marketplace Theme Auto-Equip & Connected UX Flows
         [src/components/BlackMarketModal.tsx, src/components/MarketItemCard.tsx, src/economy/useEconomy.ts]
```

---

## Plans

- **Plan 13.1**: WPM Math Normalization & Rival AI Pacing Engine
  - Keystroke-based standard WPM formulas replacing word-count division in `calibration.ts` and `useSimpleDuel.ts`.
  - Drift-free timestamp-based rival scheduler eliminating `setTimeout` lag.
  - Symmetrical difficulty variance (`[-5, +5]` on equal mode) restoring a fair ~50% win rate on even match.
  - Consistent WPM calculation audit across Tournament and Ghost modes.

- **Plan 13.2**: Database Reset, Schema Verification & Minimalist Google Auth Gate
  - Clean database purge script (`reset_database.sql`) wiping `leaderboard` and `profiles`.
  - Storage purge utility wiping all local `speedtype_*` storage.
  - Minimalist landing homepage: large thick bold `SPEEDTYPE` typography, lightning icon, short punchy description, and single prominent Google Sign In / Sign Up button.
  - 100% mandatory Google OAuth: zero local login fallbacks, zero guest accounts, elimination of 5-stage survey wizard in favor of a fast 1-field username setup.

- **Plan 13.3**: Live Realtime Synchronization Without Webpage Refresh
  - Live ghost run state update in `App.tsx` on duel completion so 1v1 challenge modal detects runs instantly.
  - Event-driven and realtime leaderboard score updates without manual page refresh.
  - Match result modal direct action buttons: Challenge Friend and View Leaderboard.

- **Plan 13.4**: Marketplace Theme Auto-Equip & Connected UX Flows
  - Auto-equip bought theme palettes with instant visual theme shift and confirmation toast/selector.
  - Auto-equip bought soundboards, trails, and signatures.
  - End-to-end verification passing TypeScript compiler and production build.
