import React, { useState, useRef, useEffect } from 'react';
import { UseDeviceProfileResult, InputMode } from '../engine/useDeviceProfile.ts';

interface DeviceBadgeProps {
  device: UseDeviceProfileResult;
}

export const DeviceBadge: React.FC<DeviceBadgeProps> = ({ device }) => {
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  const { profile, activeInputMode, hasExternalKeyboard, inputModeSetting, setInputModeSetting } = device;

  // Icon based on category
  const deviceIcon =
    profile.category === 'mobile'
      ? '📱'
      : profile.category === 'tablet'
      ? '📟'
      : profile.category === 'foldable'
      ? '📲'
      : '💻';

  const modeLabel = activeInputMode === 'virtual' ? 'VIRTUAL KB' : hasExternalKeyboard ? 'EXT KB' : 'PHYSICAL';

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setPopoverOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs transition-colors cursor-pointer focus-ring"
        title="View hardware telemetry and device status"
      >
        <span className="text-sm">{deviceIcon}</span>
        <span className="hidden sm:inline font-bold text-zinc-300 uppercase tracking-wider text-[10px]">
          {profile.formFactor.split(' ')[0]}
        </span>
        <span className="text-[9px] px-1 py-0.2 bg-zinc-950 text-[var(--theme-text)] border border-[var(--theme-border)] rounded font-semibold">
          {modeLabel}
        </span>
        {profile.isSpoofed && (
          <span className="text-[10px] text-amber-400 font-bold" title="Spoofed attributes detected">
            ⚠️
          </span>
        )}
      </button>

      {/* Hardware Telemetry Popover Modal */}
      {popoverOpen && (
        <div className="absolute top-11 right-0 sm:left-0 sm:right-auto w-80 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50 text-left font-mono animate-fadeIn text-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{deviceIcon}</span>
              <div>
                <h4 className="font-black text-white text-xs tracking-wider">HARDWARE TELEMETRY</h4>
                <p className="text-[10px] text-zinc-500">ANTI-SPOOF DEVICE PROBE</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPopoverOpen(false)}
              className="text-zinc-500 hover:text-white text-xs px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          {/* Telemetry rows */}
          <div className="space-y-1.5 mb-3 bg-zinc-900/70 p-2.5 rounded-xl border border-zinc-850 text-[10px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">FORM FACTOR:</span>
              <span className="text-white font-bold">{profile.formFactor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">PLATFORM OS:</span>
              <span className="text-zinc-300 uppercase font-semibold">{profile.os}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">GPU RENDERER:</span>
              <span className="text-[var(--theme-text)] font-semibold truncate max-w-[150px]" title={profile.gpuRenderer}>
                {profile.gpuRenderer}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">TOUCH HARDWARE:</span>
              <span className="text-zinc-300">
                {profile.touchPoints > 0 ? `${profile.touchPoints} Max Touch Points` : 'No Touch Hardware'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">PRIMARY POINTER:</span>
              <span className="text-zinc-300 uppercase font-semibold">{profile.pointerType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">DISPLAY GEOMETRY:</span>
              <span className="text-zinc-300">
                {profile.screenWidth}x{profile.screenHeight} (@{profile.pixelRatio}x)
              </span>
            </div>
          </div>

          {/* Anti-spoof status badge */}
          <div
            className={`p-2 rounded-xl mb-3 border text-[10px] ${
              profile.isSpoofed
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>{profile.isSpoofed ? '⚠️ SPOOF DISCREPANCY' : '✓ AUTHENTIC HARDWARE'}</span>
              <span className="text-[9px] opacity-80">{profile.confidence}% CONFIDENCE</span>
            </div>
            {profile.isSpoofed ? (
              <ul className="list-disc list-inside text-[9px] text-amber-400 space-y-0.5">
                {profile.spoofReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[9px] opacity-90">
                Hardware markers (GPU, touch points, pointer) strictly match claimed platform.
              </p>
            )}
          </div>

          {/* Input Mode Selector */}
          <div>
            <span className="text-[10px] text-zinc-400 block font-bold uppercase mb-1.5">
              INPUT PIPELINE MODE
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              {(['auto', 'virtual', 'physical'] as InputMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInputModeSetting(mode)}
                  className={`py-1.5 px-2 rounded-lg border font-bold uppercase transition-colors text-center ${
                    inputModeSetting === mode
                      ? 'bg-[var(--theme-text)] text-black border-[var(--theme-text)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-zinc-500 mt-1">
              {inputModeSetting === 'auto'
                ? 'Auto: Automatically switches between virtual & physical typing.'
                : inputModeSetting === 'virtual'
                ? 'Virtual: Forces mobile on-screen keyboard capture.'
                : 'Physical: Direct physical key listening for Bluetooth/USB keyboards.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
