---
phase: 2
plan: 1
wave: 1
depends_on:
  - "1.2"
files_modified:
  - "src/styles/crt.css"
  - "src/components/TerminalViewport.tsx"
  - "src/components/KineticBeamDisplay.tsx"
  - "src/components/CombatHud.tsx"
  - "src/styles/palettes.ts"
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Pitch-black OLED background with razor-sharp monospaced typography."
    - "CRT curvature filter, scanline raster overlay, and reactive phosphor bloom."
    - "Dynamic phosphor palettes switchable between Amber 1984, Cyber Lime, Vaporwave Magenta, and Monochrome Ice."
    - "Kinetic Beam center visual accurately displays balance, tension, and threshold markers."
  artifacts:
    - "src/styles/crt.css defines scanlines, curvature distortion, and glow effects"
    - "src/components/TerminalViewport.tsx wraps active game in CRT chassis"
    - "src/components/KineticBeamDisplay.tsx renders the animated tug-of-war conduit"
    - "src/styles/palettes.ts provides color tokens for all four phosphor themes"
---

# Plan 2.1: OLED Terminal, CRT Curvature & Reactive Phosphor Glow

<objective>
Build the sensory presentation layer featuring a pitch-black OLED aesthetic, CRT barrel curvature, animated scanline raster, reactive phosphor bloom scaling with WPM, and the central kinetic beam display.

Purpose: Deliver the visceral retro-futuristic arcade terminal immersion specified in the sensory design requirements.
Output: CRT shader styles, Terminal Viewport wrapper, Kinetic Beam canvas/SVG component, and Phosphor theme palette definitions.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/types/combat.ts
- src/engine/useKineticBeam.ts
</context>

<tasks>

<task type="auto">
  <name>Create CRT Aesthetic Styles & Phosphor Palette Tokens</name>
  <files>src/styles/crt.css, src/styles/palettes.ts</files>
  <action>
    Implement CSS filter classes for:
    - CRT barrel curvature (radial vignette and subtle spherical transform).
    - Scanline raster grid with subtle animated 60Hz phosphor refresh flicker.
    - Chromatic aberration displacement for burst hits and Overclock.
    - Reactive text glow utility classes scaling from 2px to 16px blur based on combo tier.
    Implement `palettes.ts` defining color values, glow shadows, and background tints for:
    1. Amber 1984 (#FFB000)
    2. Cyber Lime (#00FF66)
    3. Vaporwave Magenta (#FF007F)
    4. Monochrome Ice (#E0F7FA)
    AVOID: Static raster image backgrounds; use CSS gradients and SVG filters so rendering scales crisply at 4K.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Styles and palette tokens compile without errors and provide switchable CSS variables</done>
</task>

<task type="auto">
  <name>Build Terminal Viewport Chassis and Combat HUD</name>
  <files>src/components/TerminalViewport.tsx, src/components/CombatHud.tsx</files>
  <action>
    Develop `TerminalViewport.tsx` wrapping the application in a curved OLED monitor frame with toggleable CRT curvature, scanline density, and phosphor palette selector.
    Develop `CombatHud.tsx` displaying:
    - Player & Opponent health bars with absorption shield overlays.
    - Active Stance badge (Strike / Counter / Disrupt) with tactical hotkey hints.
    - Overclock streak gauge (0/30) with neon flame indicators.
    - Real-time WPM, Accuracy %, and Parries metric tickers.
    AVOID: Layout shifts during stance swaps; enforce fixed monospace dimensions for all HUD numbers.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Terminal chassis and HUD components render cleanly in monospace grid with zero layout shift</done>
</task>

<task type="auto">
  <name>Build Kinetic Beam Central Tug-of-War Display</name>
  <files>src/components/KineticBeamDisplay.tsx</files>
  <action>
    Implement `KineticBeamDisplay.tsx` visualizing the energy conduit:
    - Central origin marker and baseline KO thresholds at extremities (-100 and +100).
    - Dynamic plasma core color reflecting the dominant stance (Red / Blue / Purple).
    - Jitter and particle sparks that intensify when the beam is near baseline knockout limits.
    - Screen shake effect when a heavy word burst push hits.
    AVOID: Heavy canvas redraw loops if simple SVG/CSS GPU transforms can achieve 120 FPS; use SVG with GPU-composited CSS transforms and canvas for particle emissions.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Kinetic beam renders smooth tug-of-war motion with dynamic stance-colored plasma</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] TypeScript check succeeds with zero errors
- [ ] Phosphor palettes switch dynamically via CSS variables
- [ ] CRT curvature and scanlines toggle cleanly with zero performance degradation
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
