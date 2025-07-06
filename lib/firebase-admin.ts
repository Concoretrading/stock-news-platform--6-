import { initializeApp, cert, getApps, applicationDefault, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Hardcode the default bucket for testing
const storageBucket = 'concorenews.firebasestorage.app';

if (!getApps().length) {
  initializeApp({
    credential: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      ? cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON))
      : applicationDefault(),
    storageBucket,
  });
}

const app: App = getApps()[0];

// Log project ID and bucket for debugging
// console.log('Firebase Admin Project ID:', app.options.projectId);
// console.log('Firebase Admin Storage Bucket:', app.options.storageBucket);

export { getAuth, getStorage }; 