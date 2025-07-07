import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { earningsFetcher } from '@/lib/earnings-data-fetcher';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const db = getFirestore();
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// GET: Fetch earnings calendar data
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('401 Unauthorized: Missing or invalid Authorization header:', authHeader);
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err) {
      console.error('401 Unauthorized: Invalid or expired token:', err);
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }
    const userId = decodedToken.uid;
    console.log('Decoded token for GET:', decodedToken.email, decodedToken.uid);

    const { searchParams } = new URL(request.url);
    const stockTicker = searchParams.get('stockTicker');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = db.collection('earnings_calendar');

    if (stockTicker) {
      query = query.where('stockTicker', '==', stockTicker.toUpperCase()) as any;
    }

    if (startDate && endDate) {
      query = query.where('earningsDate', '>=', startDate)
                   .where('earningsDate', '<=', endDate) as any;
    }

    const snapshot = await query.orderBy('earningsDate', 'asc').get();
    const earnings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ earnings });
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Update earnings calendar (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('401 Unauthorized: Missing or invalid Authorization header:', authHeader);
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err) {
      console.error('401 Unauthorized: Invalid or expired token:', err);
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }
    const userId = decodedToken.uid;
    console.log('Decoded token for POST:', decodedToken.email, decodedToken.uid);

    // Only allow admin access
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      console.error('403 Forbidden: User is not admin:', decodedToken.email);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, data } = await request.json();

    if (action === 'fetch_and_update') {
      return await fetchAndUpdateEarnings();
    } else if (action === 'add_manual') {
      return await addManualEarnings(data);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating earnings calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function fetchAndUpdateEarnings() {
  try {
    // Fetch earnings data from Alpha Vantage
    const earnings = await fetchEarningsFromAlphaVantage();
    
    let updated = 0;
    let added = 0;
    let errors = 0;

    for (const earning of earnings) {
      try {
        // Check if earnings already exists
        const existingSnap = await db.collection('earnings_calendar')
          .where('stockTicker', '==', earning.stockTicker)
          .where('earningsDate', '==', earning.earningsDate)
          .get();

        if (existingSnap.empty) {
          // Add new earnings
          await db.collection('earnings_calendar').add({
            ...earning,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'alpha_vantage'
          });
          added++;
        } else {
          // Update existing earnings
          const docId = existingSnap.docs[0].id;
          await db.collection('earnings_calendar').doc(docId).update({
            ...earning,
            updatedAt: new Date().toISOString(),
            source: 'alpha_vantage'
          });
          updated++;
        }
      } catch (error) {
        console.error(`Error processing earnings for ${earning.stockTicker}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      message: 'Earnings calendar updated successfully',
      stats: { added, updated, errors, total: earnings.length }
    });
  } catch (error) {
    console.error('Error fetching earnings from Alpha Vantage:', error);
    return NextResponse.json({ error: 'Failed to fetch earnings data' }, { status: 500 });
  }
}

async function addManualEarnings(data: any) {
  try {
    const { stockTicker, earningsDate, earningsType, isConfirmed = true, notes } = data;

    if (!stockTicker || !earningsDate) {
      return NextResponse.json({ 
        error: 'Stock ticker and earnings date are required' 
      }, { status: 400 });
    }

    const earnings = {
      stockTicker: stockTicker.toUpperCase(),
      earningsDate,
      earningsType: earningsType || 'After Close',
      isConfirmed,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'manual'
    };

    const docRef = await db.collection('earnings_calendar').add(earnings);

    return NextResponse.json({
      id: docRef.id,
      ...earnings,
      message: 'Manual earnings added successfully'
    });
  } catch (error) {
    console.error('Error adding manual earnings:', error);
    return NextResponse.json({ error: 'Failed to add manual earnings' }, { status: 500 });
  }
}

async function fetchEarningsFromAlphaVantage() {
  try {
    // Get earnings for next 2 months
    const response = await fetch(
      `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${ALPHA_VANTAGE_API_KEY}`
    )
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from Alpha Vantage:', error);
    throw error;
  }
}

async function storeEarningsInFirebase(earnings: any[]) {
  try {
    const batch = db.batch();
    
    // Create a collection for earnings data
    const earningsRef = db.collection('earnings_calendar');
    
    // Clear existing earnings data
    const existingDocs = await earningsRef.get();
    existingDocs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Store new earnings data
    earnings.forEach(earning => {
      const docRef = earningsRef.doc();
      batch.set(docRef, {
        ...earning,
        timestamp: new Date(),
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error storing in Firebase:', error);
    throw error;
  }
} 