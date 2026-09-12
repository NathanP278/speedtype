import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

export interface AdaptiveInputCaptureHandle {
  focus: () => void;
  blur: () => void;
}

interface AdaptiveInputCaptureProps {
  onCharInput: (char: string) => void;
  onBackspace?: () => void;
  currentTypedValue?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * High-performance controlled buffer input capture component.
 *
 * Engineered for iOS QuickType, Android Gboard, iPadOS, and physical keyboards:
 * - Synchronizes the DOM input value with the active typing buffer (`currentTypedValue`).
 * - Employs rapid value diffing on native input/change events instead of canceling beforeinput,
 *   completely eliminating WebKit QuickType / Gboard predictive daemon desynchronization,
 *   IPC sync timeouts, and keyboard session disconnects.
 * - Provides immediate physical backspace support when buffer is empty for inter-word transitions.
 * - 44x44px touch-accessible anchoring prevents mobile browsers from dismissing the virtual keyboard.
 */
export const AdaptiveInputCapture = forwardRef<AdaptiveInputCaptureHandle, AdaptiveInputCaptureProps>(
  ({ onCharInput, onBackspace, currentTypedValue = '', disabled = false, autoFocus = true }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const prevValueRef = useRef<string>(currentTypedValue);
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

    // Synchronize DOM value with incoming controlled progress from engine
    useEffect(() => {
      if (inputRef.current && inputRef.current.value !== currentTypedValue) {
        inputRef.current.value = currentTypedValue;
      }
      prevValueRef.current = currentTypedValue;
    }, [currentTypedValue]);

    // Handle physical keyboard special keys
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Tab' || e.key === 'Escape') return;

      if (e.key === 'Backspace') {
        // If current value is empty, fire onBackspace immediately so user can delete into prior word
        if (!inputRef.current || inputRef.current.value.length === 0) {
          e.preventDefault();
          backspaceHandledInTickRef.current = true;
          queueMicrotask(() => {
            backspaceHandledInTickRef.current = false;
          });
          onBackspace?.();
        }
        // If value is not empty, let native deletion occur and handle via handleValueChange diffing
      }
    };

    // Value diffing engine: triggers on every native character insertion or backspace
    const handleValueChange = (newValue: string) => {
      if (disabled) return;
      const prevValue = prevValueRef.current;

      if (newValue === prevValue) return;

      if (newValue.length > prevValue.length) {
        // Characters added (single key tap, rapid burst, swipe, or suggestion replacement)
        if (newValue.startsWith(prevValue)) {
          const addedChars = newValue.slice(prevValue.length);
          for (const ch of addedChars) {
            onCharInput(ch);
          }
        } else {
          // Replacement or non-prefix edit: feed characters from diff
          const addedCount = newValue.length - prevValue.length;
          const added = newValue.slice(newValue.length - addedCount);
          for (const ch of added) {
            onCharInput(ch);
          }
        }
      } else if (newValue.length < prevValue.length) {
        // Characters removed (Backspace or text selection delete)
        if (backspaceHandledInTickRef.current) {
          prevValueRef.current = newValue;
          return;
        }
        const removedCount = prevValue.length - newValue.length;
        backspaceHandledInTickRef.current = true;
        queueMicrotask(() => {
          backspaceHandledInTickRef.current = false;
        });
        for (let i = 0; i < removedCount; i++) {
          onBackspace?.();
        }
      }

      prevValueRef.current = newValue;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleValueChange(e.target.value);
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      if (target) {
        handleValueChange(target.value);
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
        defaultValue={currentTypedValue}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onInput={handleInput}
        aria-label="Adaptive Typing Input Receiver"
        style={{
          position: 'fixed',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '44px',
          height: '44px',
          opacity: 0.01,
          fontSize: '16px', // Prevents iOS Safari auto-zoom
          pointerEvents: 'auto',
          border: 'none',
          outline: 'none',
          padding: 0,
          margin: 0,
          background: 'transparent',
          zIndex: 1,
        }}
      />
    );
  }
);

AdaptiveInputCapture.displayName = 'AdaptiveInputCapture';
