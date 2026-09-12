import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

export interface AdaptiveInputCaptureHandle {
  focus: () => void;
  blur: () => void;
}

interface AdaptiveInputCaptureProps {
  onCharInput: (char: string) => void;
  onBackspace?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * High-performance, zero-latency mobile & cross-device input capture component.
 *
 * Engineered for iOS QuickType, Android Gboard, iPadOS, and physical keyboards:
 * - Anchored at the viewport base to strictly prevent iOS Safari auto-zoom and scroll-jumping.
 * - Employs cancelable `beforeinput` as primary intake for mobile IME and virtual keyboards,
 *   preventing DOM mutation and eliminating WebKit cursor reset & dictionary IPC stutter.
 * - Replaces arbitrary millisecond throttling with microtask-scoped tick deduplication
 *   so rapid-fire typing bursts (<15ms) and consecutive double letters ('ee', 'll')
 *   register with 100% fidelity without dropping characters.
 */
export const AdaptiveInputCapture = forwardRef<AdaptiveInputCaptureHandle, AdaptiveInputCaptureProps>(
  ({ onCharInput, onBackspace, disabled = false, autoFocus = true }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const beforeInputHandledInTickRef = useRef<boolean>(false);
    const backspaceHandledInTickRef = useRef<boolean>(false);

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (!disabled && inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
        }
      },
      blur: () => {
        inputRef.current?.blur();
      },
    }));

    useEffect(() => {
      if (autoFocus && !disabled && inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, [autoFocus, disabled]);

    // Handle physical keyboard special keys (Backspace, Tab, Escape)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Tab' || e.key === 'Escape') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        backspaceHandledInTickRef.current = true;
        queueMicrotask(() => {
          backspaceHandledInTickRef.current = false;
        });
        onBackspace?.();
        return;
      }

      // If key is printable and not unidentified, let beforeinput handle cancelable intake
      // on mobile and modern desktop. If in a headless or legacy environment without beforeinput,
      // handleChange will capture any value change.
    };

    // Handle primary character intake via cancelable beforeinput
    // Intercepts virtual keyboard taps, suggestions, autocorrect, and IME composition
    const handleBeforeInput = (
      e: React.FormEvent<HTMLInputElement> & {
        data?: string | null;
        inputType?: string;
      }
    ) => {
      if (disabled) return;

      // Handle Backspace / Delete from virtual keyboard
      if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteWordBackward') {
        e.preventDefault();
        // If already handled by physical keydown in this event loop tick, avoid duplicate
        if (backspaceHandledInTickRef.current) return;

        backspaceHandledInTickRef.current = true;
        queueMicrotask(() => {
          backspaceHandledInTickRef.current = false;
        });
        onBackspace?.();
        return;
      }

      // Handle character insertion (insertText, insertCompositionText, insertFromPaste)
      if (e.data && e.data.length > 0) {
        // Prevent default DOM mutation so the input value does NOT change,
        // eliminating WebKit cursor repositioning, IPC lag, and text flicker
        e.preventDefault();

        beforeInputHandledInTickRef.current = true;
        queueMicrotask(() => {
          beforeInputHandledInTickRef.current = false;
        });

        for (const ch of e.data) {
          onCharInput(ch);
        }
      }
    };

    // Fallback onChange for environments that do not support canceling beforeinput
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const value = e.target.value;

      // If already captured by beforeinput in this tick, safely reset and return
      if (beforeInputHandledInTickRef.current) {
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      if (value.length > 0) {
        for (const ch of value) {
          onCharInput(ch);
        }
      }

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="go"
        data-form-type="other"
        data-1p-ignore="true"
        data-lpignore="true"
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onBeforeInput={handleBeforeInput as unknown as (e: React.FormEvent<HTMLInputElement>) => void}
        onChange={handleChange}
        aria-label="Adaptive Typing Input Receiver"
        style={{
          position: 'fixed',
          bottom: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: '1px',
          opacity: 0.001,
          fontSize: '16px', // Prevents iOS Safari auto-zoom
          pointerEvents: 'none',
          border: 'none',
          outline: 'none',
          padding: 0,
          margin: 0,
          background: 'transparent',
          zIndex: -1,
        }}
      />
    );
  }
);

AdaptiveInputCapture.displayName = 'AdaptiveInputCapture';
