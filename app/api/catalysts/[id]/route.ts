import { NextRequest, NextResponse } from 'next/server'
import { getAuth, getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getFirestore();
    const catalystId = params.id;
    
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
    const { title, description, date, source, priceBefore, priceAfter } = body

    // Update the catalyst
    const updateData: any = {
      title,
      description: description || null,
      source: source || null,
    }
    
    if (date) updateData.date = date
    if (priceBefore !== undefined) updateData.priceBefore = priceBefore ? Number(priceBefore) : null
    if (priceAfter !== undefined) updateData.priceAfter = priceAfter ? Number(priceAfter) : null
    
    await db.collection('catalysts').doc(catalystId).update(updateData)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Catalyst updated successfully' 
    })
  } catch (error) {
    console.error('Error updating catalyst:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update catalyst' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getFirestore();
    const catalystId = params.id;
    
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

    // Delete the catalyst
    await db.collection('catalysts').doc(catalystId).delete()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Catalyst deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting catalyst:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete catalyst' 
    }, { status: 500 })
  }
} 