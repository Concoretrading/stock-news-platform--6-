import { useState, useEffect, useCallback, useRef } from 'react'

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
  const fetchInProgress = useRef(false)
  const cancelled = useRef(false)

  // Helper to batch tickers
  function batchTickers(allTickers: string[], batchSize: number) {
    const batches = []
    for (let i = 0; i < allTickers.length; i += batchSize) {
      batches.push(allTickers.slice(i, i + batchSize))
    }
    return batches
  }

  const fetchPrices = useCallback(async () => {
    if (!tickers.length || fetchInProgress.current) return
    fetchInProgress.current = true
    setLoading(true)
    setError(null)
    const batchSize = 5
    const batches = batchTickers(tickers, batchSize)
    let allPrices: StockPrices = {}
    let failedTickers: string[] = []
    try {
      for (const batch of batches) {
        if (cancelled.current) break
        try {
          const tickersParam = batch.join(',')
          const response = await fetch(`/api/stock-prices?tickers=${tickersParam}`)
          if (!response.ok) {
            failedTickers.push(...batch)
            continue
          }
          const data = await response.json()
          if (data.error) {
            failedTickers.push(...batch)
            continue
          }
          allPrices = { ...allPrices, ...(data.prices || {}) }
          // If any ticker in batch is missing, mark as failed
          batch.forEach(ticker => {
            if (!(ticker in (data.prices || {}))) {
              failedTickers.push(ticker)
            }
          })
        } catch (err) {
          failedTickers.push(...batch)
        }
      }
      if (!cancelled.current) {
        setPrices(allPrices)
        if (failedTickers.length > 0) {
          setError(`Failed to fetch: ${failedTickers.join(', ')}`)
        } else {
          setError(null)
        }
      }
    } finally {
      fetchInProgress.current = false
      if (!cancelled.current) setLoading(false)
    }
  }, [tickers])

  // Initial fetch
  useEffect(() => {
    cancelled.current = false
    if (enabled && tickers.length > 0) {
      fetchPrices()
    }
    return () => { cancelled.current = true }
  }, [fetchPrices, enabled, tickers])

  // Set up polling interval
  useEffect(() => {
    if (!enabled || tickers.length === 0) return
    let intervalId: NodeJS.Timeout | null = null
    cancelled.current = false
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
      cancelled.current = true
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