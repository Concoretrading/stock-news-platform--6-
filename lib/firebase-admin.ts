import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

if (!getApps().length) {
  initializeApp({
    credential: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      ? cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON))
      : applicationDefault(),
  });
}

export { getAuth, getStorage }; 