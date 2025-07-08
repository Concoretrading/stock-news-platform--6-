import { initializeApp, cert, getApps, applicationDefault, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Hardcode the default bucket for testing
const storageBucket = 'concorenews.firebasestorage.app';

// Only initialize Firebase if we're not in build time and have proper credentials
if (!getApps().length && typeof window === 'undefined') {
  try {
    // Check if we have the required environment variables
    const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || 
                          process.env.FIREBASE_PROJECT_ID ||
                          process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (hasCredentials) {
      initializeApp({
        credential: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
          ? cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON))
          : applicationDefault(),
        storageBucket,
      });
    } else if (process.env.NODE_ENV !== 'production') {
      // For development, try to initialize with minimal config
      console.warn('Firebase admin credentials not found, some features may not work');
    }
  } catch (error) {
    console.warn('Failed to initialize Firebase admin:', error);
    // Don't throw error during build time
  }
}

// Safe getter functions that handle missing Firebase
function getAdminApp(): App | null {
  const apps = getApps();
  return apps.length > 0 ? apps[0] : null;
}

function getAdminAuth() {
  const app = getAdminApp();
  if (!app) {
    throw new Error('Firebase admin not initialized');
  }
  return getAuth(app);
}

function getAdminStorage() {
  const app = getAdminApp();
  if (!app) {
    throw new Error('Firebase admin not initialized');
  }
  return getStorage(app);
}

export { getAdminAuth as getAuth, getAdminStorage as getStorage }; 