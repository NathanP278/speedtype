import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChallengePayload,
  encodeChallengeCode,
  decodeChallengeCode,
  ChallengeGhostRunner,
  buildChallengeGhostRunner,
} from '../social/challengeCode.ts';
import { GhostRunData, getLastRun } from '../social/ghostRecorder.ts';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerProfile: { username: string; avatar: string };
  lastRun: GhostRunData | null;
  onAcceptChallenge: (ghost: ChallengeGhostRunner) => void;
}

type Tab = 'create' | 'accept';

/** Extracts word-level completion timestamps from ghost run event log. */
function extractWordData(run: GhostRunData): { words: string[]; timestamps: number[] } {
  const words: string[] = [];
  const timestamps: number[] = [];
  for (const ev of run.events) {
    if (ev.w) {
      words.push(ev.w);
      timestamps.push(ev.t);
    }
  }
  return { words, timestamps };
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  playerProfile,
  lastRun: initialLastRun,
  onAcceptChallenge,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [lastRun, setLastRun] = useState<GhostRunData | null>(initialLastRun);

  useEffect(() => {
    if (isOpen) {
      const freshRun = getLastRun();
      if (freshRun) {
        setLastRun(freshRun);
      } else {
        setLastRun(initialLastRun);
      }
    }
  }, [isOpen, initialLastRun, activeTab]);

  // Create tab state
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Accept tab state
  const [pastedCode, setPastedCode] = useState('');
  const [decoded, setDecoded] = useState<ChallengePayload | null>(null);
  const [decodeError, setDecodeError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = useCallback(() => {
    if (!lastRun) return;

    const { words: wordsList, timestamps: wordTimestampsMs } = extractWordData(lastRun);

    const payload: ChallengePayload = {
      v: 1,
      challenger: playerProfile.username,
      avatar: playerProfile.avatar,
      netWpm: Math.round(lastRun.wpm),
      grossWpm: Math.round(lastRun.wpm * 1.1), // approx gross
      accuracy: Math.round(lastRun.accuracy ?? 100),
      wordsList: wordsList.length > 0 ? wordsList : ['speed', 'type', 'cyber', 'terminal'],
      wordTimestampsMs: wordTimestampsMs.length > 0 ? wordTimestampsMs : [1000, 2000, 3000, 4000],
      createdAt: Date.now(),
    };

    const code = encodeChallengeCode(payload);
    setGeneratedCode(code);
    setCopied(false);
  }, [lastRun, playerProfile]);

  const handleCopy = useCallback(async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback — select the textarea text
      textareaRef.current?.select();
    }
  }, [generatedCode]);

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPastedCode(val);
    if (val.trim()) {
      const result = decodeChallengeCode(val);
      setDecoded(result);
      setDecodeError(result === null && val.trim().length > 10);
    } else {
      setDecoded(null);
      setDecodeError(false);
    }
  };

  const handleAccept = () => {
    if (!decoded) return;
    const ghost = buildChallengeGhostRunner(decoded);
    onAcceptChallenge(ghost);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-black text-white tracking-widest">
            ⚔️ 1v1 FRIEND CHALLENGE
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition-colors"
          >
            [CLOSE]
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {(['create', 'accept'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab
                  ? 'text-[var(--theme-text)] border-b-2 border-[var(--theme-text)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'create' ? '📤 Create Challenge' : '📥 Accept Challenge'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'create' ? (
            <CreateTab
              lastRun={lastRun}
              generatedCode={generatedCode}
              copied={copied}
              textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
              onGenerate={handleGenerate}
              onCopy={handleCopy}
            />
          ) : (
            <AcceptTab
              pastedCode={pastedCode}
              decoded={decoded}
              decodeError={decodeError}
              onPasteChange={handlePasteChange}
              onAccept={handleAccept}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Create Tab ───────────────────────────────────────────────────────────────

interface CreateTabProps {
  lastRun: GhostRunData | null;
  generatedCode: string | null;
  copied: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onGenerate: () => void;
  onCopy: () => void;
}

const CreateTab: React.FC<CreateTabProps> = ({
  lastRun,
  generatedCode,
  copied,
  textareaRef,
  onGenerate,
  onCopy,
}) => {
  if (!lastRun) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <div className="text-3xl mb-3">🏁</div>
        <p className="text-sm">Complete a duel first to generate a challenge code.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Run preview */}
      <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Your Last Run</p>
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-zinc-500">Net WPM </span>
            <span className="font-black text-[var(--theme-text)]">{Math.round(lastRun.wpm)}</span>
          </div>
          <div>
            <span className="text-zinc-500">Accuracy </span>
            <span className="font-bold text-cyan-400">{Math.round(lastRun.accuracy ?? 100)}%</span>
          </div>
          <div>
            <span className="text-zinc-500">Words </span>
            <span className="font-bold text-zinc-200">
              {lastRun.events.filter((e) => !!e.w).length || '20'}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        className="w-full py-3 bg-[var(--theme-text)] text-black font-bold text-sm rounded-xl hover:brightness-110 transition-all tracking-wider"
      >
        [GENERATE CHALLENGE CODE]
      </button>

      {generatedCode && (
        <>
          <textarea
            ref={textareaRef}
            readOnly
            value={generatedCode}
            rows={4}
            className="w-full p-3 bg-black border border-zinc-700 rounded-lg text-[10px] text-zinc-300 font-mono resize-none focus:outline-none focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={onCopy}
            className="w-full py-2.5 border border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-500 text-xs rounded-xl transition-colors font-bold"
          >
            {copied ? '✓ COPIED TO CLIPBOARD' : '[COPY TO CLIPBOARD]'}
          </button>
          <p className="text-[10px] text-zinc-600 text-center">
            Share this code with your friend. They paste it in the Accept tab.
          </p>
        </>
      )}
    </div>
  );
};

// ─── Accept Tab ───────────────────────────────────────────────────────────────

interface AcceptTabProps {
  pastedCode: string;
  decoded: ChallengePayload | null;
  decodeError: boolean;
  onPasteChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAccept: () => void;
}

const AcceptTab: React.FC<AcceptTabProps> = ({
  pastedCode,
  decoded,
  decodeError,
  onPasteChange,
  onAccept,
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
        Paste Challenge Code
      </label>
      <textarea
        value={pastedCode}
        onChange={onPasteChange}
        rows={4}
        placeholder="Paste the challenge code your friend shared here…"
        autoComplete="off"
        spellCheck={false}
        className={`w-full p-3 bg-black border rounded-lg text-[10px] text-zinc-300 font-mono resize-none focus:outline-none transition-colors placeholder-zinc-700 ${
          decoded
            ? 'border-green-600/70'
            : decodeError
            ? 'border-red-500/70'
            : 'border-zinc-700 focus:border-zinc-500'
        }`}
      />
      {decodeError && (
        <p className="text-red-400 text-xs mt-1.5">
          Invalid or corrupted challenge code. Check that you copied the full code.
        </p>
      )}
    </div>

    {decoded && (
      <div className="p-4 bg-zinc-900/70 border border-green-600/40 rounded-xl">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Challenger Detected</p>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{decoded.avatar}</span>
          <div>
            <p className="font-black text-white text-sm">{decoded.challenger}</p>
            <p className="text-[10px] text-zinc-500">wants to race you</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-zinc-500">WPM </span>
            <span className="font-black text-[var(--theme-text)]">{decoded.netWpm}</span>
          </div>
          <div>
            <span className="text-zinc-500">Accuracy </span>
            <span className="font-bold text-cyan-400">{decoded.accuracy}%</span>
          </div>
          <div>
            <span className="text-zinc-500">Words </span>
            <span className="font-bold text-zinc-200">{decoded.wordsList.length}</span>
          </div>
        </div>
      </div>
    )}

    <button
      type="button"
      onClick={onAccept}
      disabled={!decoded}
      className={`w-full py-3 font-bold text-sm rounded-xl transition-all tracking-wider ${
        decoded
          ? 'bg-[var(--theme-text)] text-black hover:brightness-110 cursor-pointer'
          : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
      }`}
    >
      {decoded ? `[RACE AGAINST ${decoded.challenger.toUpperCase()}]` : 'Paste a code to continue'}
    </button>
  </div>
);
