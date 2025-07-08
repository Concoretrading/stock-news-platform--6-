import { getAuth } from '@/lib/firebase-admin';

export async function verifyToken(token: string) {
  return getAuth().verifyIdToken(token);
}

export function getEnvironmentCheck() {
  return {
    GOOGLE_APPLICATION_CREDENTIALS_JSON: {
      exists: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      length: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.length || 0,
      firstChars: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.substring(0, 50) || 'N/A',
      lastChars: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.substring(-50) || 'N/A'
    },
    GOOGLE_CLOUD_FUNCTION_URL: {
      exists: !!process.env.GOOGLE_CLOUD_FUNCTION_URL,
      value: process.env.GOOGLE_CLOUD_FUNCTION_URL || 'N/A'
    }
  };
} 