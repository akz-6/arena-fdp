'use client';

import { create } from 'zustand';

interface MotionState {
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  toggleReducedMotion: () => void;
  init: () => void;
}

const STORAGE_KEY = 'arena_fdp_reduced_motion';

export const useMotionStore = create<MotionState>((set, get) => ({
  reducedMotion: false,
  setReducedMotion: (reduced: boolean) => {
    set({ reducedMotion: reduced });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, reduced ? 'true' : 'false');
      } catch {
        // ignore
      }
    }
  },
  toggleReducedMotion: () => {
    const next = !get().reducedMotion;
    get().setReducedMotion(next);
  },
  init: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        set({ reducedMotion: stored === 'true' });
        return;
      }
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        set({ reducedMotion: mediaQuery.matches });
        const handler = (e: MediaQueryListEvent) => {
          if (localStorage.getItem(STORAGE_KEY) === null) {
            set({ reducedMotion: e.matches });
          }
        };
        mediaQuery.addEventListener?.('change', handler);
      }
    } catch {
      // fallback
    }
  },
}));

export function useReducedMotion() {
  const reducedMotion = useMotionStore((s) => s.reducedMotion);
  const setReducedMotion = useMotionStore((s) => s.setReducedMotion);
  const toggleReducedMotion = useMotionStore((s) => s.toggleReducedMotion);
  return { reducedMotion, setReducedMotion, toggleReducedMotion };
}
