import { NextRequest, NextResponse } from 'next/server'
import { getAuth, getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = await getFirestore();
    
    // Authenticate user
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    
    let userId: string;
    
    // Development bypass for localhost
    if (idToken === 'dev-token-localhost') {
      userId = 'test-user-localhost';
    } else {
      let decodedToken;
      try {
        decodedToken = await (await getAuth()).verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    // Get timeline preferences
    const prefsDoc = await db.collection('users').doc(userId).collection('timelinePrefs').doc('prefs').get()
    
    const data = prefsDoc.exists ? prefsDoc.data() : { customMonths: [], deletedMonths: [] }
    
    return NextResponse.json({ 
      success: true, 
      data 
    })
  } catch (error) {
    console.error('Error fetching timeline preferences:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch timeline preferences' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getFirestore();
    
    // Authenticate user
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    
    let userId: string;
    
    // Development bypass for localhost
    if (idToken === 'dev-token-localhost') {
      userId = 'test-user-localhost';
    } else {
      let decodedToken;
      try {
        decodedToken = await (await getAuth()).verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    const body = await request.json()
    const { customMonths, deletedMonths } = body

    // Save timeline preferences
    await db.collection('users').doc(userId).collection('timelinePrefs').doc('prefs').set({
      customMonths: customMonths || [],
      deletedMonths: deletedMonths || []
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Timeline preferences saved successfully' 
    })
  } catch (error) {
    console.error('Error saving timeline preferences:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save timeline preferences' 
    }, { status: 500 })
  }
} 