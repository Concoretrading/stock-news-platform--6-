import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // Use the service account JSON from the environment variable (for Vercel)
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    : undefined;
  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    // Optionally add storageBucket, databaseURL, etc.
  });
}

export const getAuth = () => admin.auth();
export const getStorage = () => admin.storage();
export default admin;
