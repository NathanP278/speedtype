---
phase: 5
plan: 5
wave: 3
depends_on: [5.1, 5.2, 5.3, 5.4]
files_modified:
  - src/styles/crt.css
  - src/styles/modern.css
  - src/components/MenuPanel.tsx
  - src/components/CombatHud.tsx
  - src/App.tsx
  - src/index.css
  - tailwind.config.js
autonomous: true
user_setup: []

must_haves:
  truths:
    - "All modal/panel entry and exit are animated with CSS @starting-style + transition-behavior:allow-discrete (no JS-driven show/hide classes)"
    - "MenuPanel uses scroll-snap drawer pattern OR CSS top-layer popover animation -- smooth slide-in from right with backdrop fade"
    - "Buttons have physics-based spring hover using linear() CSS easing -- no jarring snap transitions"
    - "Stance selector pills animate active-indicator using CSS individual transform properties (scale + translate)"
    - "Mode cards on idle screen animate in with sibling-index() stagger -- each card fades up with sequential delay"
    - "KO Signature stamp uses View Transitions API (document.startViewTransition) to morph from in-match -> result screen"
    - "CRT noise texture applied via CSS gradient mask (no external image files) -- zero asset latency preserved"
    - "JetBrains Mono loaded via Google Fonts with font-display:swap and preconnect -- system monospace fallback"
    - "All animations gated by prefers-reduced-motion (motion OFF = instant, no animation)"
    - "focus-visible outlines use 2px solid theme color with 2px offset on all interactive elements"
  artifacts:
    - "src/styles/modern.css exists with all new design tokens, spring easings, button/focus styles"
    - "JetBrains Mono @import present in index.css"
    - "tailwind.config.js has spring, bounce, fade-up keyframes and linear() easing utilities"
---

# Plan 5.5: Modern Web Design Layer

<objective>
The game has a CRT/retro aesthetic but uses no modern CSS capabilities: zero physics-based easing, no View Transitions, no @starting-style entry animations, no CSS individual transforms, no font loading strategy, no noise texture, basic focus states.

This plan layers modern web design standards ON TOP of the retro aesthetic -- the CRT vibe stays, but every interaction, transition, button, and animation now feels crafted and intentional.

Design philosophy: "Vintage hardware, modern firmware." Phosphor glow, but with spring-loaded buttons and silky-smooth panel slides.

Purpose: Elevate perceived quality from "built quickly" to "built with care."
Output: modern.css design system, physics-based spring/bounce CSS variables, @starting-style modal animations,
        JetBrains Mono font loading, CSS noise texture, View Transition KO screen, focus-visible system.
</objective>

<context>
Load for context:
- src/styles/crt.css
- src/styles/palettes.ts
- src/index.css
- tailwind.config.js
- src/components/MenuPanel.tsx
- src/components/CombatHud.tsx
- src/components/KoSignatureStamp.tsx
- src/App.tsx (idle + match arena sections)
- .gsd/phases/5-ux-simplification/01-PLAN.md (MenuPanel spec)
- .gsd/phases/5-ux-simplification/02-PLAN.md (CombatHud stance pills spec)
</context>

<tasks>

<task type="auto">
  <name>Create modern.css design system with spring easings, buttons, focus, texture</name>
  <files>
    src/styles/modern.css
    src/index.css
  </files>
  <action>
    Create src/styles/modern.css. Import it in src/index.css AFTER crt.css import.

    SECTION 1 -- PHYSICS-BASED EASING CUSTOM PROPERTIES
    (linear() is Baseline widely available since 2023-12-11 -- no fallback needed beyond ease-out)
    Define as CSS custom properties on :root so they work everywhere:

    :root {
      --spring: linear(0, 0.016 0.5%, 0.06 1%, 0.226 2%, 1.116 5.4%, 1.375 6.6%,
        1.527 7.7%, 1.565 8.2%, 1.585 8.8%, 1.581 9.3%, 1.559 9.8%, 1.458 10.9%,
        0.937 14.3%, 0.784 15.5%, 0.693 16.6%, 0.67 17.1%, 0.657 17.7%, 0.671 18.7%,
        0.729 19.8%, 1.042 23.3%, 1.13 24.5%, 1.182 25.6%, 1.201 26.7%, 1.192 27.7%,
        1.156 28.8%, 0.977 32.2%, 0.925 33.4%, 0.894 34.5%, 0.882 35.6%, 0.887 36.6%,
        0.907 37.7%, 1.045 42.4%, 1.069 44.5%, 1.059 46.3%, 0.979 50.9%, 0.96 53.4%,
        0.966 55.3%, 1.013 59.9%, 1.024 62.3%, 0.986 71.2%, 1.008 79.9%, 0.995 88.9%, 1);
      --bounce: linear(0, 0.214 14.7%, 0.386 23.7%, 0.598 31.9%, 0.999 44.7%,
        0.807 52.6%, 0.762 56%, 0.747 59.4%, 0.758 62.4%, 0.793 65.6%, 0.999 77.4%,
        0.961 81.2%, 0.949 84.8%, 0.956 88%, 0.993 95.5%, 1);
      --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
      --ease-snappy: cubic-bezier(0.25, 0, 0, 1);
    }

    SECTION 2 -- BUTTON BASE SYSTEM
    All buttons in the game should use these styles. Apply via .btn-base class and variants.

    .btn-base {
      /* Individual transform properties: MANDATORY identity baseline to prevent stacking context shifts */
      translate: 0px;
      scale: 1;
      /* Spring hover lift */
      transition:
        scale 0.4s var(--spring),
        translate 0.2s var(--ease-snappy),
        box-shadow 0.2s ease-out,
        background-color 0.15s ease-out,
        border-color 0.15s ease-out,
        color 0.15s ease-out;
      cursor: pointer;
      position: relative;
      outline: none;
    }

    .btn-base:hover {
      scale: 1.03;
      translate: 0 -1px;
    }

    .btn-base:active {
      scale: 0.97;
      translate: 0 1px;
      transition-duration: 0.1s;
    }

    /* Focus-visible: WCAG AA - visible keyboard focus on all interactive elements */
    .btn-base:focus-visible {
      outline: 2px solid var(--theme-text);
      outline-offset: 2px;
    }

    /* Global focus-visible fallback for any button without .btn-base */
    button:focus-visible,
    [role="button"]:focus-visible,
    a:focus-visible {
      outline: 2px solid var(--theme-text);
      outline-offset: 2px;
    }

    .btn-primary {
      /* Main CTA: theme-colored background, black text, spring scale */
      background-color: var(--theme-text);
      color: #000;
      box-shadow: 0 0 12px var(--theme-dim);
    }
    .btn-primary:hover {
      box-shadow: 0 0 20px var(--theme-text);
    }

    .btn-ghost {
      background: transparent;
      border: 1px solid #3f3f46; /* zinc-700 */
      color: #a1a1aa; /* zinc-400 */
    }
    .btn-ghost:hover {
      border-color: var(--theme-text);
      color: var(--theme-text);
      box-shadow: 0 0 8px var(--theme-dim);
    }

    SECTION 3 -- MODAL / PANEL ENTRY-EXIT ANIMATIONS
    Uses @starting-style + transition-behavior:allow-discrete (Baseline since 2024-08-06)
    Uses popover::backdrop animation for overlay fade

    /* MenuPanel as a popover -- see MenuPanel.tsx task for HTML change */
    .menu-panel {
      opacity: 1;
      translate: 0 0;
      /* Animate display + overlay for top-layer elements */
      transition-property: opacity, translate, display, overlay;
      transition-duration: 0.25s;
      transition-timing-function: var(--ease-snappy);
      transition-behavior: allow-discrete;
    }

    /* Exit state (closed / not popover-open): slide right + fade */
    .menu-panel:not(:popover-open) {
      opacity: 0;
      translate: 100% 0;
    }

    /* Entry state: start from right-shifted + transparent */
    @starting-style {
      .menu-panel:popover-open {
        opacity: 0;
        translate: 100% 0;
      }
    }

    /* Backdrop fade for MenuPanel popover */
    .menu-panel::backdrop {
      background: rgba(0, 0, 0, 0);
      transition: display 0.25s allow-discrete, overlay 0.25s allow-discrete, background 0.25s ease-out;
    }
    .menu-panel:popover-open::backdrop {
      background: rgba(0, 0, 0, 0.5);
      @starting-style {
        background: rgba(0, 0, 0, 0);
      }
    }

    /* Same pattern for BlackMarketModal, RivalryDossierModal etc -- they use fixed+backdrop div,
       so apply a .modal-overlay entry/exit class pair: */
    .modal-overlay {
      opacity: 1;
      scale: 1;
      transition: opacity 0.2s ease-out, scale 0.2s var(--spring);
    }
    .modal-overlay[data-closing] {
      opacity: 0;
      scale: 0.96;
    }
    @starting-style {
      .modal-overlay {
        opacity: 0;
        scale: 0.96;
      }
    }

    SECTION 4 -- STAGGER ANIMATION for idle mode cards
    (sibling-index() Baseline since 2026-08-18 -- use JS fallback via inline style --si)

    .stagger-child {
      opacity: 0;
      translate: 0 12px;
      animation: fade-up 0.4s var(--ease-out-back) forwards;
      /* sibling-index() with --sibling-index fallback */
      animation-delay: calc(var(--sibling-index, 0) * 0.08s);
      animation-delay: calc(sibling-index() * 0.08s);
    }

    @keyframes fade-up {
      to { opacity: 1; translate: 0 0; }
    }

    SECTION 5 -- CSS NOISE TEXTURE (no external image, pure gradient)
    Applied to the main viewport body area to give CRT phosphor grain feel.
    Uses repeating gradient to simulate static noise without any image files:

    .crt-noise {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 49;
      opacity: 0.035;
      background-image:
        url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 200px 200px;
    }

    SECTION 6 -- INDIVIDUAL TRANSFORM STANCE PILL ACTIVE INDICATOR
    Stance pills use scale + a ::before sliding background indicator:

    .stance-pill {
      position: relative;
      scale: 1;
      translate: 0px;
      transition:
        scale 0.35s var(--spring),
        color 0.15s ease-out,
        border-color 0.15s ease-out;
    }
    .stance-pill:hover { scale: 1.06; }
    .stance-pill[data-active="true"] {
      scale: 1.08;
    }
    .stance-pill:active { scale: 0.95; }

    SECTION 7 -- REDUCED MOTION OVERRIDE (MANDATORY)
    @media (prefers-reduced-motion: reduce) {
      .btn-base,
      .stance-pill,
      .menu-panel,
      .modal-overlay,
      .stagger-child {
        transition: none !important;
        animation: none !important;
        scale: 1 !important;
        translate: none !important;
        opacity: 1 !important;
      }
      /* Preserve basic display transitions for popover open/close */
      .menu-panel {
        transition-property: display, overlay;
        transition-duration: 0.1s;
        transition-behavior: allow-discrete;
      }
    }

    --- In src/index.css:
    Add BEFORE tailwind @tailwind directives:
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
    (Also add <link rel="preconnect" href="https://fonts.googleapis.com"> in index.html)

    Add AFTER @tailwind base / components / utilities:
    @import './styles/modern.css';

    Also update font-mono in tailwind.config.js to put JetBrains Mono first:
    fontFamily: { mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'] }

    Add to index.html <head>:
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    AVOID: adding any third-party JS animation library. Pure CSS only.
    AVOID: using external image files for noise -- the inline SVG data URI is self-contained.
  </action>
  <verify>
    npx tsc --noEmit (0 errors -- no TS in CSS but check index.css import order).
    Dev server: JetBrains Mono loads (check Network tab, font request to fonts.gstatic.com).
    Buttons show spring hover (scale overshoots slightly past 1.03).
    All buttons show 2px theme-color focus-visible outline on Tab key.
    CRT noise layer visible as subtle grain over black background.
  </verify>
  <done>
    modern.css exists with all 7 sections. JetBrains Mono in tailwind font stack.
    Spring/bounce CSS vars defined. Focus-visible system global. Noise texture layer present.
    All animations gated by prefers-reduced-motion.
  </done>
</task>

<task type="auto">
  <name>Wire MenuPanel as native popover + apply btn-base classes to all buttons</name>
  <files>
    src/components/MenuPanel.tsx
    src/components/CombatHud.tsx
    src/App.tsx
    index.html
  </files>
  <action>
    MenuPanel.tsx -- convert to popover pattern:
    - Add popover="manual" attribute to the root div (via React's popover prop -- React 19 supports popover attribute natively).
    - Add ref to the div. When isOpen changes: if isOpen, panelRef.current.showPopover(); else panelRef.current.hidePopover().
    - Apply className="menu-panel" to the root div (gets CSS slide-in from modern.css).
    - Remove the translate-x-full / translate-x-0 manual Tailwind animation approach.
    - Remove the backdrop overlay div -- the ::backdrop CSS pseudo handles it.
    - Keep all nav links + display toggles + KP wallet inside as before.
    - Apply "btn-base btn-ghost" classes to all nav row buttons inside the panel.
    - Escape key: document.addEventListener('keydown', e => e.key==='Escape' && onClose()) in useEffect.
    - Backdrop click: attach onClick to the panel root itself; if event.target === panelRef.current call onClose().

    CombatHud.tsx -- apply modern classes to stance pills:
    - Add className="stance-pill btn-base" to each stance button.
    - Add data-active={isSelected ? "true" : "false"} attribute.
    - Remove box-shadow inline style (CSS handles it via .stance-pill[data-active]).
    - Keep color style prop for the stance color -- it drives the border and text.

    App.tsx -- apply btn-base to primary buttons:
    - [ENTER COMBAT] button: add "btn-base btn-primary" to className.
    - [GHOST DUEL] and [WEEKLY TRIAL] mode cards: add "btn-base btn-ghost" to className.
    - [REMATCH] button in KoSignatureStamp: add "btn-base btn-primary".

    Add .stagger-child class to each mode card div in the idle screen JSX:
    <div className="stagger-child" style={{ '--sibling-index': 1 } as React.CSSProperties}>...QUICK MATCH...</div>
    <div className="stagger-child" style={{ '--sibling-index': 2 } as React.CSSProperties}>...GHOST DUEL...</div>
    <div className="stagger-child" style={{ '--sibling-index': 3 } as React.CSSProperties}>...WEEKLY TRIAL...</div>

    Also add sibling-index() JS fallback in App.tsx via useEffect:
    useEffect(() => {
      if (!CSS.supports('animation-delay: calc(sibling-index() * 0.1s)')) {
        // already handled via inline --sibling-index style props above, no-op
      }
    }, []);

    index.html -- add font preconnect:
    In <head>, BEFORE the existing <link> or <script> tags:
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    Also add .crt-noise div inside TerminalViewport.tsx INSIDE the <main> element
    (AFTER the existing canvas layers, z-49 so it sits above content but below modals):
    <div className="crt-noise" aria-hidden="true" />

    AVOID: using the deprecated popover polyfill -- this app targets modern browsers.
    AVOID: changing any combat logic. Only className additions and popover wiring.
    AVOID: removing existing Tailwind classes -- only add btn-base / btn-ghost / btn-primary alongside them.
  </action>
  <verify>
    npx tsc --noEmit (0 errors).
    Dev server:
    - [MENU] button click: panel slides in from right with backdrop fade. Escape key closes it.
    - Clicking backdrop area (outside panel) closes it.
    - Stance pills spring-scale on hover; active pill scale: 1.08.
    - [ENTER COMBAT] button springs on hover with outer theme-color glow.
    - Idle screen mode cards fade-up sequentially with ~80ms stagger.
    - CRT noise grain visible as subtle overlay.
  </verify>
  <done>
    MenuPanel uses popover attribute with CSS-driven slide animation.
    All primary buttons have spring hover + focus-visible outline.
    Stance pills have data-active spring state.
    Idle mode cards stagger in on mount.
    CRT noise layer rendered in TerminalViewport.
  </done>
</task>

<task type="auto">
  <name>View Transition for KO result screen + match state transitions</name>
  <files>
    src/components/KoSignatureStamp.tsx
    src/App.tsx
  </files>
  <action>
    Apply View Transitions API to the most impactful state change: match in_progress -> victory/defeat.

    KoSignatureStamp.tsx -- wrap result display in a named transition element:
    - Add view-transition-name: ko-stamp to the root container div via inline style.
    - This allows it to morph from its initial position.

    App.tsx -- wrap matchStatus changes in startViewTransition:
    The matchStatus is driven by useCombatCoordinator. When it transitions from 'in_progress' to 'victory'/'defeat',
    the KO stamp appears.

    In the combat coordinator's onMatchEnd callback (which lives in useMatchSession after Plan 5.1),
    wrap any React state setter that triggers the KO display with:

    const showResult = () => {
      // ... existing match end state update ...
    };

    if (document.startViewTransition) {
      document.startViewTransition(showResult);
    } else {
      showResult();
    }

    Add to modern.css (or crt.css):
    /* KO stamp View Transition */
    ::view-transition-old(ko-stamp) {
      animation: 0.3s ease-in both vt-fade-scale-out;
    }
    ::view-transition-new(ko-stamp) {
      animation: 0.4s var(--spring) both vt-stamp-in;
    }
    @keyframes vt-fade-scale-out {
      to { opacity: 0; scale: 0.9; }
    }
    @keyframes vt-stamp-in {
      from { opacity: 0; scale: 0.85; }
    }

    @media (prefers-reduced-motion: reduce) {
      ::view-transition-group(*),
      ::view-transition-old(*),
      ::view-transition-new(*) {
        animation: none !important;
      }
    }

    AVOID: wrapping rapid match tick state updates in startViewTransition -- only the match-END transition.
    AVOID: adding view-transition-name to elements that have active CSS animations (they would freeze).
    The View Transitions API is progressive enhancement -- if browser doesn't support it (older),
    the check !document.startViewTransition makes it fall back to instant state update (no crash).
  </action>
  <verify>
    npx tsc --noEmit (0 errors).
    Dev server: win a match. The KO stamp element morphs in with a spring-scale entrance.
    Inspect DevTools -> Animations panel: see vt-stamp-in animation firing on KO.
    In Firefox (if available) or with startViewTransition disabled: instant KO display, no crash.
  </verify>
  <done>
    KoSignatureStamp has view-transition-name. Match end wrapped in document.startViewTransition.
    KO screen springs in with vt-stamp-in animation. Fallback works in unsupported browsers.
    prefers-reduced-motion disables all view transition animations.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] npx tsc --noEmit exits 0
- [ ] JetBrains Mono renders in game (check inspector: font-family shows JetBrains Mono)
- [ ] All buttons: spring-scale on hover (overshoot slightly past 1.03x), snap on active
- [ ] All buttons: 2px solid theme-color focus-visible outline visible on Tab key
- [ ] [MENU] panel: slides from right with backdrop fade -- CSS @starting-style, no JS class toggle
- [ ] Idle mode cards: sequential stagger fade-up (80ms apart)
- [ ] Stance pills: spring-scale active (1.08x) vs inactive (1.0x)
- [ ] CRT noise grain: subtle texture overlay visible over black background
- [ ] KO stamp: morphs in with spring entrance animation
- [ ] prefers-reduced-motion: open DevTools -> Rendering -> Emulate reduced motion -> all animations instant
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Zero TypeScript errors
- [ ] No external JS animation libraries added (pure CSS)
</success_criteria>
