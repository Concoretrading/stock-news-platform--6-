import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/firebase-admin";
import { getWatchlistTickers, analyzeScreenshot } from "@/lib/services/screenshot-service";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // Get user's watchlist tickers
    const watchlistTickers = await getWatchlistTickers(userId);

    // Process the screenshot
    const formData = await request.formData();
    const image = formData.get("image") as File;
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert image to buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Analyze the screenshot
    const result = await analyzeScreenshot(userId, buffer, image.type);

    return NextResponse.json({
      success: true,
      matches: result.matches,
      extractedText: result.extractedText,
      headline: result.headline,
      date: result.date,
      price: result.price,
      source: result.source,
      imageStoragePath: result.imageStoragePath,
      newsEntryResults: result.newsEntryResults,
      message: result.message
    });
  } catch (error) {
    console.error("Screenshot analysis error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to analyze screenshot",
    }, { status: 500 });
  }
}
