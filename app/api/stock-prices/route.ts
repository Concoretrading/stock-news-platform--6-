import { NextRequest, NextResponse } from "next/server"
import { getCachedPrice, setCachedPrice } from "@/lib/redis"

const ALPACA_API_KEY = process.env.ALPACA_API_KEY
const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET
const ALPACA_BASE_URL = "https://paper-api.alpaca.markets"
const ALPACA_DATA_URL = "https://data.alpaca.markets/v2/stocks"

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
    const results: Record<string, number | null> = {}
    const tickersToFetch: string[] = []
    
    // Check cache first
    for (const ticker of tickers) {
      const cached = await getCachedPrice(ticker)
      if (cached) {
        results[ticker] = cached.price
      } else {
        tickersToFetch.push(ticker)
      }
    }
    
    // Only fetch uncached tickers
    if (tickersToFetch.length > 0) {
      await Promise.all(
        tickersToFetch.map(async (ticker) => {
          try {
            const res = await fetch(`${ALPACA_DATA_URL}/${ticker}/quotes/latest`, {
              headers: {
                "APCA-API-KEY-ID": ALPACA_API_KEY,
                "APCA-API-SECRET-KEY": ALPACA_API_SECRET,
              },
              cache: "no-store"
            })
            if (!res.ok) throw new Error(`Failed to fetch price for ${ticker}`)
            const data = await res.json()
            const price = data.quote?.ap || null
            
            if (price !== null) {
              // Cache the result
              await setCachedPrice(ticker, price)
            }
            
            results[ticker] = price
          } catch (err) {
            results[ticker] = null
          }
        })
      )
    }
    
    return NextResponse.json({ prices: results })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 })
  }
} 