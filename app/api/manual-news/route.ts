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
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    let decodedToken
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken)
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }
    const userId = decodedToken.uid

    const body = await request.json()
    const { stockSymbol, headline, body: newsBody, date, imagePath, priceBefore, priceAfter, source } = body

    if (!stockSymbol || !headline || !date) {
      return NextResponse.json({ success: false, error: 'Stock symbol, headline, and date are required' }, { status: 400 })
    }

    // Add news entry to catalysts collection
    const catalystData = {
      userId,
      stockTickers: [stockSymbol.toUpperCase()],
      title: headline,
      description: newsBody || null,
      date: new Date(date).toISOString().split('T')[0],
      imageUrl: imagePath || null,
      isManual: true,
      createdAt: new Date().toISOString(),
      priceBefore: priceBefore ? Number(priceBefore) : null,
      priceAfter: priceAfter ? Number(priceAfter) : null,
      source: source || null,
    }

    const docRef = await db.collection('catalysts').add(catalystData)
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: `News catalyst added for ${stockSymbol}` 
    })
  } catch (error) {
    console.error('Error adding manual news:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add news catalyst' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getFirestore()
    
    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    let decodedToken
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken)
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }
    const userId = decodedToken.uid

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const ticker = searchParams.get("ticker")

    let catalystsQuery = db.collection("catalysts")
      .where("userId", "==", userId)
      .where("isManual", "==", true)
    if (ticker) {
      catalystsQuery = catalystsQuery.where("stockTickers", "array-contains", ticker.toUpperCase())
    }
    // Firestore does not support full text search natively, so 'q' is ignored unless you use a 3rd party search
    const catalystsSnap = await catalystsQuery.orderBy("createdAt", "desc").get()
    const catalysts = catalystsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json({ success: true, data: catalysts })
  } catch (error) {
    console.error("Error fetching manual news:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch news" }, { status: 500 })
  }
}
