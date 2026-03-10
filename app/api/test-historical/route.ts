import { NextRequest, NextResponse } from 'next/server';

// ✅ PAID POLYGON API KEY ONLY - $79 STOCKS DEVELOPER PLAN
const API_KEY = 'mTmTNRmv236VbU8ijndr1F5EOJz8NR3s'; // PAID $79 PLAN KEY ONLY
const BASE_URL = 'https://api.polygon.io';

export async function GET(request: NextRequest) {
  try {
    console.log('🧠 Testing historical data access...');
    
    // Calculate dates
    const end_date = new Date().toISOString().split('T')[0];
    const start_date = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];
    
    // Get daily data for AAPL
    const dailyData = await fetch(
      `${BASE_URL}/v2/aggs/ticker/AAPL/range/1/day/${start_date}/${end_date}?apiKey=${API_KEY}`
    ).then(res => res.json());

    // Get options data for AAPL
    const optionsData = await fetch(
      `${BASE_URL}/v3/reference/options/contracts?underlying_ticker=AAPL&limit=5&apiKey=${API_KEY}`
    ).then(res => res.json());

    // Get daily data for our core stocks
    const coreStocks = ['META', 'TSLA', 'SPY', 'QQQ', 'NFLX', 'NVDA'];
    const stockData = await Promise.all(
      coreStocks.map(async (symbol) => {
        const data = await fetch(
          `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/day/${start_date}/${end_date}?apiKey=${API_KEY}`
        ).then(res => res.json());
        
        return {
          symbol,
          data: data.results?.slice(0, 5) // Last 5 days
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Historical data test successful!',
      analysis_period: `${start_date} to ${end_date}`,
      aapl_data: {
        count: dailyData.results?.length || 0,
        sample: dailyData.results?.slice(0, 2)
      },
      options_data: {
        count: optionsData.results?.length || 0,
        sample: optionsData.results?.slice(0, 2)
      },
      core_stocks: stockData.map(stock => ({
        symbol: stock.symbol,
        last_5_days: stock.data
      }))
    });

  } catch (error) {
    console.error('Historical Data Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to access historical data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 