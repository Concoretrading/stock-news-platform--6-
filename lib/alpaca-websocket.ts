import WebSocket from 'ws'

interface AlpacaQuote {
  symbol: string
  ap: number // Ask price
  bp: number // Bid price
  p: number  // Last price
  t: number  // Timestamp
}

interface AlpacaTrade {
  symbol: string
  p: number  // Price
  s: number  // Size
  t: number  // Timestamp
}

interface PriceUpdate {
  symbol: string
  price: number
  bid: number
  ask: number
  timestamp: number
  volume?: number
}

class AlpacaWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnected = false
  private subscribedSymbols = new Set<string>()
  private priceCallbacks = new Map<string, (update: PriceUpdate) => void>()
  private connectionCallbacks: ((connected: boolean) => void)[] = []

  constructor(
    private apiKey: string,
    private apiSecret: string,
    private useRealTime: boolean = false
  ) {}

  // Connect to Alpaca WebSocket
  async connect(): Promise<void> {
    if (this.ws && this.isConnected) return

    try {
      const wsUrl = this.useRealTime 
        ? 'wss://stream.data.alpaca.markets/v2/iex'
        : 'wss://stream.data.alpaca.markets/v2/sip'

      this.ws = new WebSocket(wsUrl)

      this.ws.on('open', () => {
        // console.log('Alpaca WebSocket connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.notifyConnectionChange(true)
        
        // Authenticate
        this.authenticate()
      })

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      })

      this.ws.on('close', () => {
        // console.log('Alpaca WebSocket disconnected')
        this.isConnected = false
        this.notifyConnectionChange(false)
        this.scheduleReconnect()
      })

      this.ws.on('error', (error) => {
        console.error('Alpaca WebSocket error:', error)
        this.isConnected = false
        this.notifyConnectionChange(false)
      })

    } catch (error) {
      console.error('Failed to connect to Alpaca WebSocket:', error)
      this.isConnected = false
      this.notifyConnectionChange(false)
    }
  }

  private authenticate(): void {
    if (!this.ws) return

    const authMessage = {
      action: 'auth',
      key: this.apiKey,
      secret: this.apiSecret
    }

    this.ws.send(JSON.stringify(authMessage))
  }

  private handleMessage(message: any): void {
    if (message.T === 'success' && message.msg === 'authenticated') {
      // console.log('Alpaca WebSocket authenticated')
    } else if (message.T === 'subscription') {
      // console.log('Subscription confirmed:', message)
    } else if (message.T === 'q' && message.S) {
      // Quote update
      this.handleQuoteUpdate(message)
    } else if (message.T === 't' && message.S) {
      // Trade update
      this.handleTradeUpdate(message)
    }
  }

  private handleQuoteUpdate(quote: AlpacaQuote): void {
    const update: PriceUpdate = {
      symbol: quote.symbol,
      price: quote.p || quote.ap || 0,
      bid: quote.bp || 0,
      ask: quote.ap || 0,
      timestamp: quote.t
    }

    // Notify all callbacks for this symbol
    const callback = this.priceCallbacks.get(quote.symbol)
    if (callback) {
      callback(update)
    }
  }

  private handleTradeUpdate(trade: AlpacaTrade): void {
    const update: PriceUpdate = {
      symbol: trade.symbol,
      price: trade.p,
      bid: 0,
      ask: 0,
      timestamp: trade.t,
      volume: trade.s
    }

    // Notify all callbacks for this symbol
    const callback = this.priceCallbacks.get(trade.symbol)
    if (callback) {
      callback(update)
    }
  }

  // Subscribe to symbols for real-time updates
  subscribeToSymbols(symbols: string[]): void {
    if (!this.ws || !this.isConnected) {
      // console.log('WebSocket not connected, will subscribe when connected')
      symbols.forEach(symbol => this.subscribedSymbols.add(symbol))
      return
    }

    const subscribeMessage = {
      action: 'subscribe',
      quotes: symbols,
      trades: symbols
    }

    this.ws.send(JSON.stringify(subscribeMessage))
    
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol))
    // console.log('Subscribed to symbols:', symbols)
  }

  // Unsubscribe from symbols
  unsubscribeFromSymbols(symbols: string[]): void {
    if (!this.ws || !this.isConnected) return

    const unsubscribeMessage = {
      action: 'unsubscribe',
      quotes: symbols,
      trades: symbols
    }

    this.ws.send(JSON.stringify(unsubscribeMessage))
    
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol))
    // console.log('Unsubscribed from symbols:', symbols)
  }

  // Register callback for price updates
  onPriceUpdate(symbol: string, callback: (update: PriceUpdate) => void): void {
    this.priceCallbacks.set(symbol, callback)
  }

  // Remove callback for price updates
  offPriceUpdate(symbol: string): void {
    this.priceCallbacks.delete(symbol)
  }

  // Register callback for connection changes
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback)
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => callback(connected))
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    // console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.notifyConnectionChange(false)
  }

  // Check if connected
  get connected(): boolean {
    return this.isConnected
  }

  // Get subscribed symbols
  get subscribed(): string[] {
    return Array.from(this.subscribedSymbols)
  }
}

// Singleton instance
let alpacaWebSocket: AlpacaWebSocket | null = null

export function getAlpacaWebSocket(): AlpacaWebSocket | null {
  return alpacaWebSocket
}

export function initializeAlpacaWebSocket(
  apiKey: string,
  apiSecret: string,
  useRealTime: boolean = false
): AlpacaWebSocket {
  if (!alpacaWebSocket) {
    alpacaWebSocket = new AlpacaWebSocket(apiKey, apiSecret, useRealTime)
  }
  return alpacaWebSocket
}

export { AlpacaWebSocket, type PriceUpdate } 