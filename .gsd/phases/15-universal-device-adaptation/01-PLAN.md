---
phase: 15
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/engine/deviceDetector.ts
  - src/engine/useDeviceProfile.ts
  - src/components/DeviceBadge.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Hardware detection engine accurately probes WebGL GPU, maxTouchPoints, and pointer media queries to determine true physical device form factor."
    - "Anti-spoofing logic unmasks spoofed user agents by detecting discrepancies between claimed OS/device and underlying GPU/pointer hardware."
    - "DeviceBadge displays detected device profile in the terminal header with an interactive hardware telemetry popover and input mode selector."
  artifacts:
    - "src/engine/deviceDetector.ts"
    - "src/engine/useDeviceProfile.ts"
    - "src/components/DeviceBadge.tsx"
---

# Plan 15.1: Anti-Spoof Hardware & Device Probing Engine

<objective>
Implement a robust, hardware-level device detection engine that determines the true device category (mobile, tablet, desktop, foldable) regardless of user-agent or viewport spoofing, and expose real-time hardware telemetry and device status in the terminal UI.

Purpose: Solve the user's primary requirement: detect the real physical device being used (unmasking UA or viewport spoofing via GPU, touch points, and hardware capabilities) so the application can intelligently adapt its input and rendering pipelines.
Output: Device detector utility, React hook, and cybernetic DeviceBadge component with telemetry popover.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/components/TerminalViewport.tsx
</context>

<tasks>

<task type="auto">
  <name>Create Hardware-Level Device & Anti-Spoof Detector</name>
  <files>src/engine/deviceDetector.ts</files>
  <action>
    Implement `detectDeviceProfile()` in `src/engine/deviceDetector.ts`:
    - Probe WebGL unmasked GPU vendor and renderer using `WEBGL_debug_renderer_info` on a temporary offscreen canvas. Detect Apple Silicon/A-series GPU, Qualcomm Adreno, ARM Mali, PowerVR vs desktop NVIDIA GeForce, AMD Radeon, Intel Arc/Iris/UHD.
    - Probe hardware touch capabilities via `navigator.maxTouchPoints` and `'ontouchstart' in window`.
    - Probe pointer and hover media queries via `window.matchMedia('(pointer: coarse)')`, `(pointer: fine)`, `(hover: hover)`, and `(hover: none)`.
    - Probe High-Entropy User-Agent Client Hints (`navigator.userAgentData?.getHighEntropyValues(['model', 'platform', 'platformVersion', 'architecture'])`) if available.
    - Resolve iPadOS spoofing: iPadOS Safari sends Mac desktop UA (`Macintosh; Intel Mac OS X...`), but `navigator.maxTouchPoints > 1` definitively reveals an iPad tablet.
    - Implement anti-spoof checks:
      1. Mobile UA claimed but WebGL GPU is desktop NVIDIA/AMD/Direct3D.
      2. Mac desktop UA claimed but touch points > 1 (unmasked iPad).
      3. Desktop UA claimed but primary pointer is coarse touch and hover is none.
    - Return structured `DeviceProfile`:
      `category`: 'mobile' | 'tablet' | 'desktop' | 'foldable' | 'unknown'
      `os`: 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'cros' | 'unknown'
      `formFactor`: string (e.g. 'Apple iPhone', 'iPad Pro / Tablet', 'Android Device', 'Windows PC', 'Mac Desktop')
      `gpuVendor`: string
      `gpuRenderer`: string
      `touchPoints`: number
      `pointerType`: 'coarse' | 'fine' | 'none'
      `hoverSupported`: boolean
      `isSpoofed`: boolean
      `spoofReasons`: string[]
      `confidence`: number (0-100)

    AVOID: External heavy user-agent parsing libraries. Use browser native APIs only (YAGNI / standard library directive).
  </action>
  <verify>npm run build</verify>
  <done>src/engine/deviceDetector.ts exports detectDeviceProfile with full type definitions and anti-spoof logic.</done>
</task>

<task type="auto">
  <name>Create useDeviceProfile React Hook with Dynamic Keyboard Detection</name>
  <files>src/engine/useDeviceProfile.ts</files>
  <action>
    Implement `useDeviceProfile()` hook in `src/engine/useDeviceProfile.ts`:
    - Run `detectDeviceProfile()` on mount.
    - Listen for `resize`, `orientationchange`, and `visualViewport` events to dynamically update orientation and geometry.
    - Track active input mode: `'virtual' | 'physical' | 'hybrid'`.
    - Detect physical external keyboard: if physical `keydown` events are received while device is mobile/tablet, dynamically flag `hasExternalKeyboard = true`.
    - Provide `setInputModeOverride(mode: 'auto' | 'virtual' | 'physical')` for manual player preference.
    - Export reactive state: `profile`, `isMobile`, `isTablet`, `isDesktop`, `isTouchPrimary`, `activeInputMode`, `hasExternalKeyboard`, and `setInputModeOverride`.
  </action>
  <verify>npm run build</verify>
  <done>useDeviceProfile provides real-time reactive device state and input mode management.</done>
</task>

<task type="auto">
  <name>Create Cybernetic DeviceBadge & Telemetry Popover</name>
  <files>src/components/DeviceBadge.tsx</files>
  <action>
    Create `src/components/DeviceBadge.tsx`:
    - Render a compact cybernetic badge for the terminal header: e.g. `[📱 IPHONE // TOUCH]` or `[📟 IPAD // BT KEYBOARD]` or `[💻 PC // MECHANICAL]`.
    - On click, toggle a hardware telemetry popover modal showing:
      - Detected Device & OS
      - Hardware GPU Renderer (unmasked)
      - Max Touch Points & Primary Pointer
      - Anti-Spoof Authenticity Status (`[AUTHENTIC HARDWARE]` or `[SPOOF DETECTED: <reasons>]`)
      - Active Input Mode toggle (`Auto`, `Virtual Keyboard`, `Physical Keyboard`)
    - Style with phosphor borders, mono typography, and `:focus-visible` accessibility.
  </action>
  <verify>npm run build</verify>
  <done>DeviceBadge renders in the UI with interactive hardware telemetry popover.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` compiles with zero TypeScript errors.
- [ ] `detectDeviceProfile()` accurately identifies device category and flags spoofing discrepancies.
- [ ] DeviceBadge renders in the terminal viewport with hardware telemetry details.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
