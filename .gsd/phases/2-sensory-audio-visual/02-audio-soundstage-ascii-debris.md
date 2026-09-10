---
phase: 2
plan: 2
wave: 2
depends_on:
  - "2.1"
files_modified:
  - "src/audio/soundEngine.ts"
  - "src/audio/soundboards.ts"
  - "src/canvas/AsciiDebrisCanvas.tsx"
  - "src/canvas/debrisPhysics.ts"
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Web Audio API generates authentic mechanical switches, Model M clicks, typewriters, and 8-bit blips procedurally with zero external asset latency."
    - "Keystroke pitch scales up an ascending pentatonic scale with consecutive clean hits and snaps back on typo."
    - "Overclock engages low-pass audio ducking filter isolating mechanical clicks."
    - "Completed words explode into bouncing ASCII letter fragments with gravity, rotation, and floor friction."
  artifacts:
    - "src/audio/soundEngine.ts handles WebAudio context, biquad filters, oscillators, and ducking"
    - "src/audio/soundboards.ts implements procedural switch synthesis algorithms"
    - "src/canvas/debrisPhysics.ts models 2D rigid-body particle physics for ASCII glyphs"
    - "src/canvas/AsciiDebrisCanvas.tsx renders high-performance hardware-accelerated particle canvas"
---

# Plan 2.2: Web Audio Soundstages & Canvas ASCII Impact Debris

<objective>
Build the procedural Web Audio mechanical soundstage with pitch-scaling keystrokes and Overclock audio ducking, alongside a hardware-accelerated Canvas particle physics system that shatters completed words into bouncing ASCII debris.

Purpose: Provide instant acoustic and tactile tactile typing feedback and explosive visual feedback for combat impacts.
Output: Procedural audio synthesis engine, soundboard pack library, 2D particle physics engine, and ASCII debris canvas component.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/types/combat.ts
- src/engine/useOverclock.ts
</context>

<tasks>

<task type="auto">
  <name>Implement Procedural Web Audio Synthesis Engine and Soundboard Packs</name>
  <files>src/audio/soundEngine.ts, src/audio/soundboards.ts</files>
  <action>
    Construct `soundEngine.ts` using native `AudioContext`:
    - Master gain, dynamic compressor, and switchable biquad filter for Overclock low-pass ducking (800Hz cutoff).
    - Streak pitch scaler: computes frequency based on consecutive character streak using a 12-tone pentatonic scale ($f = 440 \times 2^{(n/12)}$), resetting on mistype.
    Construct `soundboards.ts` with procedural sound profiles:
    1. Mechanical Thock: Short 80Hz-220Hz bandpass punch with rapid exponential decay (30ms).
    2. IBM Model M: High-frequency click burst (2.4kHz) paired with resonant metallic buckling spring ringing (4.8kHz).
    3. Typewriter: Crisp white-noise transient strike plus periodic bell ring on word completion.
    4. 8-Bit Blip: Square wave arpeggio chiptune chirps.
    5. Silent Switch: Low-frequency muffled dampener pop (140Hz).
    AVOID: Relying on external audio files or MP3 network requests; procedural synthesis guarantees 0ms latency and 100% offline availability.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Audio engine initializes on user gesture and synthesizes clean clicks without audio clicks or popping</done>
</task>

<task type="auto">
  <name>Implement 2D ASCII Impact Debris Physics Engine</name>
  <files>src/canvas/debrisPhysics.ts</files>
  <action>
    Create `debrisPhysics.ts` simulating rigid body mechanics for text particles:
    - Particle structure: `{ char, x, y, vx, vy, rotation, vRot, alpha, color, size, life }`.
    - Spawn function: takes completed word, breaks into individual characters at word screen coordinates, and applies outward radial explosive velocity.
    - Update function: applies gravity (980 px/s²), air drag, ground boundary bounce with restitution coefficient 0.55, rotation update, and alpha fade out over 1.2 seconds.
    - Memory optimization: Pre-allocate particle pool (max 150 active particles) to prevent GC pauses.
    AVOID: Array allocation/deallocation on every frame; recycle dead particles via an object pool.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Physics simulation calculates bounce, spin, and culling with zero memory allocation churn</done>
</task>

<task type="auto">
  <name>Build Hardware-Accelerated ASCII Debris Canvas Overlay</name>
  <files>src/canvas/AsciiDebrisCanvas.tsx</files>
  <action>
    Implement `AsciiDebrisCanvas.tsx`:
    - Fullscreen transparent overlay synchronized with `requestAnimationFrame`.
    - Renders active particles using monospaced font with current phosphor palette text glow.
    - Handles device pixel ratio scaling for crisp rendering on Retina / HiDPI screens.
    - Listens for combat word completion events to spawn debris cascades at word anchor positions.
    AVOID: Overdrawing entire canvas when particle count is 0; pause animation loop when no particles are active to save GPU cycles.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Canvas renders bouncing ASCII particles at a steady 60+ FPS and cleanly sleeps when idle</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] TypeScript check succeeds with zero errors
- [ ] Keystroke audio triggers without latency and scales pitch on streaks
- [ ] Debris canvas renders exploding character particles with realistic floor bounce
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
