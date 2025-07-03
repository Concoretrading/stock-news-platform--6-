import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get("ticker")

    if (!ticker) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
    }

    // Mock catalyst count - in a real app, this would query your database
    const mockCount = Math.floor(Math.random() * 50) + 10

    return NextResponse.json({ count: mockCount })
  } catch (error) {
    console.error("Error fetching catalyst count:", error)
    return NextResponse.json({ error: "Failed to fetch catalyst count" }, { status: 500 })
  }
}
