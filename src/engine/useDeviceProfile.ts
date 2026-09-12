import { useState, useEffect } from 'react';
import { DeviceProfile, detectDeviceProfile } from './deviceDetector.ts';

export type InputMode = 'auto' | 'virtual' | 'physical';

export interface UseDeviceProfileResult {
  profile: DeviceProfile;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchPrimary: boolean;
  hasExternalKeyboard: boolean;
  activeInputMode: 'virtual' | 'physical';
  inputModeSetting: InputMode;
  setInputModeSetting: (mode: InputMode) => void;
  keyboardHeight: number;
  isKeyboardOpen: boolean;
  visualViewportHeight: number;
}

export function useDeviceProfile(): UseDeviceProfileResult {
  const [profile, setProfile] = useState<DeviceProfile>(() => detectDeviceProfile());
  const [inputModeSetting, setInputModeSetting] = useState<InputMode>('auto');
  const [hasExternalKeyboard, setHasExternalKeyboard] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [visualViewportHeight, setVisualViewportHeight] = useState<number>(() => {
    return typeof window !== 'undefined' && window.visualViewport
      ? window.visualViewport.height
      : typeof window !== 'undefined'
      ? window.innerHeight
      : 800;
  });

  // Re-detect on geometry or orientation change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setProfile(detectDeviceProfile());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // VisualViewport listener for mobile keyboard pop-up detection
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;

    const handleVvChange = () => {
      const vHeight = vv.height;
      const winHeight = window.innerHeight;
      const kbHeight = Math.max(0, winHeight - vHeight);

      setVisualViewportHeight(vHeight);
      setKeyboardHeight(kbHeight);

      // Clamp window scroll to (0, 0) to strictly prevent iOS Safari from scrolling header off-screen
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
      if (document.body && document.body.scrollTop !== 0) {
        document.body.scrollTop = 0;
      }
      if (document.documentElement && document.documentElement.scrollTop !== 0) {
        document.documentElement.scrollTop = 0;
      }

      // Set CSS variables on root document
      document.documentElement.style.setProperty('--visual-viewport-height', `${vHeight}px`);
      document.documentElement.style.setProperty('--keyboard-height', `${kbHeight}px`);
      document.documentElement.style.setProperty('--visual-viewport-offset-top', `${vv.offsetTop || 0}px`);
    };

    vv.addEventListener('resize', handleVvChange);
    vv.addEventListener('scroll', handleVvChange);

    handleVvChange();

    return () => {
      vv.removeEventListener('resize', handleVvChange);
      vv.removeEventListener('scroll', handleVvChange);
    };
  }, []);

  // Physical external keyboard detection on touch devices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If we receive a printable key or arrow/tab from a physical keyboard on touch device
      if (profile.isTouchDevice && !hasExternalKeyboard) {
        if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          // Check if keyboard is not open (i.e. physical hardware keystroke without virtual keyboard expansion)
          if (keyboardHeight < 50) {
            setHasExternalKeyboard(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [profile.isTouchDevice, hasExternalKeyboard, keyboardHeight]);

  const isMobile = profile.category === 'mobile';
  const isTablet = profile.category === 'tablet';
  const isDesktop = profile.category === 'desktop';
  const isTouchPrimary = profile.isTouchDevice && profile.pointerType === 'coarse';

  // Resolved active input mode
  let activeInputMode: 'virtual' | 'physical' = 'physical';
  if (inputModeSetting === 'virtual') {
    activeInputMode = 'virtual';
  } else if (inputModeSetting === 'physical') {
    activeInputMode = 'physical';
  } else {
    // 'auto' mode
    if ((isMobile || isTablet) && !hasExternalKeyboard) {
      activeInputMode = 'virtual';
    } else {
      activeInputMode = 'physical';
    }
  }

  const isKeyboardOpen = keyboardHeight > 120;

  return {
    profile,
    isMobile,
    isTablet,
    isDesktop,
    isTouchPrimary,
    hasExternalKeyboard,
    activeInputMode,
    inputModeSetting,
    setInputModeSetting,
    keyboardHeight,
    isKeyboardOpen,
    visualViewportHeight,
  };
}
