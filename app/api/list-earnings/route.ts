import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const db = await getFirestore();
    
    // Authenticate user
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    let decodedToken
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get all earnings events from database
    const earningsRef = db.collection('earnings_calendar');
    const snapshot = await earningsRef.get();
    
    const earnings: any[] = [];
    if (!snapshot.empty) {
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        earnings.push({
          id: doc.id,
          ...data
        });
      });
    }
    
    console.log(`Found ${earnings.length} earnings events in database:`);
    earnings.forEach(earning => {
      console.log(`- ${earning.stockTicker}: ${earning.earningsDate} (${earning.companyName})`);
    });
    
    return NextResponse.json({ 
      success: true, 
      earnings: earnings,
      count: earnings.length
    })

  } catch (error) {
    console.error('List earnings error:', error)
    return NextResponse.json({ 
      error: 'Failed to list earnings events', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 