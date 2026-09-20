import { useState, useEffect } from 'react';
import { StorageService, DpadPositionPreference } from '../services/storage';

export interface ScreenLayoutInfo {
  isTouch: boolean;
  isLandscape: boolean;
  dpadPreference: DpadPositionPreference;
  setDpadPreference: (pref: DpadPositionPreference) => void;
  // Effective position for controls: 'bottom' (in portrait) | 'right' (in landscape) | 'left' (in landscape if preferred)
  effectiveControlPosition: 'bottom' | 'right' | 'left';
}

export function useScreenLayout(): ScreenLayoutInfo {
  const [dpadPreference, setDpadPreferenceState] = useState<DpadPositionPreference>(() => {
    return StorageService.getDpadPosition();
  });

  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight;
    }
    return false;
  });

  const [isTouch, setIsTouch] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const setDpadPreference = (pref: DpadPositionPreference) => {
    setDpadPreferenceState(pref);
    StorageService.setDpadPosition(pref);
  };

  // Determine effective control position:
  // When portrait -> always bottom
  // When landscape -> if preference is 'left', place left; otherwise right
  let effectiveControlPosition: 'bottom' | 'right' | 'left' = 'bottom';
  if (isLandscape) {
    effectiveControlPosition = dpadPreference === 'left' ? 'left' : 'right';
  } else {
    effectiveControlPosition = 'bottom';
  }

  return {
    isTouch,
    isLandscape,
    dpadPreference,
    setDpadPreference,
    effectiveControlPosition,
  };
}
