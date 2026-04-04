import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // Check if we have the necessary credentials to initialize
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n')
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️ Firebase Admin credentials missing. Skipping initialization (expected during build).');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

// Export admin services only if initialized, otherwise export mocks to prevent build errors
export const adminDb = admin.apps.length ? admin.firestore() : {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => ({}) }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    where: () => ({
      get: () => Promise.resolve({ empty: true, docs: [] })
    }),
    add: () => Promise.resolve({ id: 'mock-id' })
  })
} as any;

export const adminAuth = admin.apps.length ? admin.auth() : {
  verifyIdToken: () => Promise.resolve({ uid: 'mock-uid', email: 'mock@example.com' }),
  getUser: () => Promise.resolve({ uid: 'mock-uid' })
} as any;

export const adminStorage = admin.apps.length ? admin.storage() : {
  bucket: () => ({
    file: () => ({
      save: () => Promise.resolve(),
      getSignedUrl: () => Promise.resolve(['http://mock-url'])
    })
  })
} as any;