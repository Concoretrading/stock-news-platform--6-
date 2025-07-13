import React from "react";
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from "firebase/auth";
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

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
  if (process.env.NODE_ENV !== 'production' && Array.isArray(children)) {
    console.warn('AuthProvider received multiple children. Only a single child is allowed. Wrap children in a <div> or <>...</>.');
  }
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Development bypass for localhost testing
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('🔧 Development mode - creating test user for localhost');
      const testUser = {
        uid: 'test-user-localhost',
        email: 'test@localhost.dev',
        displayName: 'Test User (Development)',
        firebaseUser: null
      };
      setUser(testUser);
      setFirebaseUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      console.log('🔧 Auth state changed:', fbUser ? `User: ${fbUser.uid}` : 'No user')
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
      // In development mode, just clear the user
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        setUser(null);
        setFirebaseUser(null);
        return;
      }
      await firebaseSignOut(auth);
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