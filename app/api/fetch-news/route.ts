import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/firebase-admin"
import { getFirestore } from "firebase-admin/firestore"

const db = getFirestore()

export async function POST(request: NextRequest) {
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

    // This would be a scheduled job to fetch news from an external API
    // For demo, use mock data
    const mockNews = [
      {
        headline: "Apple announces new iPhone models with improved AI capabilities",
        snippet: "The tech giant revealed its latest smartphone lineup featuring enhanced machine learning features...",
        content: "Full article content would go here...",
        source: "TechCrunch",
        url: "https://example.com/article1",
        published_at: new Date().toISOString(),
        tickers: ["AAPL"],
      },
      {
        headline: "Microsoft and Google partner on new AI initiative",
        snippet:
          "The two tech giants announced a surprising partnership focused on artificial intelligence standards...",
        content: "Full article content would go here...",
        source: "The Verge",
        url: "https://example.com/article2",
        published_at: new Date().toISOString(),
        tickers: ["MSFT", "GOOGL"],
      },
    ]

    // Process each news article
    for (const article of mockNews) {
      // Insert news article as a catalyst
      const catalystDoc = await db.collection("catalysts").add({
        userId,
        stockTickers: article.tickers.map(t => t.toUpperCase()),
        title: article.headline,
        description: article.content,
          snippet: article.snippet,
          source: article.source,
          url: article.url,
        date: article.published_at.split("T")[0],
        isManual: false,
        createdAt: new Date().toISOString(),
      })
      // No need for a join table; stockTickers array handles association
    }

    return NextResponse.json({
      success: true,
      message: "News fetched and stored successfully",
    })
  } catch (error) {
    console.error("Error fetching and storing news:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch and store news" }, { status: 500 })
  }
}
