// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { getProfile } from '../services/api';
import { IUserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: IUserProfile | null;
  loading: boolean;
  isGuest: boolean;
  logout: () => void;
  setProfile: (profile: IUserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track if we have mounted to prevent state updates on unmount
  const isMounted = useRef(true);

  useEffect(() => {
    // SAFETY: If auth failed to initialize in config, stop loading immediately
    if (!auth) {
        console.error("Auth module missing. Defaulting to Guest mode.");
        setLoading(false);
        return;
    }

    // SAFETY: Fallback timeout. If Firebase hangs, force load after 2.5s
    const safetyTimeout = setTimeout(() => {
        if (loading && isMounted.current) {
            console.warn("⚠️ Auth listener timed out. Forcing app load.");
            setLoading(false);
        }
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clear safety timeout since we got a response
      clearTimeout(safetyTimeout);

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const { data } = await getProfile();
          if (isMounted.current) setProfile(data);
        } catch (error) {
          console.error("Profile fetch failed:", error);
          if (isMounted.current) setProfile(null);
        }
      } else {
        if (isMounted.current) {
            setUser(null);
            setProfile(null);
        }
      }
      
      if (isMounted.current) setLoading(false);
    });

    return () => {
        isMounted.current = false;
        clearTimeout(safetyTimeout);
        unsubscribe();
    };
  }, []);

  const logout = () => {
    if (auth) signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    isGuest: !user,
    logout,
    setProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
