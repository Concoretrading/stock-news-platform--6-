import { useState, useEffect, useCallback } from 'react'

interface StockPrices {
  [ticker: string]: number | null
}

interface UseStockPricesOptions {
  interval?: number // Polling interval in milliseconds
  enabled?: boolean // Whether to enable polling
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

    const intervalId = setInterval(fetchPrices, interval)
    return () => clearInterval(intervalId)
  }, [fetchPrices, interval, enabled, tickers])

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