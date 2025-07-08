import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/firebase-admin"
import { getFirestore } from "firebase-admin/firestore"

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const db = getFirestore();
    
    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let decodedToken;
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken)
    } catch (err) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }
    const userId = decodedToken.uid

    // Simple mock news data for now
    const news = [
      {
        id: '1',
        headline: 'Market Update: Tech stocks rally',
        summary: 'Technology stocks continue their upward trend',
        source: 'Mock News',
        publishedAt: new Date().toISOString(),
        ticker: 'TECH'
      }
    ];

    return NextResponse.json({ success: true, news })
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch news'
    }, { status: 500 });
  }
}
