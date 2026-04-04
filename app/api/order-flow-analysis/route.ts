import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    
    console.log(`📊 ORDER FLOW ANALYSIS for ${ticker}...`);
    
    // Get current market data
    const currentQuote = await polygonClient.getDelayedQuote(ticker);
    const historicalData = await polygonClient.getHistoricalData(ticker, 60);
    
    // Analyze order flow patterns
    const orderFlowAnalysis = await polygonClient.analyzeOrderFlow(ticker, historicalData);
    
    return NextResponse.json({
      success: true,
      ticker,
      currentPrice: currentQuote.price,
      orderFlow: orderFlowAnalysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Order flow analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 