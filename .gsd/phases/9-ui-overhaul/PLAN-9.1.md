---
phase: 9
plan: 1
wave: 1
depends_on: [7.1]
files_modified:
  - src/components/TerminalViewport.tsx
  - src/components/ModernDuelArena.tsx
  - src/styles/crt.css
  - src/index.css
autonomous: true
user_setup: []

must_haves:
  truths:
    - "No cramped UI — generous padding and breathing room between all sections"
    - "Dead space is used intentionally — wide center focus zone, narrow sidebars"
    - "Header is taller (48–56px), visually distinct, shows profile identity clearly"
    - "Duel arena has clear visual hierarchy: progress bars top, GIANT word center, upcoming words below"
    - "Mobile responsive — layout degrades gracefully to single-column on <768px"
    - "All interactive elements have visible focus-visible outlines (WCAG AA)"
    - "Color contrast on all text meets WCAG AA minimum (4.5:1 for normal, 3:1 for large)"
  artifacts:
    - "TerminalViewport.tsx — restructured header with profile pill, generous layout"
    - "ModernDuelArena.tsx — hero word display is visually dominant, stats minimal"
---

# Plan 9.1: UI Overhaul — Layout, Spacing, Visual Hierarchy

<objective>
Completely redesign the visual layout. Current issues:
- Header is cramped with competing elements at same visual weight
- Duel arena feels small — the word is not the hero
- Dead space unused or filled with low-value chrome
- Stats are too prominent, distracting from typing

New design philosophy:
- The WORD is the hero. Everything else recedes.
- Stats are ambient, not dominant — small, peripheral.
- Progress bars communicate race state without visual noise.
- Profile identity in header is clean and badge-like.

Output: Redesigned TerminalViewport and ModernDuelArena with generous spacing and clear hierarchy.
</objective>

<context>
Load for context:
- src/components/TerminalViewport.tsx
- src/components/ModernDuelArena.tsx
- src/styles/crt.css
- src/index.css
- src/styles/palettes.ts
</context>

<tasks>

<task type="auto">
  <name>Redesign TerminalViewport — spacious header + layout structure</name>
  <files>src/components/TerminalViewport.tsx</files>
  <action>
    **New header design (h-14 = 56px)**:
    - Left: `⚡ SPEEDTYPE` logo (larger, 16px, bold) + version badge
    - Center: Player profile pill `[avatar] [username] | [WPM badge]` — prominent, not hidden
    - Right: compact row: KP balance | palette cycler | [MODES ☰] button
    
    Remove: `[RETEST SPEED]` from header — it's contextual, belongs in duel footer.
    Remove: `calibrationBadge` prop pattern — replace with explicit `playerProfile` prop.

    Add prop: `playerProfile: { username: string; avatar: string } | null`
    
    **Main area**: Remove `p-4 md:p-6` padding from the outer `<main>` — let child components manage their own breathing room. Change to `p-0` with `overflow-y-auto`.

    **Footer** (h-8 = 32px): purely decorative / keybind hints. Remove "0ms INPUT LATENCY" (marketing copy). Show: `TAB: switch stance • ESC: menu • ⚡ {kpBalance} KP`

    **CSS additions to src/index.css**:
    ```css
    .focus-ring {
      @apply outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-black;
    }
    ```
    Apply `.focus-ring` class to all interactive elements.

    AVOID: Removing CRT/scanline overlay logic — keep it, just don't let it affect layout.
    AVOID: Making header > 56px — keeps it lean.
  </action>
  <verify>
    - Header shows profile username center-aligned
    - Layout does not overflow horizontally at 1280px viewport
    - `npx tsc --noEmit` exits 0
  </verify>
  <done>
    - Header 56px, profile centered
    - Footer minimal
    - focus-ring utility class added
  </done>
</task>

<task type="auto">
  <name>Redesign ModernDuelArena — word as hero, stats as ambient</name>
  <files>src/components/ModernDuelArena.tsx</files>
  <action>
    New layout structure (top → bottom):

    **Section 1 — Race Strip** (compact, ~60px tall):
    - Single unified bar showing both player and rival progress side-by-side on one track
    - Rival marker: red pip at rival's %, player marker: theme-color pip at player's %
    - Labels: "YOU" left, "RIVAL" right, percentage center
    - No separate dual bars — one unified race track is cleaner

    **Section 2 — Hero Word Zone** (full remaining height, ~60vh on desktop):
    - Center-aligned vertically and horizontally
    - Current word: `text-7xl sm:text-8xl` (massive)
    - Typed chars: theme color + glow
    - Current char: white, slightly larger
    - Untyped chars: zinc-700 (dark but visible)
    - Caret: animated, positioned left of current char
    - No box/card border — the word floats in space
    - Upcoming words: 4 words below the hero word, `text-base text-zinc-600`, space-separated
    
    **Section 3 — Ambient Stats Bar** (~40px, pinned bottom of section):
    - `YOU: {wpm} WPM / {accuracy}% ACC / {streak} streak` — all on one line, small
    - `RIVAL: {rivalName} — target {rivalWpm} WPM` — right-aligned on same line
    - Controls: `[Restart] • [Recalibrate]` — small, far right

    **Pre-game "waiting" state**:
    - When `gameStarted === false` (new prop from useSimpleDuel): show a pulsing message over the hero word zone: "▶ TYPE TO BEGIN"
    - Word should be visible but slightly dimmed until first keypress

    Add `gameStarted: boolean` to `ModernDuelArenaProps` (received from `useSimpleDuel`).

    AVOID: Removing `rivalStats.activeWordText` display entirely — keep it small in the ambient stats bar.
    AVOID: Shrinking the hero word below 60px on mobile — use `text-5xl` as minimum.
  </action>
  <verify>
    - Hero word is visually dominant (80px+ on desktop)
    - Race strip is compact and clear
    - Stats bar does not compete visually with the word
    - "TYPE TO BEGIN" overlay shows before first keypress
    - `npx tsc --noEmit` exits 0
  </verify>
  <done>
    - Single unified race strip rendered
    - Hero word 7xl/8xl on desktop
    - Ambient stats bar bottom
    - Pre-game overlay functional
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] Visual hierarchy: word > progress > stats
- [ ] Header shows profile username
- [ ] No cramped UI elements — all have ≥16px gap/padding between them
- [ ] "TYPE TO BEGIN" shows before first keypress
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` succeeds
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `git add -A && git commit -m "feat(ui): major layout overhaul — word as hero, spacious layout, unified race strip"`
- [ ] Git push: `git push`
</success_criteria>
