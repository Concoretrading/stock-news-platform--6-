import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const keyLevel = parseFloat(searchParams.get('keyLevel') || '0');
    
    console.log(`🎯 REAL-TIME BREAKOUT ANALYSIS for ${ticker} approaching $${keyLevel}`);
    
    // Real-time analysis applying historical knowledge
    const realTimeAnalysis = await polygonClient.analyzeRealTimeBreakout(ticker, keyLevel);
    
    return NextResponse.json({
      success: true,
      ticker,
      analysisType: 'real-time-breakout-prediction',
      keyLevel,
      timestamp: new Date().toISOString(),
      ...realTimeAnalysis
    });
    
  } catch (error) {
    console.error('Real-time breakout analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      ticker: request.url.includes('ticker=') ? new URL(request.url).searchParams.get('ticker') : 'Unknown'
    }, { status: 500 });
  }
} 