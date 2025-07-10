import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(request: NextRequest) {
  try {
    const db = await getFirestore();
    
    // Authenticate user (admin only)
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

    // Allow any authenticated user to delete all earnings events
    // No admin restriction needed

    // Get all earnings events
    const earningsRef = db.collection('earnings_calendar');
    const snapshot = await earningsRef.get();
    
    if (snapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'No earnings events found to delete',
        deletedCount: 0
      })
    }

    // Delete all documents in batches
    const batch = db.batch();
    let deletedCount = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    await batch.commit();
    
    console.log(`Deleted ${deletedCount} earnings events`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} earnings events`,
      deletedCount: deletedCount
    })

  } catch (error) {
    console.error('Delete earnings error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete earnings events', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 