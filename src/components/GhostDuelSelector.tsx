import React, { useState } from 'react';
import type { GhostRunData } from '../social/ghostRecorder.ts';
import { GhostRecorder } from '../social/ghostRecorder.ts';

interface GhostDuelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGhost: (run: GhostRunData) => void;
  lastPlayerRun?: GhostRunData | null;
  personalBestRun?: GhostRunData | null;
}

export const GhostDuelSelector: React.FC<GhostDuelSelectorProps> = ({
  isOpen,
  onClose,
  onSelectGhost,
  lastPlayerRun,
  personalBestRun,
}) => {
  const [importCode, setImportCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleExport = () => {
    if (!lastPlayerRun) return;
    const encoded = GhostRecorder.serialize(lastPlayerRun);
    navigator.clipboard.writeText(encoded);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleImport = () => {
    setErrorMsg('');
    if (!importCode.trim()) return;

    const parsed = GhostRecorder.deserialize(importCode.trim());
    if (parsed) {
      onSelectGhost(parsed);
      onClose();
    } else {
      setErrorMsg('Invalid ghost replay code format. Please check the string.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-xl bg-zinc-950 border-2 border-zinc-700 rounded-lg p-5 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <span>👻</span> ASYNCHRONOUS GHOST DUELS
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 text-xs border border-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
          >
            [CLOSE]
          </button>
        </div>

        {/* Duel Personal Best */}
        <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded">
          <h4 className="text-xs font-bold text-amber-400 mb-1">
            PERSONAL BEST RECORD
          </h4>
          <p className="text-[11px] text-zinc-400 mb-2">
            Challenge your all-time highest WPM recorded duel.
          </p>
          {personalBestRun ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-300">
                PB: <strong className="text-amber-400">{personalBestRun.wpm} WPM</strong> ({personalBestRun.accuracy}% ACC)
              </span>
              <button
                type="button"
                onClick={() => {
                  onSelectGhost(personalBestRun);
                  onClose();
                }}
                className="px-3 py-1 text-xs border border-amber-400 text-amber-400 rounded hover:bg-amber-400 hover:text-black font-bold transition-colors"
              >
                [DUEL PERSONAL BEST]
              </button>
            </div>
          ) : (
            <span className="text-xs text-zinc-500 italic">
              No personal best recorded yet. Complete a match to set your record.
            </span>
          )}
        </div>

        {/* Share / Duel Last Run */}
        <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded">
          <h4 className="text-xs font-bold text-[var(--theme-text)] mb-1">
            LAST RECORDED RUN
          </h4>
          <p className="text-[11px] text-zinc-400 mb-2">
            Duel your last match ghost or export your exact microsecond keystroke delta string.
          </p>
          {lastPlayerRun ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between">
              <span className="text-xs text-zinc-300">
                Run: <strong className="text-zinc-100">{lastPlayerRun.wpm} WPM</strong> ({lastPlayerRun.accuracy}% ACC)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectGhost(lastPlayerRun);
                    onClose();
                  }}
                  className="px-3 py-1 text-xs border border-cyan-400 text-cyan-400 rounded hover:bg-cyan-400 hover:text-black font-bold transition-colors"
                >
                  [DUEL LAST RUN]
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3 py-1 text-xs border border-[var(--theme-text)] text-[var(--theme-text)] rounded hover:bg-[var(--theme-text)] hover:text-black font-bold transition-colors"
                >
                  {copied ? '✓ COPIED TO CLIPBOARD!' : 'COPY GHOST CODE'}
                </button>
              </div>
            </div>
          ) : (
            <span className="text-xs text-zinc-500 italic">
              Complete a match first to generate your ghost run.
            </span>
          )}
        </div>

        {/* Import Friend's Ghost */}
        <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded">
          <h4 className="text-xs font-bold text-cyan-400 mb-1">
            CHALLENGE A FRIEND'S GHOST CODE
          </h4>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Paste Base64 Ghost Replay String..."
              value={importCode}
              onChange={e => setImportCode(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-black border border-zinc-700 text-xs text-white rounded font-mono focus:border-cyan-400 outline-none"
            />
            <button
              type="button"
              onClick={handleImport}
              className="px-3 py-1.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-black rounded transition-colors"
            >
              LOAD GHOST
            </button>
          </div>
          {errorMsg && <p className="text-[11px] text-red-400 mt-1">{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
};
