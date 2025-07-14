import { NextRequest, NextResponse } from "next/server";
import { getAuth, getFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = await getFirestore();
    
    const authHeader = request.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // Fetch catalysts from database
    let query = db.collection('catalysts').where('userId', '==', userId);
    
    if (ticker) {
      query = query.where('stockTickers', 'array-contains', ticker.toUpperCase());
    }
    
    const catalystsSnap = await query.orderBy('date', 'desc').limit(300).get();
    const catalysts = catalystsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, data: catalysts });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch news" }, { status: 500 });
  }
}
