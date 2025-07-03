import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/firebase-admin"
import { getFirestore } from "firebase-admin/firestore"

const db = getFirestore()

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    let decodedToken
    try {
      decodedToken = await getAuth().verifyIdToken(idToken)
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }
    const userId = decodedToken.uid

    // 1. Parse body
    const body = await request.json()
    const { stockSymbol, headline, body: newsBody, date, imageUrl, priceBefore, priceAfter, source } = body

    if (!stockSymbol || !headline || !newsBody || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 2. Insert or get stock (in Firestore, just store ticker info in catalyst)
    // 3. Insert news article (manual catalyst)
    const normalizedDate = new Date(date)
    if (isNaN(normalizedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format." }, { status: 400 })
    }
    const catalystDoc = await db.collection("catalysts").add({
      userId,
      stockTickers: [stockSymbol.toUpperCase()],
      title: headline,
      description: newsBody,
      date: normalizedDate.toISOString().split("T")[0],
      imageUrl: imageUrl || null,
      isManual: true,
      createdAt: new Date().toISOString(),
      priceBefore: priceBefore ? Number(priceBefore) : null,
      priceAfter: priceAfter ? Number(priceAfter) : null,
      source: source || null,
    })
    return NextResponse.json({
      success: true,
      message: "News entry saved successfully",
      id: catalystDoc.id,
    })
  } catch (error) {
    console.error("Error saving news:", error)
    return NextResponse.json({ success: false, error: "Failed to save news entry" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    let decodedToken
    try {
      decodedToken = await getAuth().verifyIdToken(idToken)
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
