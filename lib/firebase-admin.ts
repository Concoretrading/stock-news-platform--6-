import { initializeApp, cert, getApps, applicationDefault, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Use environment variable for bucket
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!storageBucket) {
  throw new Error('Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET env variable');
}

const app: App = !getApps().length
  ? initializeApp({
      credential: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
        ? cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON))
        : applicationDefault(),
      storageBucket,
    })
  : getApps()[0];

// Log project ID and bucket for debugging
console.log('Firebase Admin Project ID:', app.options.projectId);
console.log('Firebase Admin Storage Bucket:', app.options.storageBucket);

export { getAuth, getStorage }; 