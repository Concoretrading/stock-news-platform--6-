import { getAuth } from '@/lib/firebase-admin';

export async function verifyAuthToken(token: string) {
  return getAuth().verifyIdToken(token);
}

export async function verifyAdminToken(token: string) {
  const decodedToken = await getAuth().verifyIdToken(token);
  if (decodedToken.email !== 'handrigannick@gmail.com') {
    throw new Error('Admin access required');
  }
  return decodedToken;
} 