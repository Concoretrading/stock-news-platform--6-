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
    const userId = decodedToken.uid

    const body = await request.json()
    
    // Simple mock AI processing result
    const result = {
      processedContent: body,
      monitoredStocks: ['AAPL', 'TSLA', 'NVDA']
    }
    
    return NextResponse.json({ 
      success: true, 
      result 
    })
  } catch (error) {
    console.error('Error processing AI content:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process AI content' 
    }, { status: 500 })
  }
} 