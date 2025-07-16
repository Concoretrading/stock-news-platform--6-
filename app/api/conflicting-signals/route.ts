import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const years = parseInt(searchParams.get('years') || '4');
    
    console.log(`🎯 CONFLICTING SIGNALS ANALYSIS for ${ticker} (${years} years)`);
    
    // Analyze all conflicting timeframe scenarios from historical data
    const conflictingSignalsAnalysis = await polygonClient.analyzeConflictingTimeframes(ticker, years);
    
    return NextResponse.json({
      success: true,
      ticker,
      analysisType: 'conflicting-timeframe-signals',
      timeRange: `${years} years`,
      timestamp: new Date().toISOString(),
      ...conflictingSignalsAnalysis
    });
    
  } catch (error) {
    console.error('Conflicting signals analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      ticker: request.url.includes('ticker=') ? new URL(request.url).searchParams.get('ticker') : 'Unknown'
    }, { status: 500 });
  }
} 