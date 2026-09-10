---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - "package.json"
  - "tsconfig.json"
  - "vite.config.ts"
  - "tailwind.config.js"
  - "src/types/combat.ts"
  - "src/engine/dictionary.ts"
  - "src/engine/useTypingEngine.ts"
  - "src/engine/useStanceManager.ts"
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Typing engine accurately records character inputs with zero latency, correct vs mistype feedback, and real-time WPM calculation."
    - "Stance Triangle switches between Strike (Red), Counter (Blue), and Disrupt (Purple) via hotkey, generating stance-specific word sets."
    - "Mistypes apply immediate recoil penalty and combo reset."
  artifacts:
    - "src/types/combat.ts exists with Stance, Word, KeystrokeEvent, and CombatState interfaces"
    - "src/engine/dictionary.ts generates stance-weighted vocabularies (burst verbs, cryptographic terms, symbol strings)"
    - "src/engine/useTypingEngine.ts provides reactive zero-lag keystroke evaluation"
---

# Plan 1.1: Core Typing Engine & Stance Triangle

<objective>
Scaffold the high-performance TypeScript/React application and build the foundational zero-latency keystroke engine with the dynamic Stance Triangle (Strike, Counter, Disrupt).

Purpose: Establish the core input loop and tactical stance mechanics upon which all combat, visual, and network systems depend.
Output: Scaffolding, core combat types, dictionary generator, typing state hook, and stance management hook.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/ROADMAP.md
</context>

<tasks>

<task type="auto">
  <name>Initialize Vite TypeScript environment with strict configuration and Tailwind CSS</name>
  <files>package.json, tsconfig.json, vite.config.ts, tailwind.config.js, index.html</files>
  <action>
    Create a clean Vite + React + TypeScript setup. Configure strict TS rules (`noImplicitAny`, `strictNullChecks`), Tailwind CSS with custom font and theme extensions for terminal monospaced typography, and scripts for build and typecheck.
    AVOID: Bulky UI component libraries (MUI, AntD, Chakra) because SpeedType requires sub-millisecond custom rendering and zero CSS bloat.
  </action>
  <verify>npm run build or npx tsc --noEmit</verify>
  <done>Clean build passes with zero TypeScript errors</done>
</task>

<task type="auto">
  <name>Implement Combat Type Definitions & Stance Dictionary Generator</name>
  <files>src/types/combat.ts, src/engine/dictionary.ts</files>
  <action>
    Define strict interfaces for `StanceType` ('strike' | 'counter' | 'disrupt'), `WordTarget`, `KeystrokeLog`, `BeamState`, `CombatStats`, and `PlayerState`. Implement `dictionary.ts` providing curated word banks:
    - Strike: Punchy dynamic verbs ('STRIKE', 'BREACH', 'SHATTER', 'CLEAVE', 'DISINTEGRATE', 'RUPTURE', 'BLITZ').
    - Counter: Defensive security/cryptography terminology ('QUARANTINE', 'ENCRYPT', 'IMMOBILIZE', 'FIREWALL', 'DEFLECT', 'INSULATE').
    - Disrupt: Complex punctuation, mixed case, operators, and symbols ('$sys.ptr->0x9F;', '!&&_NULL#', '[k*~void::run]', '@async{42}/').
    AVOID: Fetching dictionaries from remote network APIs during combat; vocabulary must be instant and offline-ready.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Dictionary generates properly formatted words for all three stances with zero type errors</done>
</task>

<task type="auto">
  <name>Implement Zero-Latency Typing Engine and Stance Manager Hooks</name>
  <files>src/engine/useTypingEngine.ts, src/engine/useStanceManager.ts</files>
  <action>
    Create `useTypingEngine` to capture keyboard events with `window.addEventListener('keydown')`. Process inputs directly: track current word index, typed characters, accuracy percentage, mistake count, and continuous WPM.
    Create `useStanceManager` handling hotkey switching (`Tab`, `1`, `2`, `3`) between Strike, Counter, and Disrupt, updating active word targets smoothly and managing stance transition states.
    AVOID: React `<input>` or `<textarea>` wrappers which introduce browser focus loss, IME composition lag, or accidental autofocus blurs.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Typing and stance hooks manage state transitions without memory leaks or race conditions</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] TypeScript compilation succeeds with zero errors (`npx tsc --noEmit`)
- [ ] Stance triangle switches between Strike, Counter, and Disrupt
- [ ] Word generator produces valid stance-specific lexical targets
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
