import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(request: NextRequest) {
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

    // Get the dates to delete from query parameters
    const { searchParams } = new URL(request.url)
    const dates = searchParams.get('dates')
    
    if (!dates) {
      return NextResponse.json({ error: 'No dates specified' }, { status: 400 })
    }
    
    const dateArray = dates.split(',').map(d => d.trim())
    console.log(`Deleting earnings for dates:`, dateArray)
    
    // Delete earnings events for the specified dates
    const earningsRef = db.collection('earnings_calendar');
    let deletedCount = 0;
    
    for (const date of dateArray) {
      // Query for earnings events on this specific date
      const snapshot = await earningsRef.where('earningsDate', '==', date).get();
      
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          deletedCount++;
        });
        await batch.commit();
        console.log(`Deleted ${snapshot.docs.length} earnings events for date: ${date}`);
      } else {
        console.log(`No earnings events found for date: ${date}`);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} earnings events for dates: ${dateArray.join(', ')}`,
      deletedCount: deletedCount,
      dates: dateArray
    })

  } catch (error) {
    console.error('Delete earnings by date error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete earnings events', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 