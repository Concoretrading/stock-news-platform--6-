import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { setCachedPrice } from '@/lib/redis';
import { checkAlerts } from './alerts-service';

// Firebase config from env vars
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Initialize Firebase app if not already initialized
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

export async function updatePriceAndCheckAlerts(ticker: string, price: number) {
  if (!ticker || typeof price !== 'number') {
    throw new Error('Missing ticker or price');
  }
  const upperTicker = ticker.toUpperCase();

  // 1. Update Redis cache for the ticker
  await setCachedPrice(upperTicker, price);

  // 2. Update Firestore with the new price for all users who have the ticker on their watchlist
  const stocksRef = collection(db, 'stocks');
  const stocksQ = query(stocksRef, where('ticker', '==', upperTicker));
  const stocksSnap = await getDocs(stocksQ);
  const updatedUsers: string[] = [];
  for (const stockDoc of stocksSnap.docs) {
    await updateDoc(doc(db, 'stocks', stockDoc.id), {
      lastPrice: price,
      lastPriceUpdatedAt: new Date().toISOString(),
    });
    updatedUsers.push(stockDoc.data().userId);
  }

  // 3. Check and trigger alerts for all users with active alerts on that ticker
  const triggered = [];
  for (const userId of updatedUsers) {
    const userTriggered = await checkAlerts(userId, upperTicker, price);
    triggered.push(...userTriggered);
  }

  return {
    updatedUsers,
    triggered
  };
} 