---
phase: 5
plan: 2
wave: 1
depends_on: []
files_modified:
  - src/components/CombatHud.tsx
  - src/components/KineticBeamDisplay.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "CombatHud above-fold shows only: name, HP bar, stance pills, overclock gauge -- no WPM/ACC/PARRIES/WORDS during combat"
    - "KineticBeamDisplay shows only the plasma bar + danger zones -- no numeric labels, no tick numbers"
    - "Stance selector is compact horizontal pill row, not a full label+description bar"
    - "Opponent HUD is visually subordinate (dimmer, smaller) to player HUD"
  artifacts:
    - "CombatHud.tsx renders in <=80 lines of JSX"
    - "KineticBeamDisplay.tsx removes all numeric span elements"
---

# Plan 5.2: CombatHud Redesign & KineticBeam Simplification

<objective>
The CombatHud currently occupies nearly one-third of the screen above the typing area, displaying 8 data points per combatant (name, HP, shield, WPM, ACC, PARRIES, WORDS) plus stance buttons plus overclock gauge. The KineticBeamDisplay shows raw -100/+100 numeric values and 6 tick marks that clutter the beam track.

Both components scream data. The game should FEEL momentum, not report it.

Purpose: Reduce above-fold chrome so the word-typing zone is the visual hero. Stats are post-match data, not live HUD.
Output: Minimal 2-section CombatHud (HP bars + stance pills), clean KineticBeamDisplay (bar only, no numbers).
</objective>

<context>
Load for context:
- src/components/CombatHud.tsx
- src/components/KineticBeamDisplay.tsx
- src/engine/dictionary.ts (STANCE_CONFIGS shape)
- src/types/combat.ts (CombatantState, BeamState shapes)
</context>

<tasks>

<task type="auto">
  <name>Redesign CombatHud to minimal layout</name>
  <files>src/components/CombatHud.tsx</files>
  <action>
    Redesign CombatHud into a compact 2-row component:

    ROW 1 — HP bars side by side (grid-cols-2 gap-2):
    - Left (Player): name tag left-aligned + HP% right-aligned. HP bar full width, h-2 (thin).
      Low HP (<= 20%): bar pulses red. Shield overlay stays (thin cyan strip on left).
    - Right (Opponent): HP% left-aligned + name tag right-aligned. HP bar mirrored, h-2.
    - REMOVE: WPM, ACC, PARRIES, WORDS stat rows entirely from CombatHud. These move to post-match only.
    - REMOVE: Shield badge/label (keep the visual bar overlay but drop the "SHIELD: +X" text badge).

    ROW 2 — Stance + Overclock bar (flex row, items-center, justify-between):
    - Left: 3 compact stance pills in a flex-row gap-1.
      Each pill: px-2 py-0.5 text-[11px] rounded-full border.
      Active pill: solid border in stance color + dim background. Inactive: zinc-800 border.
      Label: just the stance icon/shortname. Strike: "STR", Counter: "CTR", Disrupt: "DIS".
      No [1]/[2]/[3] index labels. No verbose descriptions.
    - Right: Overclock gauge. h-1.5 bar (very thin) + label.
      Label: "OVERCLOCK" when active (amber, no animate-pulse), "X/30" when building (zinc-400).
      REMOVE: "TYPO DROPS MULTIPLIER" and "30 CONSECUTIVE CHARS TO ENGAGE" subtext.
      REMOVE: the damageMultiplier float display.

    Total component: aim for <=80 lines JSX. No grid-cols-2 gap-8 on the combatant blocks -- use gap-2 to keep it tight.
    The whole HUD should feel like a thin status strip, not a panel.

    AVOID: removing props from the interface -- keep all incoming props, just don't render unused ones.
    AVOID: touching stance switching logic (onSelectStance still wires through).
  </action>
  <verify>npx tsc --noEmit (0 errors). Dev server: HUD appears as 2 compact rows. Typing area visibly gains vertical space.</verify>
  <done>CombatHud renders <=80 lines. No WPM/ACC/PARRIES stats visible during combat. HP bars thin (h-2). Stance pills compact.</done>
</task>

<task type="auto">
  <name>Simplify KineticBeamDisplay</name>
  <files>src/components/KineticBeamDisplay.tsx</files>
  <action>
    Strip KineticBeamDisplay to its core: a single energy bar that conveys momentum through position and color.

    REMOVE:
    - The HUD header label row ("PLAYER BASELINE" / "KINETIC BEAM: +X | STANCE: ..." / "OPPONENT BASELINE")
    - The tension scale tick numbers row (-100, -50, 0 (CENTER), +50, +100)
    - The 6 grid tick marker divs inside the beam track
    - "CRITICAL HAZARD!" and "KO IMMINENT!" text labels (keep danger zone color change, remove text)

    KEEP:
    - The beam track itself (h-6, slightly thinner than h-7)
    - Left/right 15% danger zone background tints (red and blue)
    - Center equilibrium line (the 2px zinc-600 divider)
    - Dynamic plasma conduit fills (left and right gradient fills)
    - Kinetic energy core focal point (the white needle + glow orb)
    - screenShake class application

    ADD:
    - Two minimal side labels OUTSIDE the bar (flex justify-between below it):
      Left: player name or "YOU" in zinc-500 text-[10px]
      Right: opponent name in zinc-500 text-[10px]
      Center: nothing -- let the bar speak
    - When isNearPlayerKo: left label turns red-500
    - When isNearOpponentKo: right label turns green-400

    The bar conveys all the info needed. Numbers are noise.

    Also accept a playerName and opponentName prop (optional string, fallback "YOU" and "RIVAL").
    Wire in App.tsx by passing combat.player.name and combat.opponent.name.
  </action>
  <verify>npx tsc --noEmit (0 errors). Dev server: beam bar visible with no numeric labels. Danger zones color-shift near extremes. Screen shake still triggers on heavy impacts.</verify>
  <done>KineticBeamDisplay has no numeric spans. Bar + danger zones + focal point only. Player/opponent minimal side labels present.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] npx tsc --noEmit exits 0
- [ ] No WPM/ACC/PARRIES visible during active combat
- [ ] Kinetic beam shows no numbers (no -100, +50, CENTER etc.)
- [ ] HUD visually occupies less than 20% of screen height
- [ ] Stance pills are compact rounded-full, not full-border rectangle buttons
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Zero TypeScript errors
</success_criteria>
