'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, getCurrentUser } from '@/lib/firebase-services';
import { User as FirebaseUser } from "firebase/auth";

interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  firebaseUser?: FirebaseUser | null;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((fbUser: any) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          firebaseUser: fbUser,
        });
        setFirebaseUser(fbUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { signOutUser } = await import('@/lib/firebase-services');
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 