import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/firebase-admin"
import { getFirestore } from "firebase-admin/firestore"

const db = getFirestore()

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }
    let decodedToken
    try {
      decodedToken = await getAuth().verifyIdToken(idToken)
    } catch (err) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }
    const userId = decodedToken.uid

  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")
  const fromDate = searchParams.get("from")
  const toDate = searchParams.get("to")
    // importance and impact are not used in Firestore version, but can be added as fields

    let catalystsQuery = db.collection("catalysts").where("userId", "==", userId)
    if (ticker) {
      catalystsQuery = catalystsQuery.where("stockTickers", "array-contains", ticker.toUpperCase())
    }
    if (fromDate) {
      catalystsQuery = catalystsQuery.where("date", ">=", fromDate)
    }
    if (toDate) {
      catalystsQuery = catalystsQuery.where("date", "<=", toDate)
    }
    // Firestore does not support multiple orderBy on different fields unless they are indexed
    const catalystsSnap = await catalystsQuery.orderBy("date", "desc").get()
    const catalysts = catalystsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json({ success: true, data: catalysts })
  } catch (error) {
    console.error("Error fetching news:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch news" }, { status: 500 })
  }
}
