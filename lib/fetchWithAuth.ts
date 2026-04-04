import { getIdToken } from './firebase-services';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let idToken: string | null = null;
  
  // Development bypass for localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    idToken = 'dev-token-localhost';
  } else {
    idToken = await getIdToken();
  }
  
  const headers = {
    ...(options.headers || {}),
    Authorization: idToken ? `Bearer ${idToken}` : '',
  };
  return fetch(url, { ...options, headers });
} 