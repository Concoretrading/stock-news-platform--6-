import { EventEmitter } from 'events';

interface PriceAlert {
  ticker: string;
  catalystId: string;
  catalystTitle: string;
  priceBefore: number;
  priceAfter: number;
  currentPrice: number;
  tolerancePoints: number;
  minimumMove: number;
  triggeredAt: string;
}

class RealTimePriceService {
  private static instance: RealTimePriceService;
  private eventEmitter: EventEmitter;
  private subscribedSymbols: Set<string>;
  private mockPrices: Map<string, number>;
  private updateInterval: NodeJS.Timeout | null;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.subscribedSymbols = new Set();
    this.mockPrices = new Map();
    this.updateInterval = null;
  }

  public static getInstance(): RealTimePriceService {
    if (!RealTimePriceService.instance) {
      RealTimePriceService.instance = new RealTimePriceService();
    }
    return RealTimePriceService.instance;
  }

  public get status() {
    return {
      connected: true,
      subscribedSymbols: Array.from(this.subscribedSymbols)
    };
  }

  public async subscribeToSymbols(symbols: string[]) {
    symbols.forEach(symbol => {
      this.subscribedSymbols.add(symbol.toUpperCase());
      // Initialize with a random price between 10 and 1000
      this.mockPrices.set(symbol, Math.random() * 990 + 10);
    });

    // Start price updates if not already running
    if (!this.updateInterval) {
      this.startPriceUpdates();
    }
  }

  public unsubscribeFromSymbols(symbols: string[]) {
    symbols.forEach(symbol => {
      this.subscribedSymbols.delete(symbol.toUpperCase());
      this.mockPrices.delete(symbol);
    });

    // Stop updates if no symbols are subscribed
    if (this.subscribedSymbols.size === 0 && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public onAlert(callback: (alert: PriceAlert) => void) {
    this.eventEmitter.on('alert', callback);
  }

  public offAlert(callback: (alert: PriceAlert) => void) {
    this.eventEmitter.off('alert', callback);
  }

  private startPriceUpdates() {
    this.updateInterval = setInterval(() => {
      this.subscribedSymbols.forEach(symbol => {
        const currentPrice = this.mockPrices.get(symbol) || 100;
        // Random price change between -5% and +5%
        const change = currentPrice * (Math.random() * 0.1 - 0.05);
        const newPrice = currentPrice + change;
        this.mockPrices.set(symbol, newPrice);

        // Simulate an alert if price change is significant
        if (Math.abs(change) > currentPrice * 0.03) {
          const alert: PriceAlert = {
            ticker: symbol,
            catalystId: 'mock-catalyst',
            catalystTitle: 'Significant Price Movement',
            priceBefore: currentPrice,
            priceAfter: newPrice,
            currentPrice: newPrice,
            tolerancePoints: 3,
            minimumMove: Math.abs(change),
            triggeredAt: new Date().toISOString()
          };
          this.eventEmitter.emit('alert', alert);
        }
      });
    }, 5000); // Update every 5 seconds
  }
}

export function getRealTimePriceService(): RealTimePriceService {
  return RealTimePriceService.getInstance();
} 