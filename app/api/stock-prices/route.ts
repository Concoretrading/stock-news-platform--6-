import { NextRequest, NextResponse } from "next/server"
import { getCachedPrice, setCachedPrice } from "@/lib/redis"

const ALPACA_API_KEY = process.env.ALPACA_API_KEY
const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET
const ALPACA_BASE_URL = "https://paper-api.alpaca.markets"
const ALPACA_DATA_URL = "https://data.alpaca.markets/v2/stocks"
const ALPACA_CLOCK_URL = "https://data.alpaca.markets/v2/clock"

async function isMarketOpen() {
  try {
    const res = await fetch(ALPACA_CLOCK_URL, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY!,
        "APCA-API-SECRET-KEY": ALPACA_API_SECRET!,
      },
      cache: "no-store"
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.is_open
  } catch {
    return false
  }
}

async function getLastClosePrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`${ALPACA_DATA_URL}/${symbol}/bars?timeframe=1Day&limit=5`, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY!,
        "APCA-API-SECRET-KEY": ALPACA_API_SECRET!,
      },
      cache: "no-store"
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.bars && data.bars.length > 0) {
      const now = new Date()
      // Find the most recent bar that is before today (skip today if not a trading day)
      for (let i = data.bars.length - 1; i >= 0; i--) {
        const bar = data.bars[i]
        const barDate = new Date(bar.t)
        // Only consider bars before today
        if (
          barDate.getUTCFullYear() < now.getUTCFullYear() ||
          barDate.getUTCMonth() < now.getUTCMonth() ||
          barDate.getUTCDate() < now.getUTCDate()
        ) {
          return bar.c
        }
      }
      // If all bars are from today or future (shouldn't happen), fallback to the last bar
      return data.bars[data.bars.length - 1].c
    }
    return null
  } catch {
    return null
  }
}

async function getMostRecentPrice(symbol: string): Promise<{ price: number | null, priceTime: string | null }> {
  // 1. Try latest quote (live or after-hours)
  try {
    const quoteRes = await fetch(`${ALPACA_DATA_URL}/${symbol}/quotes/latest`, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY!,
        "APCA-API-SECRET-KEY": ALPACA_API_SECRET!,
      },
      cache: "no-store"
    })
    if (quoteRes.ok) {
      const quoteData = await quoteRes.json()
      const price = quoteData.quote?.ap || quoteData.quote?.bp || quoteData.quote?.p || null
      const priceTime = quoteData.quote?.t ? new Date(quoteData.quote.t).toISOString() : null
      if (price && price > 0) {
        return { price, priceTime }
      }
    }
  } catch {}

  // 2. Fallback: Most recent daily bar from last 7 days
  try {
    const barRes = await fetch(`${ALPACA_DATA_URL}/${symbol}/bars?timeframe=1Day&limit=7`, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY!,
        "APCA-API-SECRET-KEY": ALPACA_API_SECRET!,
      },
      cache: "no-store"
    })
    if (barRes.ok) {
      const barData = await barRes.json()
      if (barData.bars && barData.bars.length > 0) {
        // Find the most recent bar with a valid close
        let mostRecentBar = null
        let mostRecentDate = 0
        for (const bar of barData.bars) {
          const barDate = new Date(bar.t).getTime()
          if (bar.c && bar.c > 0 && barDate > mostRecentDate) {
            mostRecentBar = bar
            mostRecentDate = barDate
          }
        }
        if (mostRecentBar) {
          return { price: mostRecentBar.c, priceTime: new Date(mostRecentBar.t).toISOString() }
        }
      }
    }
  } catch {}
  return { price: null, priceTime: null }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tickersParam = searchParams.get("tickers")
  if (!tickersParam) {
    return NextResponse.json({ error: "Missing tickers parameter" }, { status: 400 })
  }
  const tickers = tickersParam.split(",").map(t => t.trim().toUpperCase()).filter(Boolean)
  if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
    return NextResponse.json({ error: "Alpaca API credentials not set" }, { status: 500 })
  }

  try {
    const results: Record<string, { price: number | null, priceTime: string | null }> = {}
    await Promise.all(
      tickers.map(async (ticker) => {
        results[ticker] = await getMostRecentPrice(ticker)
      })
    )
    return NextResponse.json({ prices: results })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 })
  }
} 