import { getCachedPrice, setCachedPrice } from './redis'
import { initializeAlpacaWebSocket, getAlpacaWebSocket, type PriceUpdate } from './alpaca-websocket'

interface PriceData {
  price: number
  bid: number
  ask: number
  timestamp: number
  volume?: number
  source: 'websocket' | 'rest' | 'cache'
}

class RealTimePriceService {
  private prices = new Map<string, PriceData>()
  private callbacks = new Map<string, ((data: PriceData) => void)[]>()
  private websocket: any = null
  private isInitialized = false
  private useRealTime = false

  constructor() {
    // Check if we should use real-time data
    this.useRealTime = process.env.ALPACA_USE_REALTIME === 'true'
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    const apiKey = process.env.ALPACA_API_KEY
    const apiSecret = process.env.ALPACA_API_SECRET

    if (!apiKey || !apiSecret) {
      console.warn('Alpaca API credentials not found, using REST API only')
      this.isInitialized = true
      return
    }

    try {
      // Initialize WebSocket connection
      this.websocket = initializeAlpacaWebSocket(apiKey, apiSecret, this.useRealTime)
      
      // Set up connection change handler
      this.websocket.onConnectionChange((connected: boolean) => {
        console.log('WebSocket connection status:', connected ? 'Connected' : 'Disconnected')
      })

      // Connect to WebSocket
      await this.websocket.connect()
      
      this.isInitialized = true
      console.log('Real-time price service initialized', {
        useRealTime: this.useRealTime,
        websocketConnected: this.websocket.connected
      })
    } catch (error) {
      console.error('Failed to initialize real-time price service:', error)
      this.isInitialized = true // Mark as initialized to prevent retries
    }
  }

  // Subscribe to price updates for symbols
  async subscribeToSymbols(symbols: string[]): Promise<void> {
    await this.initialize()

    // Subscribe to WebSocket if available
    if (this.websocket && this.websocket.connected) {
      this.websocket.subscribeToSymbols(symbols)
      
      // Set up price update handlers
      symbols.forEach(symbol => {
        this.websocket.onPriceUpdate(symbol, (update: PriceUpdate) => {
          this.handleWebSocketUpdate(symbol, update)
        })
      })
    }

    // Also fetch initial prices via REST API
    await this.fetchInitialPrices(symbols)
  }

  // Unsubscribe from symbols
  unsubscribeFromSymbols(symbols: string[]): void {
    if (this.websocket && this.websocket.connected) {
      this.websocket.unsubscribeFromSymbols(symbols)
      
      symbols.forEach(symbol => {
        this.websocket.offPriceUpdate(symbol)
      })
    }
  }

  // Handle WebSocket price updates
  private handleWebSocketUpdate(symbol: string, update: PriceUpdate): void {
    const priceData: PriceData = {
      price: update.price,
      bid: update.bid,
      ask: update.ask,
      timestamp: update.timestamp,
      volume: update.volume,
      source: 'websocket'
    }

    this.prices.set(symbol, priceData)
    
    // Cache the price
    setCachedPrice(symbol, update.price)
    
    // Notify callbacks
    this.notifyCallbacks(symbol, priceData)
  }

  // Fetch initial prices via REST API
  private async fetchInitialPrices(symbols: string[]): Promise<void> {
    const results: Record<string, number | null> = {}
    const symbolsToFetch: string[] = []

    // Check cache first
    for (const symbol of symbols) {
      const cached = await getCachedPrice(symbol)
      if (cached) {
        results[symbol] = cached.price
        this.prices.set(symbol, {
          price: cached.price,
          bid: 0,
          ask: 0,
          timestamp: cached.timestamp,
          source: 'cache'
        })
      } else {
        symbolsToFetch.push(symbol)
      }
    }

    // Fetch uncached symbols
    if (symbolsToFetch.length > 0) {
      try {
        const response = await fetch(`/api/stock-prices?tickers=${symbolsToFetch.join(',')}`)
        if (response.ok) {
          const data = await response.json()
          
          symbolsToFetch.forEach(symbol => {
            const price = data.prices[symbol]
            if (price !== null && price !== undefined) {
              results[symbol] = price
              this.prices.set(symbol, {
                price,
                bid: 0,
                ask: 0,
                timestamp: Date.now(),
                source: 'rest'
              })
            }
          })
        }
      } catch (error) {
        console.error('Error fetching initial prices:', error)
      }
    }

    // Notify callbacks for all symbols
    symbols.forEach(symbol => {
      const priceData = this.prices.get(symbol)
      if (priceData) {
        this.notifyCallbacks(symbol, priceData)
      }
    })
  }

  // Register callback for price updates
  onPriceUpdate(symbol: string, callback: (data: PriceData) => void): void {
    if (!this.callbacks.has(symbol)) {
      this.callbacks.set(symbol, [])
    }
    this.callbacks.get(symbol)!.push(callback)

    // Immediately call with current price if available
    const currentPrice = this.prices.get(symbol)
    if (currentPrice) {
      callback(currentPrice)
    }
  }

  // Remove callback for price updates
  offPriceUpdate(symbol: string, callback: (data: PriceData) => void): void {
    const callbacks = this.callbacks.get(symbol)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // Notify all callbacks for a symbol
  private notifyCallbacks(symbol: string, data: PriceData): void {
    const callbacks = this.callbacks.get(symbol)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in price update callback:', error)
        }
      })
    }
  }

  // Get current price for a symbol
  getPrice(symbol: string): PriceData | null {
    return this.prices.get(symbol) || null
  }

  // Get all current prices
  getAllPrices(): Map<string, PriceData> {
    return new Map(this.prices)
  }

  // Check if WebSocket is connected
  get websocketConnected(): boolean {
    return this.websocket?.connected || false
  }

  // Get connection status
  get status(): {
    initialized: boolean
    websocketConnected: boolean
    useRealTime: boolean
    subscribedSymbols: string[]
  } {
    return {
      initialized: this.isInitialized,
      websocketConnected: this.websocketConnected,
      useRealTime: this.useRealTime,
      subscribedSymbols: this.websocket?.subscribed || []
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.websocket) {
      this.websocket.disconnect()
    }
  }
}

// Singleton instance
let realTimePriceService: RealTimePriceService | null = null

export function getRealTimePriceService(): RealTimePriceService {
  if (!realTimePriceService) {
    realTimePriceService = new RealTimePriceService()
  }
  return realTimePriceService
}

export { RealTimePriceService, type PriceData } 