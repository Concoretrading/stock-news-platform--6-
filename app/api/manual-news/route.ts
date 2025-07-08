import { NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/services/auth-service"
import { addManualNews } from "@/lib/services/news-service"
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    let decodedToken;
    try {
      decodedToken = await verifyAuthToken(idToken)
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }
    const userId = decodedToken.uid

    const body = await request.json()
    const id = await addManualNews(userId, body)

    return NextResponse.json({
      success: true,
      message: "News entry saved successfully",
      id
    })
  } catch (error) {
    console.error('Error saving manual news:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save news entry'
    }, { status: 500 });
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
      decodedToken = await verifyAuthToken(idToken)
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
