import { restClient } from '@polygon.io/client-js';

// Enhanced TypeScript interfaces for breakout analysis
export interface ConsolidationPeriod {
  startDate: string;
  endDate: string;
  duration: number; // days
  priceRange: {
    high: number;
    low: number;
    percentRange: number;
  };
  volume: {
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  strength: number; // 0-100 score
}

export interface BreakoutSignal {
  ticker: string;
  timestamp: string;
  signal: 'bullish_breakout' | 'bearish_breakdown' | 'consolidation' | 'no_signal';
  confidence: number; // 0-100
  consolidation: ConsolidationPeriod;
  volumeConfirmation: {
    currentVolume: number;
    averageVolume: number;
    volumeRatio: number;
    isConfirmed: boolean;
  };
  momentum: {
    rsi: number;
    status: 'building' | 'firing' | 'cooling';
  };
  keyLevels: {
    support: number[];
    resistance: number[];
    breakoutLevel: number;
  };
  priceAction: {
    currentPrice: number;
    breakoutMagnitude: number; // percentage above/below breakout level
    candlestickPattern: string;
  };
  premiumStructure: {
    // Structure for future options premium analysis
    ivRank?: number;
    putCallRatio?: number;
    premiumSkew?: string;
  };
}

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: string;
}

export interface SqueezeIndicator {
  status: 'building' | 'firing' | 'cooling';
  momentum: number;
  histogram: number[];
}

class PolygonClient {
  private client: any;

  constructor() {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
      throw new Error('POLYGON_API_KEY environment variable is required');
    }
    this.client = restClient(apiKey);
  }

  async getMarketStatus() {
    try {
      const response = await this.client.reference.marketStatus();
      return response;
    } catch (error) {
      console.error('Error fetching market status:', error);
      return null;
    }
  }

  async getDelayedQuote(ticker: string): Promise<StockQuote> {
    try {
      const response = await this.client.stocks.dailyOpenClose(ticker, '2024-01-01');
      return {
        ticker,
        price: response.close || 0,
        change: (response.close - response.open) || 0,
        changePercent: ((response.close - response.open) / response.open * 100) || 0,
        volume: response.volume || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching quote for ${ticker}:`, error);
      throw error;
    }
  }

  async getHistoricalData(ticker: string, days: number = 50): Promise<any[]> {
    try {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await this.client.stocks.aggregates(ticker, 1, 'day', from, to);
      return response.results || [];
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
      return [];
    }
  }

  // CONSOLIDATION DETECTION
  detectConsolidationPeriods(historicalData: any[], minDuration: number = 10): ConsolidationPeriod[] {
    const consolidations: ConsolidationPeriod[] = [];
    
    for (let i = minDuration; i < historicalData.length; i++) {
      const period = historicalData.slice(i - minDuration, i);
      const prices = period.map(d => [d.h, d.l]).flat();
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const percentRange = ((high - low) / low) * 100;
      
      // Consolidation criteria: price range < 8% over the period
      if (percentRange < 8) {
        const volumes = period.map(d => d.v);
        const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        
        consolidations.push({
          startDate: new Date(period[0].t).toISOString().split('T')[0],
          endDate: new Date(period[period.length - 1].t).toISOString().split('T')[0],
          duration: minDuration,
          priceRange: {
            high,
            low,
            percentRange
          },
          volume: {
            average: avgVolume,
            trend: 'stable' // Simplified for now
          },
          strength: Math.max(0, 100 - (percentRange * 5)) // Higher score for tighter ranges
        });
      }
    }
    
    return consolidations;
  }

  // RSI CALCULATION
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50; // Default neutral RSI
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // COMPREHENSIVE BREAKOUT ANALYSIS
  async analyzeBreakout(ticker: string): Promise<BreakoutSignal[]> {
    try {
      // For demo purposes, we'll return mock data that shows the analysis structure
      const mockSignals: BreakoutSignal[] = [
        {
          ticker,
          timestamp: new Date().toISOString(),
          signal: 'bullish_breakout',
          confidence: 78,
          consolidation: {
            startDate: '2024-12-01',
            endDate: '2024-12-20',
            duration: 20,
            priceRange: {
              high: 208.50,
              low: 195.30,
              percentRange: 6.8
            },
            volume: {
              average: 45000000,
              trend: 'stable'
            },
            strength: 85
          },
          volumeConfirmation: {
            currentVolume: 67500000,
            averageVolume: 45000000,
            volumeRatio: 1.5,
            isConfirmed: true
          },
          momentum: {
            rsi: 68.5,
            status: 'firing'
          },
          keyLevels: {
            support: [195.30, 200.00],
            resistance: [208.50, 215.00],
            breakoutLevel: 208.50
          },
          priceAction: {
            currentPrice: 210.25,
            breakoutMagnitude: 0.84, // 0.84% above breakout level
            candlestickPattern: 'bullish_engulfing'
          },
          premiumStructure: {}
        }
      ];

      // Try to get real data, fall back to mock if API fails
      try {
        const quote = await this.getDelayedQuote(ticker);
        const historical = await this.getHistoricalData(ticker);
        
        if (historical.length > 0) {
          const consolidations = this.detectConsolidationPeriods(historical);
          const prices = historical.map(d => d.c);
          const rsi = this.calculateRSI(prices);
          
          // Update mock data with real values where available
          mockSignals[0].priceAction.currentPrice = quote.price;
          mockSignals[0].momentum.rsi = rsi;
          mockSignals[0].momentum.status = rsi > 70 ? 'firing' : rsi < 30 ? 'cooling' : 'building';
          
          if (consolidations.length > 0) {
            mockSignals[0].consolidation = consolidations[consolidations.length - 1];
          }
        }
      } catch (apiError) {
        console.log('API error, using demo data:', apiError);
      }

      return mockSignals;
    } catch (error) {
      console.error('Breakout analysis error:', error);
      throw error;
    }
  }
}

const polygonClient = new PolygonClient();
export default polygonClient; 