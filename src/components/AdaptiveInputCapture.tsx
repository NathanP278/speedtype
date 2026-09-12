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
 * High-performance, zero-layout-shift input capture component.
 *
 * Engineered for mobile and cross-device typing:
 * - Anchored in the visible viewport (opacity 0, pointer-events-auto but non-disruptive).
 * - Fixed 16px font-size to strictly prevent iOS Safari automatic zoom-in.
 * - Captures both physical keystrokes and mobile IME / virtual keyboard composition
 *   (resolving Android Gboard keyCode 229 / 'Unidentified' key issue).
 */
export const AdaptiveInputCapture = forwardRef<AdaptiveInputCaptureHandle, AdaptiveInputCaptureProps>(
  ({ onCharInput, onBackspace, disabled = false, autoFocus = true }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const lastKeyHandledRef = useRef<number>(0);

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

    // Handle physical keyboard events directly
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        lastKeyHandledRef.current = Date.now();
        onBackspace?.();
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      if (e.key === ' ' || (e.key.length === 1 && e.key !== 'Unidentified')) {
        e.preventDefault();
        lastKeyHandledRef.current = Date.now();
        onCharInput(e.key);
        if (inputRef.current) inputRef.current.value = '';
      }
    };

    // Handle mobile virtual keyboards (iOS QuickType, Android Gboard, Samsung IME)
    // Mobile IMEs often emit 'beforeinput' with inputType: 'insertText'
    const handleBeforeInput = (e: React.FormEvent<HTMLInputElement> & { data?: string; inputType?: string }) => {
      if (disabled) return;

      // If handled via keydown in the last 30ms, ignore duplicate
      if (Date.now() - lastKeyHandledRef.current < 30) {
        return;
      }

      if (e.inputType === 'deleteContentBackward') {
        e.preventDefault();
        onBackspace?.();
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      if (e.data && e.data.length > 0) {
        e.preventDefault();
        for (const ch of e.data) {
          onCharInput(ch);
        }
        if (inputRef.current) inputRef.current.value = '';
      }
    };

    // Fallback onChange for browsers that don't support beforeinput event cancellation
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const value = e.target.value;

      if (Date.now() - lastKeyHandledRef.current >= 30 && value.length > 0) {
        for (const ch of value) {
          onCharInput(ch);
        }
      }

      // Always keep input value empty for next character
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
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="go"
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onBeforeInput={handleBeforeInput as unknown as (e: React.FormEvent<HTMLInputElement>) => void}
        onChange={handleChange}
        aria-label="Adaptive Typing Input Receiver"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '1px',
          height: '1px',
          opacity: 0.001,
          fontSize: '16px', // Prevents iOS Safari auto-zoom
          pointerEvents: 'auto',
          border: 'none',
          outline: 'none',
          padding: 0,
          margin: 0,
          background: 'transparent',
          zIndex: 10,
        }}
      />
    );
  }
);

AdaptiveInputCapture.displayName = 'AdaptiveInputCapture';
