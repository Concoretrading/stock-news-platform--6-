import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const db = getFirestore()
    
    // Authenticate user
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
    const userId = decodedToken.uid

    // Get the total count of catalysts for this user
    const catalystsSnap = await db.collection('catalysts')
      .where('userId', '==', userId)
      .get()
    
    const totalCount = catalystsSnap.size
    
    return NextResponse.json({ count: totalCount })
  } catch (error) {
    console.error('Error getting catalyst count:', error)
    return NextResponse.json({ error: 'Failed to get catalyst count' }, { status: 500 })
  }
}
