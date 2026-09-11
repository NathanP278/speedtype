---
phase: 5
plan: 4
wave: 2
depends_on: [5.1]
files_modified:
  - src/App.tsx
  - src/styles/palettes.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Idle start screen has a clean 3-mode selector: Quick Match, Ghost Duel, Trials"
    - "No dense paragraph of system-speak on the start screen"
    - "Mode descriptions are 1-line, plain language (not combat jargon)"
    - "Palettes define exactly 3 gray levels: background (zinc-950), surface (zinc-900), muted (zinc-700)"
    - "Design tokens documented in palettes.ts as a comment block for developer reference"
  artifacts:
    - "Idle screen JSX in App.tsx renders mode cards, not a text blob + 2 buttons"
    - "palettes.ts has gray-scale token comment block"
---

# Plan 5.4: Idle Screen Redesign & Visual Hierarchy

<objective>
The idle start screen currently shows a dense paragraph ("Master the Stance Triangle: Strike for burst damage, Counter for absorption shields, and Disrupt to scramble the rival interface.") with two flat buttons. It reads like documentation, not a game invitation.

The codebase uses 6+ intermediate zinc gray levels (950, 900, 800, 700, 600, 500, 400) with no documented hierarchy, creating muddy undefined contrast relationships.

Purpose: Inviting start screen, documented color system.
Output: 3-mode selector start screen (Quick Match, Ghost Duel, Trials). Gray token comment block in palettes.ts.
</objective>

<context>
Load for context:
- src/App.tsx (idle section, roughly lines 299-331 in original, adjusted for Plan 5.1 extraction)
- src/styles/palettes.ts
- src/engine/useMatchSession.ts (activeTrial from session hook)
</context>

<tasks>

<task type="auto">
  <name>Redesign idle start screen with mode selector</name>
  <files>src/App.tsx</files>
  <action>
    Replace the idle state JSX block with a 3-card mode selector layout.

    LAYOUT: centered column, max-w-sm, gap-3

    HEADER:
    - Game name: "SPEEDTYPE" in large font (text-2xl, theme color, glow-subtle, tracking-widest)
    - Tagline: "Type to fight. Speed is damage." in zinc-400 text-sm
    - No lengthy paragraph.

    MODE CARDS (3 items, each a clickable button card):
    1. QUICK MATCH
       - Icon: ">" or a simple ASCII arrow
       - Label: "QUICK MATCH" bold theme-text
       - Description: "Face a bot opponent. First to KO wins." zinc-400 text-xs
       - onClick: startNewMatch() (same as before)
       - Style: primary action -- full border in theme color with dim glow

    2. GHOST DUEL
       - Icon: "~" or a ghost-like char
       - Label: "GHOST DUEL" bold zinc-200
       - Description: "Race your past runs or challenge bot replays." zinc-400 text-xs
       - onClick: setGhostOpen(true) (same as before)
       - Style: secondary -- zinc-800 border, hover lifts to zinc-600

    3. WEEKLY TRIAL (conditional -- only show if activeTrial exists OR as a teaser)
       - Icon: "!" 
       - Label: activeTrial ? activeTrial.name : "WEEKLY TRIAL" bold zinc-200
       - Description: activeTrial ? "+{activeTrial.kpBounty} KP BOUNTY ACTIVE" : "No active trial. Check the menu." zinc-400 text-xs
       - onClick: activeTrial ? startNewMatch() : setTrialsOpen(true)
       - Style: secondary -- purple-900/30 border border-purple-800, hover border-purple-600

    BOTTOM ROW (very small, zinc-500 text-[11px]):
    - "KP: {kpBalance}" left-aligned
    - No other footer clutter

    AVOID: removing ghost/trial prop threading -- it is all still wired through session and combat hooks.
    AVOID: changing any combat start logic.
    The existing activeTrial state from useMatchSession (or however it is exposed after 5.1) drives card 3.
  </action>
  <verify>
    npx tsc --noEmit (0 errors).
    Dev server idle state: 3 mode cards visible. No paragraph text. QUICK MATCH starts combat on click.
    GHOST DUEL opens the ghost selector modal.
  </verify>
  <done>Idle screen shows 3 mode cards with 1-line descriptions. Dense paragraph removed. KP balance visible bottom-left.</done>
</task>

<task type="auto">
  <name>Document gray hierarchy as design tokens in palettes.ts</name>
  <files>src/styles/palettes.ts</files>
  <action>
    Add a comment block at the top of palettes.ts documenting the approved gray token hierarchy.
    This is documentation, not code change -- it prevents future developers from reaching for
    arbitrary zinc-X values.

    Add BEFORE the existing imports/exports:

    /**
     * SPEEDTYPE DESIGN TOKEN HIERARCHY
     *
     * Theme colors (via CSS vars, change per palette):
     *   --theme-text:    Primary accent (typed chars, active UI, logo glow)
     *   --theme-glow:    Glow color for text-shadow
     *   --theme-dim:     Dim variant for secondary glow layers
     *   --theme-border:  Border color for active/themed elements
     *
     * Gray scale (FIXED across all palettes -- do NOT reach outside this set):
     *   zinc-950  #09090b  -- page background, deepest layer
     *   zinc-900  #18181b  -- card/surface background
     *   zinc-800  #27272a  -- inactive borders, dividers
     *   zinc-500  #71717a  -- muted labels, secondary text
     *   zinc-200  #e4e4e7  -- primary white text (names, values)
     *
     * FORBIDDEN: zinc-600, zinc-700, zinc-400, zinc-300 -- too many intermediate levels
     * create undefined hierarchy. Grep and replace with the nearest approved level above.
     *
     * Semantic mapping:
     *   Background    -> zinc-950
     *   Surface       -> zinc-900
     *   Border quiet  -> zinc-800
     *   Text muted    -> zinc-500
     *   Text primary  -> zinc-200
     *   Text accent   -> var(--theme-text)
     */

    ALSO: audit existing palettes.ts for any hardcoded gray hex values and align them to the approved
    levels if they differ. Do not change the named CSS variable values themselves -- only the comment doc.

    AVOID: changing any palette color values (amber, lime, magenta, ice). Only documentation + any stray grays in the file itself.
  </action>
  <verify>
    npx tsc --noEmit (0 errors).
    palettes.ts opens and the comment block is present at the top.
    No runtime behavior changes.
  </verify>
  <done>Gray token hierarchy documented at top of palettes.ts. Developer reference exists. No forbidden gray levels in palettes.ts itself.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] npx tsc --noEmit exits 0
- [ ] Idle screen: 3 mode cards, no paragraph text, KP visible
- [ ] QUICK MATCH card starts combat on click
- [ ] GHOST DUEL card opens ghost modal
- [ ] palettes.ts has token hierarchy comment block
- [ ] No zinc-600/700/400/300 in palettes.ts file (grep check)
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Zero TypeScript errors
</success_criteria>
