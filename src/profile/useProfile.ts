import { useState, useCallback } from 'react';
import { PlayerProfile, loadProfile, saveProfile } from './profile.ts';

export function useProfile() {
  const [profile, setProfile] = useState<PlayerProfile | null>(() => loadProfile());

  const createProfile = useCallback((username: string, avatar: string) => {
    const p: PlayerProfile = {
      username: username.trim(),
      avatar,
      createdAt: Date.now(),
    };
    saveProfile(p);
    setProfile(p);
  }, []);

  return { profile, createProfile };
}
