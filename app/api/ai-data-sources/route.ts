import { NextRequest, NextResponse } from 'next/server'
import { getAuth, getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const db = await getFirestore()
    
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

    // Simple mock data sources
    const dataSources: any[] = []
    
    return NextResponse.json({ 
      success: true, 
      data: dataSources 
    })
  } catch (error) {
    console.error('Error fetching AI data sources:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch AI data sources' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    
    // Only allow admin user
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Data source added successfully' 
    })
  } catch (error) {
    console.error('Error adding AI data source:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add AI data source' 
    }, { status: 500 })
  }
} 