import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const db = getFirestore();
    
    // Authenticate user (admin only)
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    let decodedToken
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    
    // Only allow admin user
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Simulate AI data collection process
    const results = {
      ownData: { processed: 5, eventsFound: 2 },
      websiteScan: { processed: 3, eventsFound: 1 },
      earningsTranscripts: { processed: 2, eventsFound: 3 },
      totalEvents: 6
    }
    
    return NextResponse.json({ 
      success: true, 
      results,
      message: 'AI data collection completed successfully' 
    })
  } catch (error) {
    console.error('Error in AI data collection:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process AI data collection' 
    }, { status: 500 })
  }
} 