import { useState, useEffect, useCallback, useRef } from 'react'
import { getRealTimePriceService, type PriceData } from '@/lib/real-time-prices'

interface UseRealTimePricesOptions {
  symbols: string[]
  enabled?: boolean
  onError?: (error: string) => void
}

interface RealTimePrice {
  symbol: string
  price: number
  bid: number
  ask: number
  timestamp: number
  volume?: number
  source: 'websocket' | 'rest' | 'cache'
  change?: number
  changePercent?: number
  isLastClose?: boolean
}

export function useRealTimePrices(options: UseRealTimePricesOptions) {
  const { symbols, enabled = true, onError } = options
  const [prices, setPrices] = useState<Record<string, RealTimePrice>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState({
    websocketConnected: false,
    useRealTime: false,
    subscribedSymbols: [] as string[]
  })
  
  const previousPrices = useRef<Record<string, RealTimePrice>>({})
  const service = useRef(getRealTimePriceService())

  // Initialize service and subscribe to symbols
  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      setLoading(false)
      return
    }

    const initializeService = async () => {
      try {
        setLoading(true)
        setError(null)

        // Subscribe to symbols
        await service.current.subscribeToSymbols(symbols)

        // Set up price update handlers
        symbols.forEach(symbol => {
          service.current.onPriceUpdate(symbol, (priceData: PriceData) => {
            const prevPrice = previousPrices.current[symbol]
            const change = prevPrice ? priceData.price - prevPrice.price : 0
            const changePercent = prevPrice && prevPrice.price > 0 
              ? (change / prevPrice.price) * 100 
              : 0

            const realTimePrice: RealTimePrice = {
              symbol,
              price: priceData.price,
              bid: priceData.bid,
              ask: priceData.ask,
              timestamp: priceData.timestamp,
              volume: priceData.volume,
              source: priceData.source,
              change,
              changePercent
            }

            setPrices(prev => ({
              ...prev,
              [symbol]: realTimePrice
            }))

            previousPrices.current[symbol] = realTimePrice
          })
        })

        // Update connection status
        const status = service.current.status
        setConnectionStatus({
          websocketConnected: status.websocketConnected,
          useRealTime: status.useRealTime,
          subscribedSymbols: status.subscribedSymbols
        })

        setLoading(false)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize real-time prices'
        setError(errorMessage)
        onError?.(errorMessage)
        setLoading(false)
      }
    }

    initializeService()

    // Cleanup on unmount
    return () => {
      if (symbols.length > 0) {
        service.current.unsubscribeFromSymbols(symbols)
        symbols.forEach(symbol => {
          service.current.offPriceUpdate(symbol, () => {})
        })
      }
    }
  }, [symbols, enabled, onError])

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!enabled || symbols.length === 0) return

    try {
      setError(null)
      await service.current.subscribeToSymbols(symbols)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh prices'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [symbols, enabled, onError])

  // Get price for specific symbol
  const getPrice = useCallback((symbol: string): RealTimePrice | null => {
    return prices[symbol] || null
  }, [prices])

  // Get all prices
  const getAllPrices = useCallback((): Record<string, RealTimePrice> => {
    return prices
  }, [prices])

  // Check if symbol has price data
  const hasPrice = useCallback((symbol: string): boolean => {
    return symbol in prices
  }, [prices])

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return service.current.status
  }, [])

  return {
    prices,
    loading,
    error,
    connectionStatus,
    refresh,
    getPrice,
    getAllPrices,
    hasPrice,
    getConnectionStatus
  }
} 