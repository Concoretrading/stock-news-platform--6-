import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Fetch earnings calendar data
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await (await getAuth()).verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Simple mock earnings data for now
    const earnings = [
      {
        id: '1',
        stockTicker: 'AAPL',
        companyName: 'Apple Inc.',
        earningsDate: '2024-01-25',
        isConfirmed: true
      },
      {
        id: '2', 
        stockTicker: 'MSFT',
        companyName: 'Microsoft Corporation',
        earningsDate: '2024-01-24',
        isConfirmed: true
      }
    ];

    return NextResponse.json({
      success: true,
      data: earnings
    });

  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch earnings data'
    }, { status: 500 });
  }
}

// POST: Update earnings calendar (admin only)
export async function POST(request: NextRequest) {
  try {
    const db = getFirestore();
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await (await getAuth()).verifyIdToken(token);
      // Simple admin check
      if (decodedToken.email !== 'handrigannick@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
      }
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();
    
    // Add earnings event to database
    await db.collection('earnings_calendar').add({
      ...data,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Earnings calendar updated successfully'
    });
  } catch (error) {
    console.error('Error updating earnings calendar:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update earnings calendar'
    }, { status: 500 });
  }
} 