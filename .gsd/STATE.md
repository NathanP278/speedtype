# SPEEDTYPE PROJECT STATE

## Current Position
- **Active Phase**: Phase 6–10 Feature Overhaul & Modernization
- **Status**: COMPLETE & VERIFIED

## Architectural Directives
- **Zero Framework Bloat**: Pure Vite + React 19 + TypeScript + Tailwind CSS.
- **Zero Asset Latency**: Procedural Web Audio API sound synthesis (no external audio files).
- **Subpixel Terminal Rendering**: Hardware-accelerated Canvas 2D for particle debris and CRT scanline styling.
- **Sub-Millisecond Input**: Global `keydown` handling bypassing HTML input focus traps.
- **Client-Side Security**: In-memory token bucket rate limiting on KP awards, leaderboard submissions, profile saves, and challenge decoding.

## Execution Progress
- [x] Phase 1: Core Combat & Moment-to-Moment Action (Commit 748f263)
- [x] Phase 2: Sensory Design & OLED Terminal Glitch Aesthetic (Commit 0911207)
- [x] Phase 3: Progression, Economy & Cosmetic Flexes (Commit 3c0e71a)
- [x] Phase 4: Competitive Ladders & Social Arena (Commit 59a30e5)
- [x] Phase 6: Core Mechanics Overhaul
  - [x] Plan 6.1: Rival AI Variance [-20, +5] + Start-on-First-Keystroke (Commit 7b909a3)
  - [x] Plan 6.2: Calibration Typo Tolerance, Raw WPM & Reading Margin (Commit 8045849)
  - [x] Plan 6.3: Propagate Variance WPM & Start Gate to Tournament & Modes (Commit 14ce2a1)
- [x] Phase 7: Identity & Social
  - [x] Plan 7.1: Mandatory Player Profile Gate with Username & Avatar (Commit 592dd57)
  - [x] Plan 7.2: Local Leaderboard with Ranked Top-100 Table (Commit 39fc3a7)
- [x] Phase 8: 1v1 Friend Challenge
  - [x] Plan 8.1: Serverless 1v1 Challenge Codes via Base64 (Commit 5f0a759)
- [x] Phase 9: UI Overhaul & Craftsmanship
  - [x] Plan 9.1: Spacious Layout, Word as 8xl Hero, Unified Race Strip (Commit ab80415)
  - [x] Plan 9.2: Calibration, Result Modal & 2-Column Menu Polish (Commit 79ef2ee)
- [x] Phase 10: Rate Limiting & Input Security
  - [x] Plan 10.1: Token-Bucket Rate Limiter & XSS Input Hardening (Commit 8be655b)
- [x] Phase 11: Cloud Auth & Global Leaderboard
  - [x] Plan 11.1: Supabase client, SQL schema, auth types, useAuth hook (Commit 02d8598)
  - [x] Plan 11.2: AuthModal dual-tab, Google OAuth, App gate & sign-out (Commit 1ce7147)
  - [x] Plan 11.3: Cloud Leaderboard service, difficulty filters & account badges (Commit adc6170)
- [x] Phase 12: Google-Exclusive Auth & Interactive Onboarding Wizard
  - [x] Plan 12.1: Combat telemetry types, Supabase schema extensions, updateProfile in useAuth
  - [x] Plan 12.2: Rewrite AuthModal into 5-stage cyberpunk onboarding wizard with node timeline
  - [x] Plan 12.3: TerminalViewport pilot identity with call-sign & switch hardware display (Commit a0b9ee6)
- [x] Phase 13: Live Synchronization, Rigorous Combat Calculations & Hardened Authentication
  - [x] Plan 13.1: WPM Math Normalization & Rival AI Pacing Engine (Commits 44b9011, c0f7b75)
  - [x] Plan 13.2: Database Reset, Schema Verification & Minimalist Google Auth Gate
  - [x] Plan 13.3: Live Realtime Synchronization Without Webpage Refresh
  - [x] Plan 13.4: Marketplace Theme Auto-Equip & Connected UX Flows
- [x] Phase 14: Google Auth Exclusive & Offline Mode Elimination
  - [x] Plan 14.1: Eradicate Offline / Guest / Local Modes & Dead Code (Commit 46bf2d8)
  - [x] Plan 14.2: Google OAuth Popup Handshake & Account Selection (Commit c3a57b2)
  - [x] Plan 14.3: Post-Authentication Pilot Handle & Avatar Setup Gate (Commit c35aa36)

## Verification Evidence
- `npx tsc --noEmit`: Code 0 (0 errors)
- `npm run build`: Vite v6.4.3 production bundle built in 5.11s (dist/assets/index-D9OYE2ot.js 599.01 kB, index-LswW0B7z.css 44.01 kB)
- Commits: `46bf2d8`, `c3a57b2`, `c35aa36`



