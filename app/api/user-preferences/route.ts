import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, getAuth } from '@/lib/firebase-admin'

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

    // Get user preferences
    const prefsDoc = await db.collection('users').doc(userId).collection('preferences').doc('general').get()
    
    const data = prefsDoc.exists ? prefsDoc.data() : { hasSeenOnboarding: false }
    
    return NextResponse.json({ 
      success: true, 
      data 
    })
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch user preferences' 
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
    const { hasSeenOnboarding } = body

    // Save user preferences
    await db.collection('users').doc(userId).collection('preferences').doc('general').set({
      hasSeenOnboarding: hasSeenOnboarding || false,
      updatedAt: new Date()
    }, { merge: true })
    
    return NextResponse.json({ 
      success: true, 
      message: 'User preferences saved successfully' 
    })
  } catch (error) {
    console.error('Error saving user preferences:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save user preferences' 
    }, { status: 500 })
  }
} 