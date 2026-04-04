import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ valid: false, error: 'No token provided' })
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      return NextResponse.json({
        valid: true,
        uid: decodedToken.uid,
        email: decodedToken.email
      })
    } catch (err) {
      return NextResponse.json({ valid: false, error: 'Invalid token' })
    }
  } catch (error) {
    console.error('Error testing token:', error)
    return NextResponse.json({ valid: false, error: 'Server error' })
  }
} 