import { type NextRequest, NextResponse } from "next/server"
import { getFirestore } from 'firebase-admin/firestore'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get("ticker")
    const period = searchParams.get("period") || "week"

    if (!ticker) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
    }

    const db = getFirestore()
    const now = new Date()
    let startDate: Date
    let endDate = now

    // Calculate date range based on period
    switch (period) {
      case "month":
        startDate = startOfMonth(subMonths(now, 1))
        endDate = endOfMonth(now)
        break
      case "week":
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        break
    }

    // Query catalysts collection for the specified ticker and date range
    const snapshot = await db.collection('catalysts')
      .where('stockTickers', 'array-contains', ticker)
      .where('date', '>=', startDate.toISOString())
      .where('date', '<=', endDate.toISOString())
      .get()
    const count = snapshot.size

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error fetching catalyst count:", error)
    return NextResponse.json({ error: "Failed to fetch catalyst count" }, { status: 500 })
  }
}
