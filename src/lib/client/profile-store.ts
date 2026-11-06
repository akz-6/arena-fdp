'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  name: string;
  color: string;
  createdAt: number;
  profileId?: string;
  deviceToken?: string;
}

interface ProfileStore {
  profile: UserProfile | null;
  setProfile: (name: string, color: string, profileId?: string, deviceToken?: string) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (name: string, color: string, profileId?: string, deviceToken?: string) =>
        set((state) => ({
          profile: {
            name: name.trim(),
            color,
            createdAt: state.profile?.createdAt || Date.now(),
            profileId: profileId || state.profile?.profileId,
            deviceToken: deviceToken || state.profile?.deviceToken,
          },
        })),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: 'arena_fdp_local_profile',
    }
  )
);
