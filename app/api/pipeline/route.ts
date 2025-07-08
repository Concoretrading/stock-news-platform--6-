import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const db = getFirestore();
    
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
    
    // Only allow admin user
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Simple pipeline processing simulation
    const results = {
      processed: 0,
      success: 0,
      errors: 0,
      message: 'Pipeline processing completed'
    }
    
    return NextResponse.json({ 
      success: true, 
      results 
    })
  } catch (error) {
    console.error('Error in pipeline processing:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process pipeline' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Pipeline endpoint is up.' });
} 