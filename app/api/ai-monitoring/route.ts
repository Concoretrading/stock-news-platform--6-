import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const db = adminDb;

    // Authenticate user
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    const userId = decodedToken.uid

    // Simple mock monitoring data
    const subscriptions: any[] = []

    return NextResponse.json({
      success: true,
      subscriptions
    })
  } catch (error) {
    console.error('Error fetching AI monitoring:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch AI monitoring subscriptions'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = adminDb;

    // Authenticate user
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    const userId = decodedToken.uid

    const body = await request.json()

    return NextResponse.json({
      success: true,
      message: 'AI monitoring subscription updated'
    })
  } catch (error) {
    console.error('Error updating AI monitoring:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update AI monitoring subscription'
    }, { status: 500 })
  }
} 