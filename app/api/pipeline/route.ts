import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { setCachedPrice } from '@/lib/redis';

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

export async function POST(request: NextRequest) {
  try {
    const { ticker, price } = await request.json();
    if (!ticker || typeof price !== 'number') {
      return NextResponse.json({ success: false, error: 'Missing ticker or price' }, { status: 400 });
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
    const alertsRef = collection(db, 'alerts');
    const alertsQ = query(alertsRef, where('ticker', '==', upperTicker), where('isActive', '==', true));
    const alertsSnap = await getDocs(alertsQ);
    const triggered = [];
    for (const alertDoc of alertsSnap.docs) {
      const alert = alertDoc.data();
      let shouldTrigger = false;
      if (alert.direction === 'above' && price >= alert.targetPrice) shouldTrigger = true;
      if (alert.direction === 'below' && price <= alert.targetPrice) shouldTrigger = true;
      if (alert.direction === 'both' && (price >= alert.targetPrice || price <= alert.targetPrice)) shouldTrigger = true;
      if (shouldTrigger) {
        await updateDoc(doc(db, 'alerts', alertDoc.id), {
          isActive: false,
          triggeredAt: new Date().toISOString(),
          lastTriggeredPrice: price,
        });
        triggered.push({ id: alertDoc.id, ...alert });
      }
    }

    return NextResponse.json({ success: true, updatedUsers, triggered });
  } catch (error) {
    console.error('Error in /api/pipeline:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Pipeline endpoint is up.' });
} 