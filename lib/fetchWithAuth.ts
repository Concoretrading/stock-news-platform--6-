import { getIdToken } from './firebase-services';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const idToken = await getIdToken();
  const headers = {
    ...(options.headers || {}),
    Authorization: idToken ? `Bearer ${idToken}` : '',
  };
  return fetch(url, { ...options, headers });
} 