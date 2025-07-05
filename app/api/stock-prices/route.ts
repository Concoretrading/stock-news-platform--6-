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
    const res = await fetch(`${ALPACA_DATA_URL}/${symbol}/bars?timeframe=1Day&limit=2`, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY!,
        "APCA-API-SECRET-KEY": ALPACA_API_SECRET!,
      },
      cache: "no-store"
    })
    if (!res.ok) return null
    const data = await res.json()
    // The most recent bar is the last close
    if (data.bars && data.bars.length > 0) {
      // If today is a trading day, the last bar is today, so use the previous bar
      if (data.bars.length > 1) {
        return data.bars[data.bars.length - 2].c
      } else {
        return data.bars[0].c
      }
    }
    return null
  } catch {
    return null
  }
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
    const marketOpen = await isMarketOpen()
    const results: Record<string, { price: number | null, isLastClose: boolean }> = {}
    const tickersToFetch: string[] = []

    // Check cache first
    for (const ticker of tickers) {
      const cached = await getCachedPrice(ticker)
      if (cached) {
        results[ticker] = { price: cached.price, isLastClose: false }
      } else {
        tickersToFetch.push(ticker)
      }
    }

    if (tickersToFetch.length > 0) {
      await Promise.all(
        tickersToFetch.map(async (ticker) => {
          try {
            if (marketOpen) {
              // Try to get the latest quote
              const res = await fetch(`${ALPACA_DATA_URL}/${ticker}/quotes/latest`, {
                headers: {
                  "APCA-API-KEY-ID": ALPACA_API_KEY!,
                  "APCA-API-SECRET-KEY": ALPACA_API_SECRET!,
                },
                cache: "no-store"
              })
              if (!res.ok) throw new Error(`Failed to fetch price for ${ticker}`)
              const data = await res.json()
              const price = data.quote?.ap || null
              if (price !== null) {
                await setCachedPrice(ticker, price)
                results[ticker] = { price, isLastClose: false }
                return
              }
            }
            // If market is closed or no price, get last close
            const lastClose = await getLastClosePrice(ticker)
            results[ticker] = { price: lastClose, isLastClose: true }
          } catch {
            results[ticker] = { price: null, isLastClose: false }
          }
        })
      )
    }
    return NextResponse.json({ prices: results, marketOpen })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 })
  }
} 