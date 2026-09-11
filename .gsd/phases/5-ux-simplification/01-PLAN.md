---
phase: 5
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/engine/useMatchSession.ts
  - src/App.tsx
  - src/components/TerminalViewport.tsx
  - src/components/MenuPanel.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "App.tsx is <= 200 lines — all match lifecycle logic lives in useMatchSession"
    - "TerminalViewport header has exactly one navigation button: [MENU]"
    - "MenuPanel contains Black Market, Dossier, Tournament, Trials links plus CRT/scanline toggles"
    - "Palette switcher removed from header (accessible only via Black Market)"
  artifacts:
    - "src/engine/useMatchSession.ts exists and exports useMatchSession hook"
    - "src/components/MenuPanel.tsx exists with slide-in panel UI"
    - "App.tsx imports useMatchSession"
---

# Plan 5.1: Navigation Collapse & App.tsx Extraction

<objective>
App.tsx is a 526-line god component with interleaved match lifecycle, ghost recording, KP economy, blind duel timers, and 5 modal toggles. The TerminalViewport header crams 7+ buttons + a palette selector into a 40px chrome bar.

This plan extracts match session concerns out of App.tsx and collapses the cluttered nav into a single [MENU] button backed by a slide-in panel.

Purpose: Eliminate cognitive overload at the chrome layer. Players should see the game, not a terminal control panel.
Output: useMatchSession.ts hook, MenuPanel.tsx component, slimmed App.tsx (<=200 lines), simplified TerminalViewport header.
</objective>

<context>
Load for context:
- src/App.tsx
- src/components/TerminalViewport.tsx
- src/economy/useEconomy.ts
- src/social/ghostRecorder.ts
- src/trials/weeklyTrials.ts
</context>

<tasks>

<task type="auto">
  <name>Extract useMatchSession hook</name>
  <files>src/engine/useMatchSession.ts</files>
  <action>
    Create useMatchSession that encapsulates everything in App.tsx that is NOT combat rendering:
    - Ghost recorder lifecycle (start, recordKeystroke, stop, persist personal best)
    - KP awarding on match end (delegates to economy.awardKp)
    - Dossier update on match end (delegates to recordMatchInDossier)
    - Blind duel flash timer (isWordFlashing) and revealedWord state
    - activeTrial state + setActiveTrial
    - lastOpponentRef + opponentNameRef
    - dossier state

    Hook returns:
      activeTrial, setActiveTrial, isWordFlashing, revealedWord,
      lastOpponentRef, opponentNameRef, onMatchEnd, onCorrectChar,
      onMistype, onWordComplete, dossier,
      lastPlayerGhost, personalBestGhost

    AVOID: re-implementing economy or combat — only coordinate them via passed-in callbacks.
    AVOID: any JSX.
    Use useRef for timers; clear in cleanup (return () => clearTimeout) to prevent memory leaks.
    Accept economy object (from useEconomy) as parameter.
    Accept debrisCanvasRef + trailsCanvasRef as parameters for the onCorrectChar trail trigger.
  </action>
  <verify>npx tsc --noEmit (0 errors)</verify>
  <done>useMatchSession compiles and exports a stable hook. App.tsx can import and call it without duplicating any timer or callback logic.</done>
</task>

<task type="auto">
  <name>Collapse navigation + create MenuPanel</name>
  <files>
    src/components/MenuPanel.tsx
    src/components/TerminalViewport.tsx
  </files>
  <action>
    MenuPanel.tsx:
    - Fixed right panel, full height, w-56, z-[60], bg-zinc-950 border-l border-zinc-800
    - Translates in from the right: "translate-x-full" when closed -> "translate-x-0" when open, transition-transform duration-200
    - Backdrop: fixed inset-0 z-[59] bg-black/40 that closes panel on click
    - Escape key closes panel
    - Sections:
      1. Header row: "MENU" title + [X] close button
      2. Nav links (each full-width button): [BLACK MARKET], [DOSSIER], [TOURNAMENT], [TRIALS]
         Each calls its onOpen* prop then calls onClose
      3. Divider
      4. Display section: CRT toggle row (label + toggle), Scanlines toggle row
      5. Bottom: KP wallet display (balance + KP label)
    - Props: isOpen, onClose, onOpenMarket, onOpenDossier, onOpenTournament, onOpenTrials,
             crtEnabled, onToggleCrt, scanlinesEnabled, onToggleScanlines, kpBalance

    TerminalViewport.tsx:
    - REMOVE: palette switcher buttons (amber/lime/magenta/ice row)
    - REMOVE: onSelectPalette prop
    - REMOVE: [BLACK MARKET], [DOSSIER], [TOURNAMENT], [TRIALS] buttons from header
    - REMOVE: standalone CRT and LINES toggle buttons from header
    - ADD: menuOpen local state (useState false)
    - ADD: single [MENU] button top-right that sets menuOpen(true)
    - ADD: <MenuPanel> inside TerminalViewport with all nav handlers threaded through
    - KEEP: SPEEDTYPE // logo left side
    - KEEP: KP wallet display (compact, right of logo area but left of [MENU])
    - KEEP: WPM bloom reactive glow useEffect
    - SIMPLIFY footer: left="SPEEDTYPE // COMBAT", right="[TAB] STANCE  [ESC] MENU"

    AVOID: moving crtEnabled/scanlinesEnabled out of TerminalViewport scope.
    crtEnabled/scanlinesEnabled state stays in TerminalViewport; pass as props into MenuPanel.
  </action>
  <verify>
    npx tsc --noEmit (0 errors).
    Dev server: header shows only logo + KP + [MENU].
    Clicking [MENU] opens right panel with all nav items + display toggles.
    Clicking backdrop or [X] closes panel.
  </verify>
  <done>Header reduced to 3 visual elements. All modal navigation accessible via MenuPanel. Footer one line each side.</done>
</task>

<task type="auto">
  <name>Slim App.tsx to orchestrator only</name>
  <files>src/App.tsx</files>
  <action>
    Rewrite App.tsx using useMatchSession. Target <=200 lines.

    App.tsx responsibilities after:
    1. Instantiate hooks: useEconomy, useMatchSession(economy, canvasRefs), useCombatCoordinator, useTypingEngine, useStanceManager
    2. Wire: pass session.onMatchEnd into useCombatCoordinator, pass session.onCorrectChar/onMistype/onWordComplete into useTypingEngine
    3. Render JSX: TerminalViewport > CombatHud > KineticBeamDisplay > word arena > KoSignatureStamp > modals
    4. Render canvas layers

    Remove directly from App.tsx:
    - All timer refs (flashTimerRef, revealTimerRef) -> useMatchSession
    - dossier state -> useMatchSession
    - lastPlayerGhost, personalBestGhost, ghostRecorderRef -> useMatchSession
    - lastOpponentRef, opponentNameRef -> useMatchSession
    - activeTrial, isWordFlashing, revealedWord -> useMatchSession
    - handleMatchEnd callback -> useMatchSession
    - Ghost recorder onCorrectChar/onMistype/onWordComplete logic -> useMatchSession

    App.tsx still owns:
    - combat (useCombatCoordinator) - drives JSX state
    - typing (useTypingEngine) - drives character rendering
    - stance (useStanceManager)
    - debrisCanvasRef, trailsCanvasRef
    - marketOpen, ghostOpen (UI-only toggles)

    AVOID: changing any engine or combat logic. Pure structural extraction.
    AVOID: touching TerminalViewport props signature -- it was already refactored in the previous task.
  </action>
  <verify>
    npx tsc --noEmit (0 errors).
    wc -l src/App.tsx shows <=200 lines.
    Full match plays end-to-end: typing -> beam push -> KO -> KP award -> dossier update.
  </verify>
  <done>App.tsx <=200 lines. All existing functionality preserved. Ghost recording, KP economy, dossier all operational.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] npx tsc --noEmit exits 0
- [ ] Header: logo left, KP + [MENU] right -- nothing else visible
- [ ] [MENU] panel slides in from right with all nav + display toggles
- [ ] App.tsx line count <=200
- [ ] Full match plays: word -> beam push -> KO -> KP award -> dossier update
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Zero TypeScript errors
</success_criteria>
