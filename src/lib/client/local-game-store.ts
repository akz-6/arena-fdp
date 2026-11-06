'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState } from '@/lib/engine/types';

export interface SavedLocalMatch {
  id: string;
  roomName: string;
  updatedAt: number;
  state: GameState;
}

interface LocalGamesStore {
  matches: Record<string, SavedLocalMatch>;
  saveMatch: (id: string, state: GameState) => void;
  deleteMatch: (id: string) => void;
  getMatch: (id: string) => SavedLocalMatch | undefined;
}

export const useLocalGamesStore = create<LocalGamesStore>()(
  persist(
    (set, get) => ({
      matches: {},

      saveMatch: (id: string, state: GameState) => {
        set((current) => ({
          matches: {
            ...current.matches,
            [id]: {
              id,
              roomName: state.config.roomName,
              updatedAt: Date.now(),
              state,
            },
          },
        }));
      },

      deleteMatch: (id: string) => {
        set((current) => {
          const updated = { ...current.matches };
          delete updated[id];
          return { matches: updated };
        });
      },

      getMatch: (id: string) => {
        return get().matches[id];
      },
    }),
    {
      name: 'arena_fdp_local_matches_v1',
      version: 1,
    }
  )
);
