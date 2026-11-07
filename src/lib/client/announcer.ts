'use client';

import { create } from 'zustand';

interface AnnouncerState {
  message: string;
  announce: (msg: string) => void;
}

export const useAnnouncerStore = create<AnnouncerState>((set) => ({
  message: '',
  announce: (msg: string) => {
    if (!msg) return;
    set({ message: '' });
    setTimeout(() => {
      set({ message: msg });
    }, 50);
  },
}));

export const announce = (msg: string) => {
  useAnnouncerStore.getState().announce(msg);
};
