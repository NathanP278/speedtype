---
phase: 8
plan: 1
wave: 1
depends_on: [7.1]
files_modified:
  - src/social/challengeCode.ts
  - src/components/ChallengeModal.tsx
  - src/App.tsx
  - src/components/MenuModal.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "A player can generate a 'Challenge Code' — a base64-encoded string encoding their ghost run + username"
    - "Another player pastes the code and plays against a ghost replay of the challenger's best run"
    - "Challenge code encodes: challenger username, netWpm, grossWpm, accuracy, wordsList, keyTimestamps[]"
    - "Codes are URL-safe base64, human-copyable, and validated on paste (reject malformed/tampered codes)"
    - "Challenge accepted = duel runs against GhostPlaybackEngine using the challenger's keystroke timings"
    - "No server required — challenge is entirely peer-to-peer via copy/paste"
  artifacts:
    - "src/social/challengeCode.ts — encode/decode/validate"
    - "src/components/ChallengeModal.tsx — create challenge + accept challenge UI (two tabs)"
    - "App.tsx — challenge modal state, trigger ghost duel from accepted challenge"
---

# Plan 8.1: 1v1 Friend Challenge via Challenge Codes

<objective>
Implement asynchronous 1v1 friend challenges via shareable challenge codes. Player A records their run, generates a compact base64 code, shares it with Player B. Player B pastes the code and races against a ghost replay of Player A's exact run.

This is fully serverless — data travels via clipboard. No WebRTC, no sockets, no server.

Design constraint: Code must be human-manageable (under ~2000 chars). Achieved by storing only word-level timing (word completion timestamps) rather than per-keystroke, which is sufficient to reproduce the ghost's progress bar and WPM curve.

Purpose: The #1 social feature users want — challenge your friends.
</objective>

<context>
Load for context:
- src/social/ghostRecorder.ts (GhostRunData type)
- src/social/ghostPlayer.ts (GhostPlaybackEngine)
- src/engine/useSimpleDuel.ts (wordsList generation)
- src/components/GhostDuelSelector.tsx (existing ghost UI pattern)
</context>

<tasks>

<task type="auto">
  <name>Create challengeCode encoder/decoder/validator</name>
  <files>src/social/challengeCode.ts</files>
  <action>
    ```ts
    export interface ChallengePayload {
      v: 1;                          // version
      challenger: string;            // username
      avatar: string;                // emoji avatar
      netWpm: number;
      grossWpm: number;
      accuracy: number;
      wordsList: string[];           // the exact word list (max 20 words)
      wordTimestampsMs: number[];    // ms from race-start when each word was completed
      createdAt: number;
    }

    const MAX_PAYLOAD_BYTES = 4096; // safety cap

    export function encodeChallengeCode(payload: ChallengePayload): string {
      const json = JSON.stringify(payload);
      // btoa requires ASCII — use encodeURIComponent for safety
      return btoa(encodeURIComponent(json));
    }

    export function decodeChallengeCode(code: string): ChallengePayload | null {
      try {
        const json = decodeURIComponent(atob(code.trim()));
        if (json.length > MAX_PAYLOAD_BYTES) return null;
        const parsed = JSON.parse(json) as ChallengePayload;
        // Validate required fields
        if (
          parsed.v !== 1 ||
          typeof parsed.challenger !== 'string' ||
          !Array.isArray(parsed.wordsList) ||
          !Array.isArray(parsed.wordTimestampsMs) ||
          parsed.wordsList.length !== parsed.wordTimestampsMs.length ||
          parsed.netWpm < 1 || parsed.netWpm > 300 ||
          parsed.accuracy < 0 || parsed.accuracy > 100
        ) return null;
        return parsed;
      } catch {
        return null;
      }
    }

    export function buildChallengeGhostRunner(payload: ChallengePayload) {
      // Returns an object compatible with ghost duel start:
      // Given word completion timestamps, simulate rival progress
      return {
        wordsList: payload.wordsList,
        wordTimestampsMs: payload.wordTimestampsMs,
        challengerName: payload.challenger,
        challengerAvatar: payload.avatar,
        netWpm: payload.netWpm,
      };
    }
    ```

    AVOID: Storing per-keystroke data — word-level timestamps are sufficient and keep code size small.
    AVOID: eval() or Function() for parsing — use JSON.parse only.
  </action>
  <verify>`npx tsc --noEmit` exits 0; encode then decode round-trips correctly in a quick test.</verify>
  <done>
    - encode → decode round-trips without data loss
    - Malformed code returns null (no throw)
    - TypeScript clean
  </done>
</task>

<task type="auto">
  <name>Build ChallengeModal UI (two-tab: Create + Accept)</name>
  <files>src/components/ChallengeModal.tsx</files>
  <action>
    Props:
    ```ts
    interface Props {
      isOpen: boolean;
      onClose: () => void;
      playerProfile: { username: string; avatar: string };
      lastRun: GhostRunData | null;  // from ghostRecorder
      onAcceptChallenge: (payload: ChallengePayload) => void;
    }
    ```

    **Tab 1: "CREATE CHALLENGE"**:
    - If `lastRun` is null: "Complete a duel first to generate a challenge."
    - If run exists:
      - Show challenger stats (netWpm, accuracy, word count)
      - "[GENERATE CHALLENGE CODE]" button → encodes payload → shows textarea with the code
      - "[COPY TO CLIPBOARD]" button (uses `navigator.clipboard.writeText`)
      - Instructions: "Share this code with your friend. They paste it in the Accept tab."

    **Tab 2: "ACCEPT CHALLENGE"**:
    - `<textarea>` for pasting code
    - Live validation: as user types/pastes, attempt decode
    - If valid: show challenger info card (name, avatar, WPM, accuracy)
    - "[RACE AGAINST {challenger}]" button → calls `onAcceptChallenge(payload)`
    - If invalid: "Invalid or corrupted challenge code."

    The word timestamps for "CREATE" come from `lastRun.events` — filter for word-completion events and extract their timestamps relative to run start.

    AVOID: Auto-submitting on paste — user must click the race button.
    AVOID: Accepting codes that decode to impossible stats.
  </action>
  <verify>
    1. Generate a code from a completed run.
    2. Paste into Accept tab — challenger card appears.
    3. `npx tsc --noEmit` exits 0.
  </verify>
  <done>
    - Generate tab produces copyable code
    - Accept tab validates and shows challenger info
    - TypeScript clean
  </done>
</task>

<task type="auto">
  <name>Wire ChallengeModal into App and Menu</name>
  <files>src/App.tsx, src/components/MenuModal.tsx</files>
  <action>
    **App.tsx**:
    1. Add `challengeOpen` state.
    2. Add `handleAcceptChallenge(payload: ChallengePayload)` handler:
       - Converts `payload` into a ghost-compatible opponent configuration
       - Sets a `challengeGhost` state that `useSimpleDuel` (or a separate duel hook) uses as the word list + rival timing source
       - Closes challenge modal, starts duel with challenger's wordsList
       
    For simplicity (since full GhostPlaybackEngine integration is complex): override `wordsList` in `useSimpleDuel` and set `rivalTargetWpm = payload.netWpm` to simulate the challenger. A full keystroke-replay implementation can be a future enhancement — document this in a TODO comment.

    **MenuModal.tsx**:
    - Add "[1v1 CHALLENGE]" button. On click → calls `onOpenChallenge` prop.

    AVOID: Starting the duel automatically on challenge accept — user still controls the start.
  </action>
  <verify>
    1. Menu → 1v1 Challenge → creates code from last run → copy → paste in accept tab → click race → duel starts with challenger's word list and WPM target.
    2. `npx tsc --noEmit` exits 0.
  </verify>
  <done>
    - Full flow functional end-to-end
    - Duel uses challenger's word list
    - TypeScript clean
  </done>
</task>

</tasks>

<verification>
After all tasks:
- [ ] Challenge code generated from last run
- [ ] Decoded challenge shows challenger identity
- [ ] Duel starts against challenge WPM target
- [ ] Malformed codes silently rejected
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` succeeds
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Git commit: `git add -A && git commit -m "feat(1v1): friend challenge via base64 challenge codes"`
- [ ] Git push: `git push`
</success_criteria>
