---
phase: 5
plan: 3
wave: 2
depends_on: [5.1, 5.2]
files_modified:
  - src/styles/crt.css
  - src/App.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "CRT effects are OFF by default; user opts in via Menu panel"
    - "glitch-active animation plays at 0.5s duration (not 0.25s infinite nausea loop)"
    - "Overclock beam focal point uses animate-pulse only (NOT animate-ping + scale-150)"
    - "Player word zone is the visual hero: large centered card with clean character rendering"
    - "Opponent word is secondary: smaller, dimmer, shown as mini-progress indicator below/beside"
    - "Word cursor uses border-b-2 blink (via CSS) not React animate-pulse class"
    - "prefers-reduced-motion: all CSS animations are disabled when user has motion preference set"
  artifacts:
    - "crt.css has prefers-reduced-motion block disabling all keyframe animations"
    - "crt-screen and crt-curvature classes are NOT applied by default in TerminalViewport"
    - "App.tsx word arena uses asymmetric layout: large player card, small opponent strip"
---

# Plan 5.3: Visual Calm-Down & Word Zone Redesign

<objective>
The current game fires simultaneously: glitch-active animation (0.25s infinite), animate-ping scale-150 on overclock beam, animate-pulse on word cursor, scanline-beam rolling, CRT curvature on by default, glow-wpm on every typed character. The combined effect is visually overwhelming and nauseating.

The word arena puts player and opponent words as equal-sized cards side by side -- player has no focal primacy.

Purpose: Establish visual calm. One thing glows at a time. Player word is the star.
Output: Revised crt.css (calmer animations, reduced-motion support), revised App.tsx word zone (asymmetric hero layout).
</objective>

<context>
Load for context:
- src/styles/crt.css
- src/App.tsx (word arena section, lines 297-470)
- src/components/KineticBeamDisplay.tsx (isOverclocked prop usage)
- src/components/TerminalViewport.tsx (crtEnabled/scanlinesEnabled state)
</context>

<tasks>

<task type="auto">
  <name>Calm CSS animations + reduce-motion support</name>
  <files>src/styles/crt.css</files>
  <action>
    Apply these targeted changes to crt.css:

    1. glitch-active:
       CHANGE: animation duration from 0.25s to 0.6s. Add animation-iteration-count: 3 (not infinite).
       After 3 iterations the glitch stops -- the disruption ENDS rather than running forever.
       The JS timer (2500ms) will toggle the class on/off, so it will reapply if still disrupted.

    2. scanline-beam:
       CHANGE: animation duration from 6s to 10s (slower, less strobing).
       CHANGE: opacity of the beam gradient from 0.09 to 0.05 (more subtle).

    3. scanlines:
       CHANGE: background-size from 100% 4px to 100% 6px (slightly coarser, less flicker).
       CHANGE: --scanline-opacity default from 0.25 to 0.15.

    4. overclock-bloom:
       CHANGE: animation duration from 1.2s to 2s (slower breathe).

    5. CRT off by default:
       In TerminalViewport.tsx (already handled in Plan 5.1 task -- the MenuPanel holds the toggles).
       ADD here to crt.css: document that initial state is no crt-curvature.
       No CSS change needed, just confirm the TerminalViewport useState defaults:
         crtEnabled = false (was true) -- change this in TerminalViewport.tsx here.
         scanlinesEnabled = false (was true) -- change this too.
       NOTE: this is a 2-line change in TerminalViewport.tsx, not crt.css. Include it in this task's files.

    6. prefers-reduced-motion block (ADD at end of file):
       @media (prefers-reduced-motion: reduce) {
         .glitch-active,
         .overclock-bloom,
         .scanline-beam,
         .scanlines,
         .shake-light,
         .shake-heavy,
         .glow-wpm { animation: none !important; transition: none !important; }
       }

    AVOID: changing the color values of any animation -- only timing and opacity.
    AVOID: removing the animation classes themselves -- they are still used, just calmer.
  </action>
  <verify>
    npx tsc --noEmit (0 errors, no TS in CSS but check TerminalViewport defaults changed).
    Dev server: on load, NO scanlines, NO CRT curvature by default.
    Opening Menu, toggling CRT ON: curvature appears. Toggling LINES ON: scanlines appear.
    In disrupted state: glitch animation runs ~3 cycles then stops until class is re-toggled.
  </verify>
  <done>CRT + scanlines default off. glitch-active runs 3 iterations then stops. scanline-beam 10s/0.05 opacity. prefers-reduced-motion block present.</done>
</task>

<task type="auto">
  <name>Redesign word arena to asymmetric hero layout</name>
  <files>src/App.tsx</files>
  <action>
    Redesign the in_progress word arena section (lines ~372-469 in current App.tsx).
    After Plan 5.1 App.tsx is already extracted; this task modifies the JSX render portion.

    NEW LAYOUT (replace the grid-cols-1 md:grid-cols-2 gap-8):

    A single column layout with two zones:

    ZONE 1 — PLAYER WORD (hero):
    - Full-width card, min-h-[200px], large centered word display
    - Word text: text-4xl sm:text-5xl font-mono font-bold tracking-wider
    - Character rendering: typed chars in theme color with glow-wpm. Current char: white text with
      an underline cursor rendered as a ::after pseudo (use CSS class "word-cursor" on the span
      instead of animate-pulse -- add this class to crt.css as a blinking-border animation at 1s ease).
      Un-typed chars: zinc-600 opacity-50. NO scale-110. NO animate-pulse on the current char span.
    - Stance badge: top-left corner, compact, same as before but smaller text-[10px]
    - Disruption label: only show when isDisrupted, top-right, "DISRUPTED" in purple-400 text-[10px]
    - Bottom row: just WPM + STREAK in zinc-400 text-[11px]. Remove "PRESS [TAB] TO SHIFT STANCE".

    ZONE 2 — OPPONENT WORD (secondary):
    - Slim bar below the player card, NOT a full equal card
    - Layout: flex-row items-center justify-between, px-3 py-1.5, bg-zinc-950 rounded border border-zinc-900
    - Left: opponent name in zinc-500 text-[10px]
    - Center: opponent word text in zinc-600 text-sm font-mono (dimmer, smaller)
    - Right: "RIVAL" + stance in zinc-500 text-[10px]
    - NO min-height constraint. This is a single-line strip.

    Blind duel + flash indicators stay but move inside the player card zone (small pill above the word).

    AVOID: changing any combat logic, only JSX structure and Tailwind classes.
    AVOID: touching the finisher word duel modal -- that stays as-is.
    AVOID: removing the isWordFlashing / revealedWord rendering logic.

    Add to crt.css (can inline in the same task file list):
    .word-cursor {
      border-bottom: 2px solid var(--theme-text);
      animation: cursor-blink 1s step-end infinite;
    }
    @keyframes cursor-blink {
      0%, 100% { border-color: var(--theme-text); }
      50% { border-color: transparent; }
    }
    Add to prefers-reduced-motion block: .word-cursor { animation: none; border-color: var(--theme-text); }
  </action>
  <verify>
    npx tsc --noEmit (0 errors).
    Dev server: player word card is large and centered. Opponent word is a slim strip below.
    Current character has blinking underline cursor (not pulsing scale).
    Typed characters glow. Un-typed are dim. No scale transform on any character.
  </verify>
  <done>Asymmetric layout: player word hero (5xl), opponent word strip (sm). Cursor blinks via CSS, not React animate-pulse. No character scale transforms.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] npx tsc --noEmit exits 0
- [ ] On load: no CRT curvature, no scanlines (clean black background)
- [ ] glitch animation runs <= 3 cycles when disrupted
- [ ] Player word is visually dominant (5xl) vs opponent strip (sm)
- [ ] No animate-pulse or scale transforms on word characters
- [ ] Cursor blinks via CSS border animation
- [ ] @media prefers-reduced-motion block present in crt.css
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Zero TypeScript errors
</success_criteria>
