import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore()

// Helper to fetch current price for a ticker (reuse your price API logic)
async function getCurrentPrice(ticker: string): Promise<number | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stock-prices?tickers=${ticker}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.prices?.[ticker]?.price ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const specificTicker = searchParams.get('ticker')
    const currentPriceParam = searchParams.get('currentPrice')
    
    // Authenticate user
    const authHeader = request.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    let decodedToken
    try {
      decodedToken = await getAuth().verifyIdToken(idToken)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    const userId = decodedToken.uid

    // Get user's watchlist
    const stocksSnap = await db.collection('stocks').where('userId', '==', userId).get()
    const stocks = stocksSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }))

    // Filter stocks if specific ticker is provided
    const stocksToCheck = specificTicker 
      ? stocks.filter(stock => stock.ticker === specificTicker.toUpperCase())
      : stocks

    // Get alert settings for all stocks
    const alertSettingsSnap = await db.collection('stock_alert_settings').where('userId', '==', userId).get()
    const alertSettings: Record<string, any> = {}
    alertSettingsSnap.docs.forEach(doc => {
      const data = doc.data()
      alertSettings[data.ticker] = data
    })

    // For each stock, check for triggered alerts
    const triggeredAlerts = []
    for (const stock of stocksToCheck) {
      const ticker = stock.ticker
      const settings = alertSettings[ticker]
      if (!settings) continue
      const { tolerancePoints, minimumMove } = settings
      
      // Get current price - use provided price or fetch from API
      let currentPrice: number | null
      if (specificTicker && currentPriceParam) {
        currentPrice = parseFloat(currentPriceParam)
      } else {
        currentPrice = await getCurrentPrice(ticker)
      }
      if (currentPrice === null) continue
      
      // Get all catalysts for this stock with valid priceBefore and priceAfter
      const catalystsSnap = await db.collection('catalysts')
        .where('userId', '==', userId)
        .where('stockTickers', 'array-contains', ticker)
        .get()
      const catalysts = catalystsSnap.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
        .filter(c => typeof c.priceBefore === 'number' && typeof c.priceAfter === 'number')
        .filter(c => Math.abs(c.priceAfter - c.priceBefore) >= minimumMove)
      if (catalysts.length === 0) continue
      
      // Check for price revisit
      for (const catalyst of catalysts) {
        if (Math.abs(currentPrice - catalyst.priceBefore) <= tolerancePoints) {
          triggeredAlerts.push({
            ticker,
            catalystId: catalyst.id,
            catalystTitle: catalyst.title || '',
            priceBefore: catalyst.priceBefore,
            priceAfter: catalyst.priceAfter,
            currentPrice,
            tolerancePoints,
            minimumMove,
            triggeredAt: new Date().toISOString(),
          })
        }
      }
    }
    return NextResponse.json({ alerts: triggeredAlerts })
  } catch (error) {
    console.error('Error checking alerts:', error)
    return NextResponse.json({ error: 'Failed to check alerts' }, { status: 500 })
  }
} 