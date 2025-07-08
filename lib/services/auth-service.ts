import { getAuth } from '@/lib/firebase-admin';

export async function verifyAuthToken(token: string) {
  try {
    const auth = await getAuth();
    return auth.verifyIdToken(token);
  } catch (error) {
    // During build time, Firebase admin may not be initialized
    if (error instanceof Error && error.message.includes('Firebase admin not available during build time')) {
      throw new Error('Authentication service not available during build');
    }
    throw error;
  }
}

export async function verifyAdminToken(token: string) {
  try {
    const auth = await getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      throw new Error('Admin access required');
    }
    return decodedToken;
  } catch (error) {
    // During build time, Firebase admin may not be initialized
    if (error instanceof Error && error.message.includes('Firebase admin not available during build time')) {
      throw new Error('Authentication service not available during build');
    }
    throw error;
  }
} 