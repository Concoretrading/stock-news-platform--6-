import { initializeApp, cert, getApps, applicationDefault, App } from 'firebase-admin/app';
import { getAuth as getFirebaseAuth, Auth } from 'firebase-admin/auth';
import { getStorage as getFirebaseStorage, Storage } from 'firebase-admin/storage';
import { getFirestore as getFirebaseFirestore, Firestore } from 'firebase-admin/firestore';

class FirebaseAdmin {
  private static instance: FirebaseAdmin;
  private app: App | null = null;
  private _auth: Auth | null = null;
  private _storage: Storage | null = null;
  private _firestore: Firestore | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): FirebaseAdmin {
    if (!FirebaseAdmin.instance) {
      FirebaseAdmin.instance = new FirebaseAdmin();
    }
    return FirebaseAdmin.instance;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._doInitialize();
    await this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      // Skip initialization during build time (only for static export/build, not serverless prod)
      if (this.isBuildTime()) {
        console.log('Skipping Firebase initialization during build time');
        return;
      }

      // Skip if already initialized
      if (getApps().length > 0) {
        this.app = getApps()[0];
        this.initialized = true;
        return;
      }

      // Check for credentials
      const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || 
                            process.env.FIREBASE_PROJECT_ID ||
                            process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!hasCredentials) {
        const msg = 'Firebase admin credentials not found';
        if (process.env.NODE_ENV === 'production') {
          console.error(msg);
          throw new Error(msg);
        } else {
          console.warn(msg);
          return;
        }
      }

      // Initialize Firebase
      this.app = initializeApp({
        credential: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
          ? cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON))
          : applicationDefault(),
        storageBucket: 'concorenews.appspot.com',
      });

      this.initialized = true;
    } catch (error) {
      console.error('Firebase admin initialization failed:', error);
      throw error;
    }
  }

  private isBuildTime(): boolean {
    // Only treat as build time if NEXT_PHASE is explicitly set, or if window is defined (client)
    return (
      process.env.NEXT_PHASE === 'phase-production-build' ||
      typeof window !== 'undefined'
    );
  }

  async getAuth(): Promise<Auth> {
    if (this.isBuildTime()) {
      throw new Error('Firebase admin not available during build time');
    }

    await this.initialize();
    
    if (!this._auth && this.app) {
      this._auth = getFirebaseAuth(this.app);
    }
    
    if (!this._auth) {
      throw new Error('Firebase admin not initialized');
    }
    
    return this._auth;
  }

  async getStorage(): Promise<Storage> {
    if (this.isBuildTime()) {
      throw new Error('Firebase admin not available during build time');
    }

    await this.initialize();
    
    if (!this._storage && this.app) {
      this._storage = getFirebaseStorage(this.app);
    }
    
    if (!this._storage) {
      throw new Error('Firebase admin not initialized');
    }
    
    return this._storage;
  }

  async getFirestore(): Promise<Firestore> {
    if (this.isBuildTime()) {
      throw new Error('Firebase admin not available during build time');
    }

    await this.initialize();
    
    if (!this._firestore && this.app) {
      this._firestore = getFirebaseFirestore(this.app);
    }
    
    if (!this._firestore) {
      throw new Error('Firebase admin not initialized');
    }
    
    return this._firestore;
  }
}

// Export async getter functions
export async function getAuth(): Promise<Auth> {
  return FirebaseAdmin.getInstance().getAuth();
}

export async function getStorage(): Promise<Storage> {
  return FirebaseAdmin.getInstance().getStorage();
}

export async function getFirestore(): Promise<Firestore> {
  return FirebaseAdmin.getInstance().getFirestore();
} 