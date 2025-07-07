// Earnings Data Fetcher - Multiple Sources
// This fetches future earnings data from various APIs

interface EarningsData {
  stockTicker: string;
  companyName: string;
  earningsDate: string;
  earningsType: string;
  isConfirmed: boolean;
  estimatedEPS?: number;
  estimatedRevenue?: number;
  previousEPS?: number;
  previousRevenue?: number;
  conferenceCallUrl?: string;
  notes?: string;
  source: string;
}

export class EarningsDataFetcher {
  private alpacaApiKey: string;
  private alpacaSecretKey: string;
  private alphaVantageKey: string;
  private fmpKey: string;

  constructor() {
    this.alpacaApiKey = process.env.ALPACA_API_KEY || '';
    this.alpacaSecretKey = process.env.ALPACA_SECRET_KEY || '';
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.fmpKey = process.env.FMP_API_KEY || '';
  }

  // Fetch earnings from Alpaca Markets
  async fetchFromAlpaca(stockTicker?: string, monthsAhead: number = 4): Promise<EarningsData[]> {
    try {
      if (!this.alpacaApiKey || !this.alpacaSecretKey) {
        console.warn('Alpaca API keys not configured');
        return [];
      }

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + monthsAhead);
      
      const params = new URLSearchParams({
        start: new Date().toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      });

      if (stockTicker) {
        params.append('symbols', stockTicker);
      }

      const response = await fetch(`https://data.alpaca.markets/v2/stocks/earnings?${params}`, {
        headers: {
          'APCA-API-KEY-ID': this.alpacaApiKey,
          'APCA-API-SECRET-KEY': this.alpacaSecretKey
        }
      });

      if (!response.ok) {
        throw new Error(`Alpaca API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.earnings?.map((earning: any) => ({
        stockTicker: earning.symbol,
        companyName: earning.company_name || earning.symbol,
        earningsDate: earning.report_date,
        earningsType: earning.report_time || 'After Close',
        isConfirmed: true,
        estimatedEPS: earning.estimate_eps,
        estimatedRevenue: earning.estimate_revenue,
        previousEPS: earning.actual_eps,
        previousRevenue: earning.actual_revenue,
        conferenceCallUrl: earning.conference_call_url,
        notes: `Q${this.getQuarterFromDate(earning.report_date)} ${new Date(earning.report_date).getFullYear()} Earnings`,
        source: 'alpaca_api'
      })) || [];

    } catch (error) {
      console.error('Error fetching from Alpaca:', error);
      return [];
    }
  }

  // Fetch earnings from Alpha Vantage
  async fetchFromAlphaVantage(stockTicker?: string, monthsAhead: number = 4): Promise<EarningsData[]> {
    try {
      if (!this.alphaVantageKey) {
        console.warn('Alpha Vantage API key not configured');
        return [];
      }

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + monthsAhead);
      
      const params = new URLSearchParams({
        function: 'EARNINGS_CALENDAR',
        horizon: `${monthsAhead}month`,
        apikey: this.alphaVantageKey
      });

      const response = await fetch(`https://www.alphavantage.co/query?${params}`);

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      // Alpha Vantage returns CSV format, need to parse
      const csvData = await response.text();
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      const earnings: EarningsData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const earning: any = {};
        
        headers.forEach((header, index) => {
          earning[header.trim()] = values[index]?.trim();
        });

        if (stockTicker && earning.symbol !== stockTicker) continue;

        earnings.push({
          stockTicker: earning.symbol,
          companyName: earning.name,
          earningsDate: earning.reportDate,
          earningsType: earning.reportTime || 'After Close',
          isConfirmed: true,
          estimatedEPS: parseFloat(earning.estimateEPS),
          estimatedRevenue: parseFloat(earning.estimateRevenue),
          previousEPS: parseFloat(earning.actualEPS),
          previousRevenue: parseFloat(earning.actualRevenue),
          notes: `Q${this.getQuarterFromDate(earning.reportDate)} ${new Date(earning.reportDate).getFullYear()} Earnings`,
          source: 'alpha_vantage'
        });
      }

      return earnings;

    } catch (error) {
      console.error('Error fetching from Alpha Vantage:', error);
      return [];
    }
  }

  // Fetch earnings from Financial Modeling Prep
  async fetchFromFMP(stockTicker?: string, monthsAhead: number = 4): Promise<EarningsData[]> {
    try {
      if (!this.fmpKey) {
        console.warn('FMP API key not configured');
        return [];
      }

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + monthsAhead);
      
      const params = new URLSearchParams({
        from: new Date().toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        apikey: this.fmpKey
      });

      const response = await fetch(`https://financialmodelingprep.com/api/v3/earning_calendar?${params}`);

      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((earning: any) => ({
        stockTicker: earning.symbol,
        companyName: earning.company,
        earningsDate: earning.date,
        earningsType: earning.time || 'After Close',
        isConfirmed: true,
        estimatedEPS: earning.epsEstimate,
        estimatedRevenue: earning.revenueEstimate,
        previousEPS: earning.epsActual,
        previousRevenue: earning.revenueActual,
        notes: `Q${this.getQuarterFromDate(earning.date)} ${new Date(earning.date).getFullYear()} Earnings`,
        source: 'fmp_api'
      })).filter((earning: EarningsData) => 
        !stockTicker || earning.stockTicker === stockTicker
      );

    } catch (error) {
      console.error('Error fetching from FMP:', error);
      return [];
    }
  }

  // Fetch from Yahoo Finance (unofficial)
  async fetchFromYahoo(stockTicker: string): Promise<EarningsData[]> {
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${stockTicker}?interval=1d&range=1y&includePrePost=false&events=div%2Csplit`);

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Yahoo doesn't provide future earnings directly, but we can estimate
      // based on historical patterns
      const earnings: EarningsData[] = [];
      
      // This is a simplified example - Yahoo doesn't provide future earnings
      // You'd need to implement pattern recognition or use other sources
      
      return earnings;

    } catch (error) {
      console.error('Error fetching from Yahoo Finance:', error);
      return [];
    }
  }

  // Fetch from all available sources and merge
  async fetchAllSources(stockTicker?: string, monthsAhead: number = 4): Promise<EarningsData[]> {
    const [alpacaData, alphaVantageData, fmpData] = await Promise.allSettled([
      this.fetchFromAlpaca(stockTicker, monthsAhead),
      this.fetchFromAlphaVantage(stockTicker, monthsAhead),
      this.fetchFromFMP(stockTicker, monthsAhead)
    ]);

    const allEarnings: EarningsData[] = [];

    // Add successful results
    if (alpacaData.status === 'fulfilled') {
      allEarnings.push(...alpacaData.value);
    }
    if (alphaVantageData.status === 'fulfilled') {
      allEarnings.push(...alphaVantageData.value);
    }
    if (fmpData.status === 'fulfilled') {
      allEarnings.push(...fmpData.value);
    }

    // Remove duplicates and merge data
    const uniqueEarnings = this.mergeEarningsData(allEarnings);

    return uniqueEarnings;
  }

  // Merge earnings data from multiple sources, removing duplicates
  private mergeEarningsData(earnings: EarningsData[]): EarningsData[] {
    const earningsMap = new Map<string, EarningsData>();

    earnings.forEach(earning => {
      const key = `${earning.stockTicker}-${earning.earningsDate}`;
      
      if (earningsMap.has(key)) {
        // Merge data, preferring more complete information
        const existing = earningsMap.get(key)!;
        const merged = {
          ...existing,
          estimatedEPS: earning.estimatedEPS || existing.estimatedEPS,
          estimatedRevenue: earning.estimatedRevenue || existing.estimatedRevenue,
          previousEPS: earning.previousEPS || existing.previousEPS,
          previousRevenue: earning.previousRevenue || existing.previousRevenue,
          conferenceCallUrl: earning.conferenceCallUrl || existing.conferenceCallUrl,
          source: `${existing.source},${earning.source}`
        };
        earningsMap.set(key, merged);
      } else {
        earningsMap.set(key, earning);
      }
    });

    return Array.from(earningsMap.values()).sort((a, b) => 
      new Date(a.earningsDate).getTime() - new Date(b.earningsDate).getTime()
    );
  }

  // Helper function to get quarter from date
  private getQuarterFromDate(dateString: string): string {
    const date = new Date(dateString);
    const month = date.getMonth();
    if (month >= 0 && month <= 2) return '1';
    if (month >= 3 && month <= 5) return '2';
    if (month >= 6 && month <= 8) return '3';
    return '4';
  }
}

// Export singleton instance
export const earningsFetcher = new EarningsDataFetcher(); 