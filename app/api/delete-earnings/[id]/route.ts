import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Allow any authenticated user to delete earnings events
    // No admin restriction needed

    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Delete the specific earnings event
    const earningsRef = db.collection('earnings_calendar').doc(id);
    const doc = await earningsRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Earnings event not found' }, { status: 404 })
    }

    await earningsRef.delete();
    
    console.log(`Deleted earnings event: ${id}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Earnings event deleted successfully',
      deletedId: id
    })

  } catch (error) {
    console.error('Delete earnings event error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete earnings event', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 