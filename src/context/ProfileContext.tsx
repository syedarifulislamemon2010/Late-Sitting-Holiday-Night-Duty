'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserCell {
  id: number;
  name: string;
}

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  mobile?: string | null;
  cells?: UserCell[];
}

interface ProfileContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  refetchProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  currentUser: null,
  loading: true,
  refetchProfile: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn('Profile fetch failed (transient network error)');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // Slowly poll profile status in background every 15 seconds to ensure sessions don't silently expire
    const interval = setInterval(fetchProfile, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ProfileContext.Provider value={{ currentUser, loading, refetchProfile: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
