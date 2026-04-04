import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const lookback = parseInt(searchParams.get('lookback') || '5');
    
    console.log(`📈 UNUSUAL OPTIONS ACTIVITY for ${ticker}...`);
    
    // Get current quote and historical data
    const currentQuote = await polygonClient.getDelayedQuote(ticker);
    const historicalData = await polygonClient.getHistoricalData(ticker, 30);
    
    // Analyze unusual options activity
    const optionsFlow = await polygonClient.analyzeUnusualOptionsActivity(ticker, lookback);
    
    return NextResponse.json({
      success: true,
      ticker,
      currentPrice: currentQuote.price,
      optionsFlow,
      recommendations: optionsFlow.signals,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Options flow analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 