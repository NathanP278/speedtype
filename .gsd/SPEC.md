# SYSTEM SPECIFICATION: SPEEDTYPE COMBAT ENGINE

## 1. Executive Architecture

High-performance, zero-latency typing combat engine built on React, TypeScript, HTML5 2D/WebGL Canvas, and Web Audio API.

```
+-------------------------------------------------------------------------+
|                              SPEEDTYPE                                  |
+-------------------------------------------------------------------------+
|  [Sensory Viewport: CRT Shader | Scanlines | OLED Curvature | Glow]     |
|                                                                         |
|  [Player Zone]           [Tug-of-War Kinetic Beam]      [Opponent Zone] |
|  - Active Word Queue     - Real-time Balance (-100..100) - Active Word  |
|  - Stance Selector       - Baseline KO Thresholds       - Stance State  |
|  - Health / Shield       - Plasma Pulse Shaders         - Health Bar    |
|  - Overclock Streak                                                     |
|                                                                         |
|  [Sensory Layers]                                                       |
|  - Canvas ASCII Debris Particle Physics (Ground bounce, angular spin)   |
|  - Canvas Typing Trails (Matrix Rain, Lightning Arc, Neon Ghost)        |
|  - Web Audio Procedural Mechanical Engine (Thock, Model M, Blip, Click)|
|                                                                         |
|  [Meta Systems]                                                         |
|  - The Black Market (Palettes, Trails, Soundboards, KO Signatures)      |
|  - Rivalry Dossier & Nemesis Words Tracker                              |
|  - Ghost Duel Recorder & Playback Engine                                |
|  - Tournament Lounge (4-8 Player Simulation, Wagering, ASCII Chat)     |
|  - Weekly Themed Trials (Code Syntax, Blind Duel, 1 HP Sudden Death)    |
+-------------------------------------------------------------------------+
```

---

## 2. Combat & Moment-to-Moment Mechanics

### 2.1 Stance Triangle
Three distinct tactical stances switched dynamically via hotkeys (`Tab` or `1`/`2`/`3`):
- **Strike Stance (Red `#FF3333`)**:
  - Word Pool: Fast, explosive action verbs (`STRIKE`, `BREACH`, `PULVERIZE`, `SHATTER`, `EXECUTE`, `CLEAVE`, `SMITE`, `OVERLOAD`).
  - Mechanics: Deals $2.0\times$ burst damage to opponent kinetic baseline and health. No defensive buffer.
- **Counter Stance (Blue `#00E5FF`)**:
  - Word Pool: Defensive, technical cyber-security and cryptographic terminology (`ISOLATE`, `ENCRYPT`, `CONTAIN`, `QUARANTINE`, `DECRYPT`, `FIREWALL`, `BUFFER`).
  - Mechanics: Keystrokes build an Absorption Shield. Incoming opponent strikes while shield is active are absorbed and convert $50\%$ of incoming damage into player health.
- **Disrupt Stance (Purple `#B026FF`)**:
  - Word Pool: Awkward symbol combinations, punctuation syntax, mixed case, and bracket pairs (`$sys.ptr->0x9F;`, `!&&_NULL#`, `[k*~void::run]`, `@async{42}`/).
  - Mechanics: Successful completions trigger direct UI interference on the opponent:
    - Inverted scanlines and screen flip jitter (2.5s).
    - Scrambled upcoming character visibility (scrambler cipher).
    - Input buffer lag simulation for AI / ghost opponent.

### 2.2 Tug-of-War Kinetic Beam
- Central kinetic energy conduit spanning between Player 1 (left baseline: `-100`) and Opponent (right baseline: `+100`).
- Neutral center at `0`.
- Keystroke dynamics:
  - Correct character: pushes beam $+2.5$ toward enemy baseline ($+5.0$ in Strike stance).
  - Completed word: burst impulse push $+10.0$ to $+25.0$ depending on word length.
  - Typo / Mistype: beam recoils $-4.0$ toward player's own baseline and induces brief input lockout ($120\text{ms}$).
- Win condition: Pushing the beam fully to the opponent's baseline ($+100$) executes an instant Kinetic Beam KO.

### 2.3 Overclock State
- **Trigger**: 30 consecutive clean characters typed without a single typo.
- **Visuals**: Cursor emits chromatic neon ghost-trails, screen edge emits blue-violet speed vignette, audio ducking engages.
- **Audio Modulation**: Web Audio master bus applies low-pass filter ducking ($800\text{Hz}$ cutoff), isolating crisp mechanical keystroke clicks with heightened reverb.
- **Combat Multiplier**: Word and beam push damage doubled ($2.0\times$).
- **Termination**: Ends immediately on the first typo, resetting streak to zero and snapping audio back to standard frequency spectrum.

### 2.4 Finisher Word Duel
- **Trigger**: Activates automatically when either combatant's health drops below $10\%$.
- **Screen Lock**: Main kinetic beam and normal word queues freeze with dramatic screen dimming and siren glitch overlay.
- **Boss Word Duel**: Generates a synchronized, challenging 12-to-15 letter boss word (e.g., `UNCONSCIONABLE`, `ELECTROMAGNETIC`, `COUNTERMEASURE`, `SUPERCONDUCTOR`).
- **Attacker KO**: If the attacker completes the word first, triggers cinematic theatrical KO: screen shattering into ASCII fragments and displaying user's custom ASCII KO Signature.
- **Defender Clutch Rebound**: If the defender completes the word first, defends the match, rebounds immediately with $+25\%$ restored health, and gains $100\%$ full super meter.

---

## 3. Sensory Design & Presentation

### 3.1 OLED Terminal Glitch Aesthetic
- Pitch-black background: `#000000`.
- High-contrast monospaced font family: `IBM Plex Mono`, `JetBrains Mono`, or system monospace fallback.
- CRT Distortion:
  - Configurable barrel curvature via radial SVG filter / CSS transforms.
  - Horizontal scanline raster overlay with subtle $60\text{Hz}$ phosphor flicker.
  - Chromatic aberration on high-combo bursts.
- Reactive Phosphor Glow:
  - Text-shadow bloom dynamically scaling with current WPM ($0\text{px}$ up to $18\text{px}$ bloom).
  - Full palette switching:
    1. **Amber 1984**: `#FFB000` text, `#332200` background accent.
    2. **Cyber Lime**: `#00FF66` text, `#003311` background accent.
    3. **Vaporwave Magenta**: `#FF007F` text, `#00F0FF` cyan accents.
    4. **Monochrome Ice**: `#E0F7FA` text, `#1A3A4A` dark teal accents.

### 3.2 Web Audio Procedural Mechanical Soundstage
Zero external audio files required. All sounds generated via Web Audio API oscillators, noise buffers, and biquad filter sweeps:
1. **Mechanical Thocks**: Low-frequency resonant bandpass click ($120\text{Hz}-250\text{Hz}$) with rapid decay ($35\text{ms}$).
2. **IBM Model M**: Dual-stage click: tactile pre-travel snap ($1.8\text{kHz}$) followed by metallic buckling spring springback resonance ($4.5\text{kHz}$).
3. **Typewriter**: High-velocity mechanical hammer strike followed by carriage return ping on word completion.
4. **8-Bit Blips**: Square wave tone sweeps with sharp attack and 8-bit frequency quantization.
5. **Silent Switches**: Soft low-pass filtered click ($300\text{Hz}$) with padded dampener tail.
6. **Pitch-Scaling Keystrokes**: Correct character streaks increment pitch through an ascending pentatonic scale ($A4, C5, D5, E5, G5, A5 \dots$), resetting on mistype.
7. **Audio Ducking**: High-order biquad filter smoothly attenuates low/mid frequencies when Overclock engages.

### 3.3 Impact Debris (ASCII Particle Physics)
- When any word completes, its constituent glyphs explode into rigid-body ASCII particles on a hardware-accelerated Canvas.
- Particle physics model:
  - Initial explosion velocity: radial angle + randomized impulse magnitude.
  - Angular velocity: spinning character glyphs.
  - Gravity: acceleration downwards ($980\text{px/s}^2$).
  - Restitution (bounce): coefficient of $0.55$ against viewport bounds with floor friction.
  - Fading alpha and particle lifecycle culling ($1.2\text{s}$ lifetime).

---

## 4. Progression, Economy & Cosmetic Flexes

### 4.1 Kinetic Points (KP) Economy
Matches calculate and award KP at victory/defeat:
$$\text{KP} = \text{WPM} \times 1.5 + (\text{Accuracy} \% \times 2.0) + (\text{Max Clean Streak} \times 3) + (\text{Parries} \times 15) + (\text{Victory Bonus}: 250)$$
All transactions and balances persist in `localStorage`.

### 4.2 The Black Market
In-game cosmetic exchange shop with live item previews:
- **Phosphor Palettes**: Amber 1984 (Default), Cyber Lime (300 KP), Vaporwave Magenta (600 KP), Monochrome Ice (900 KP).
- **Typing Trails**:
  - Classic Ghost (Default)
  - Matrix Rain (450 KP): Falling green katakana/alphanumerics trailing behind the cursor.
  - Lightning Arcs (750 KP): Procedural electrical discharge lines bridging consecutive keystrokes.
- **Soundboard Packs**:
  - Mechanical Thock (Default)
  - IBM Model M (350 KP)
  - Vintage Typewriter (500 KP)
  - 8-Bit Arcade Blips (650 KP)
  - Silent Dampeners (250 KP)
- **ASCII KO Signatures**:
  - `[TERMINATED]` Tombstone
  - `[REVILED_SYSTEM_PURGE]` Skull Banner
  - `[CRITICAL_CORE_DUMP]` Binary Matrix Grid
  - `[SYNTAX_ERROR_FATAL]` Glitch Crash Report

---

## 5. Competitive Ladders & Social Mechanics

### 5.1 Asynchronous "Ghost Duels"
- Keystroke Recorder: Records match runs with microsecond precision:
  `{ timestamp: number, char: string, correct: boolean, stance: StanceType, wpm: number }`
- Ghost Playback Engine: Replays recorded streams to power asynchronous duels against previous personal bests, friends, or bot archetypes:
  - **Ada-01**: Methodical accuracy bot ($75\text{ WPM}$, $99\%$ accuracy, heavy Counter stance).
  - **Shinobi-X**: Burst speedster ($115\text{ WPM}$, Strike stance, frequent Overclock streaks).
  - **Glitch-Daemon**: Unpredictable Disrupt stance bot spamming symbol attacks.
- Import/Export: Replay strings encoded as shareable compressed URL tokens or JSON snippets.

### 5.2 The Rivalry Dossier
- Comprehensive statistics dashboard:
  - Lifetime Match Record (W/L ratio, Total KP, Global Accuracy).
  - Head-to-head records against specific Ghost bots and recorded rivals.
  - WPM Differential curves (charting speed advantage over match duration).
  - **Nemesis Words**: Dynamic tracking of vocabulary words with the lowest accuracy or highest KO-induced failures.

### 5.3 Tournament Lounge & Spectator Pit (4-8 Players)
- Multi-lane tournament simulation bracket:
  - 4 or 8 seeded competitors simulated side-by-side.
  - Multi-lane stream view showcasing live word progression and beam tugs.
- Mini Shard Wagering:
  - Players wager Kinetic Points / shards on bracket contenders before each round.
  - Dynamic odds calculation based on contestant seed and WPM history.
- Live ASCII Reaction Bar:
  - Interactive clickable reaction triggers: `[GG]`, `[PWND]`, `[CLUTCH]`, `(╯°□°)╯`, `[REKT]`, `[OVERCLOCK]`.
  - Floating ASCII emotes float over the spectator video lanes in real time.

### 5.4 Weekly Themed Trials
- Rotating challenge modifier system:
  1. **Code Syntax Only**: Strips standard dictionary; generates exclusively C++, Rust, Python, and TypeScript tokens (`std::vector<int>`, `fn main() -> Result<()>`, `export default async`).
  2. **Blind Duel**: Muscle memory test where characters render as blacked-out glyphs `_` until word is validated.
  3. **1 HP Sudden Death**: Both combatants have 1 HP. First mistype or unblocked beam displacement triggers immediate KO.
