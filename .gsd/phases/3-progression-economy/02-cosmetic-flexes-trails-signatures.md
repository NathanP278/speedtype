---
phase: 3
plan: 2
wave: 2
depends_on:
  - "3.1"
files_modified:
  - "src/canvas/TypingTrailsCanvas.tsx"
  - "src/canvas/trailShaders.ts"
  - "src/components/KoSignatureStamp.tsx"
  - "src/cosmetics/koSignatures.ts"
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Typing Trails dynamically render behind active keystrokes (Matrix Rain, Lightning Arcs, Neon Ghost)."
    - "Winning a match or executing a Finisher stamps the equipped custom ASCII KO Signature across the opponent's zone."
    - "KO stamps feature authentic ASCII terminal art with screen-shake and particle impact."
  artifacts:
    - "src/canvas/trailShaders.ts implements mathematical procedural trail rendering"
    - "src/canvas/TypingTrailsCanvas.tsx draws real-time cursor and keystroke effects"
    - "src/cosmetics/koSignatures.ts stores multi-line ASCII art templates"
    - "src/components/KoSignatureStamp.tsx handles dramatic victory slam animation"
---

# Plan 3.2: Typing Trails & ASCII KO Signatures

<objective>
Implement dynamic typing trails (Matrix rain, Lightning arcs, Neon ghost) rendered on an overlay canvas, and design multi-line ASCII KO Signatures that slam down onto defeated opponents.

Purpose: Provide visual flair and competitive flexes that reward mastery and economic investment.
Output: Procedural trail renderer, typing trail canvas component, ASCII art banner library, and KO signature stamp component.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/economy/economyState.ts
- src/engine/useTypingEngine.ts
</context>

<tasks>

<task type="auto">
  <name>Implement Procedural Typing Trails (Matrix Rain, Lightning Arcs, Neon Ghost)</name>
  <files>src/canvas/trailShaders.ts, src/canvas/TypingTrailsCanvas.tsx</files>
  <action>
    Develop `trailShaders.ts` and `TypingTrailsCanvas.tsx`:
    - Matrix Rain: Spawns cascading columns of randomized ASCII characters and katakana falling from keystroke coordinates with phosphorescent fading heads.
    - Lightning Arcs: Generates procedural fractal midpoint-displacement lightning bolts bridging consecutive key coordinates with brief plasma persistence (180ms).
    - Neon Ghost: Emits multi-colored chromatic ghost copies of the active word that drift outward with motion blur during Overclock.
    - Hook into `onKeystroke` event to capture exact screen coordinates of active typing cursor.
    AVOID: Re-instantiating canvas contexts; maintain a single 2D hardware-accelerated context with double-buffering.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Trail effects execute cleanly at 60 FPS in response to keystrokes</done>
</task>

<task type="auto">
  <name>Build ASCII KO Signatures Library and Dramatic Victory Slam Component</name>
  <files>src/cosmetics/koSignatures.ts, src/components/KoSignatureStamp.tsx</files>
  <action>
    Design four authentic multi-line ASCII KO Signatures in `koSignatures.ts`:
    1. `[TERMINATED]` Classic Tombstone ASCII with RIP terminal epitaph.
    2. `[REVILED_SYSTEM_PURGE]` Cyber skull with smoking optical circuits.
    3. `[CRITICAL_CORE_DUMP]` Binary memory matrix grid with stack dump hex addresses.
    4. `[SYNTAX_ERROR_FATAL]` CRT system crash report banner with flashing hazard borders.
    Build `KoSignatureStamp.tsx`:
    - Triggers on match victory or Finisher completion.
    - Stretches and slams the equipped signature onto the rival's terminal with screen shudder, glitch chromatic aberration, and a heavy low-frequency bass impact.
    AVOID: Static unstyled text; use CSS keyframes for the dramatic physical deceleration slam and impact shudder.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>KO signatures display with impact animations and match the player's equipped cosmetic</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] TypeScript check succeeds with zero errors
- [ ] Equipped trail reacts to user keystrokes in real time
- [ ] KO Signature stamps on victory with proper ASCII alignment
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
