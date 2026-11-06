'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  name: string;
  color: string;
  createdAt: number;
}

interface ProfileStore {
  profile: UserProfile | null;
  setProfile: (name: string, color: string) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (name: string, color: string) =>
        set({
          profile: {
            name: name.trim(),
            color,
            createdAt: Date.now(),
          },
        }),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: 'arena_fdp_local_profile',
    }
  )
);
