# Phase 5: UX Simplification & Visual Calm

## Problem Statement
After all 4 phases shipped, player feedback surfaced three systemic problems:

1. **Too complicated** -- App.tsx 526-line god component, 5 modals, 7+ header buttons, 8 HUD stats per combatant visible simultaneously
2. **Too overstimulating** -- glitch-active runs infinite 0.25s loop, overclock beam animate-ping scale-150, 6+ animation layers possible simultaneously, CRT effects on by default
3. **UI/UX looks bad** -- dense info-dump header, no visual hierarchy, idle screen is a documentation paragraph, 6 intermediate gray levels with no defined system

## Scope
No mechanical changes. Combat engine, economy, ghost duels, tournament -- all preserved.
This phase is purely: layout, hierarchy, animation timing, and code structure.

## Wave Structure

### Wave 1 (Plans 5.1 + 5.2 -- parallel, no shared files):
- **Plan 5.1**: App.tsx extraction (useMatchSession hook) + Navigation collapse (MenuPanel)
- **Plan 5.2**: CombatHud minimal redesign + KineticBeam number removal

### Wave 2 (Plans 5.3 + 5.4 -- after Wave 1):
- **Plan 5.3**: CSS animation calm-down + asymmetric word zone layout (depends on 5.1 for App.tsx structure)
- **Plan 5.4**: Idle screen mode-selector + gray token documentation (depends on 5.1 for session hook)

## Key Design Decisions

| Decision | Old | New | Reason |
|----------|-----|-----|--------|
| Header buttons | 7 buttons + palette switcher | [MENU] only | Cognitive overload |
| CRT default | ON | OFF | Opt-in for accessibility |
| HUD stats | WPM, ACC, PARRIES, WORDS live | Post-match only | Focus on typing |
| Stance pills | Full bordered rectangles | Compact rounded-full | Visual weight |
| Beam numbers | -100 to +100 labels + 6 ticks | Bar only | Feel over data |
| glitch-active | 0.25s infinite | 0.6s x3 | Nausea prevention |
| Word cursor | animate-pulse scale-110 | CSS border blink | Less jitter |
| Player vs Opponent words | Equal-size side-by-side | Hero (5xl) vs strip (sm) | Clear primacy |
| Idle screen | Dense paragraph + 2 buttons | 3-mode card selector | Inviting, clear |
| Gray levels | 6 levels (950-400) | 5 defined levels | Clear hierarchy |
