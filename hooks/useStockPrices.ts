import { useState, useEffect, useCallback } from 'react'

interface StockPrices {
  [ticker: string]: number | null
}

interface UseStockPricesOptions {
  interval?: number // Polling interval in milliseconds
  enabled?: boolean // Whether to enable polling
}

// Helper to check if US market is open (Eastern Time)
function isMarketOpen() {
  const now = new Date()
  // Convert to US Eastern Time
  const utcHour = now.getUTCHours()
  const utcMinute = now.getUTCMinutes()
  // US Eastern is UTC-4 (EDT) or UTC-5 (EST); for simplicity, assume UTC-4 (EDT)
  // For production, use a timezone library for DST
  const estHour = utcHour - 4 < 0 ? utcHour + 20 : utcHour - 4
  const day = now.getUTCDay() // 0 = Sunday, 6 = Saturday
  // Market open: Mon-Fri, 9:30am–4:00pm ET
  if (day === 0 || day === 6) return false // Weekend
  if (estHour < 9 || (estHour === 9 && utcMinute < 30)) return false // Before 9:30am
  if (estHour > 16 || (estHour === 16 && utcMinute > 0)) return false // After 4:00pm
  return true
}

export function useStockPrices(
  tickers: string[],
  options: UseStockPricesOptions = {}
) {
  const { interval = 10000, enabled = true } = options // Default 10 second interval
  const [prices, setPrices] = useState<StockPrices>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    if (!tickers.length) return

    try {
      setLoading(true)
      setError(null)
      
      const tickersParam = tickers.join(',')
      const response = await fetch(`/api/stock-prices?tickers=${tickersParam}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      
      setPrices(data.prices || {})
    } catch (err) {
      console.error('Error fetching stock prices:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prices')
    } finally {
      setLoading(false)
    }
  }, [tickers])

  // Initial fetch
  useEffect(() => {
    if (enabled && tickers.length > 0) {
      fetchPrices()
    }
  }, [fetchPrices, enabled, tickers])

  // Set up polling interval
  useEffect(() => {
    if (!enabled || tickers.length === 0) return

    let intervalId: NodeJS.Timeout | null = null

    function pollIfMarketOpen() {
      if (isMarketOpen()) {
        fetchPrices()
        intervalId = setInterval(() => {
          if (isMarketOpen()) {
            fetchPrices()
          }
        }, 5 * 60 * 1000) // 5 minutes
      } else {
        // Optionally: fetch last close price here if needed
      }
    }

    pollIfMarketOpen()

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [fetchPrices, enabled, tickers])

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchPrices()
  }, [fetchPrices])

  return {
    prices,
    loading,
    error,
    refresh
  }
} 