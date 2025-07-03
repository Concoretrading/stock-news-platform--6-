import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get("limit") || "20"
  const ticker = searchParams.get("ticker")

  try {
    let query = supabase
      .from("twitter_tweets")
      .select(`
        *,
        twitter_handles!inner(
          handle,
          display_name,
          profile_image_url,
          is_active
        )
      `)
      .eq("twitter_handles.is_active", true)
      .order("posted_at", { ascending: false })
      .limit(Number.parseInt(limit))

    // Filter by ticker if provided
    if (ticker) {
      query = query.contains("mentioned_tickers", [ticker.toUpperCase()])
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error("Error fetching tweets:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch tweets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { tweets } = await request.json()

    // This would be called by a webhook or scheduled job
    // In a real implementation, this would process tweets from Twitter API
    const { data, error } = await supabase.from("twitter_tweets").insert(tweets).select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Tweets stored successfully",
      data: data,
    })
  } catch (error) {
    console.error("Error storing tweets:", error)
    return NextResponse.json({ success: false, error: "Failed to store tweets" }, { status: 500 })
  }
}
