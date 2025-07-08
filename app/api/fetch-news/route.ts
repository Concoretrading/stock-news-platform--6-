import { NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/services/auth-service"
import { fetchNews } from "@/lib/services/news-service"

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let decodedToken;
    try {
      decodedToken = await verifyAuthToken(idToken)
    } catch (err) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }
    const userId = decodedToken.uid

    const news = await fetchNews(userId)
    return NextResponse.json({ success: true, news })
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch news'
    }, { status: 500 });
  }
}
