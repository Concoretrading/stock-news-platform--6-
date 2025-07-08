import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/services/auth-service";
import { fetchNews } from "@/lib/services/news-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await verifyAuthToken(idToken);
    } catch (err) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    const catalysts = await fetchNews(userId, {
      ticker: ticker || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined
    });

    return NextResponse.json({ success: true, data: catalysts });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch news" }, { status: 500 });
  }
}
