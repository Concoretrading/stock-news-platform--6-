import { NextRequest, NextResponse } from 'next/server';
import polygonClient from '@/lib/services/polygon-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    
    if (!ticker) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ticker parameter is required' 
      }, { status: 400 });
    }
    
    console.log(`Analyzing breakout for ${ticker}...`);
    
    // Comprehensive breakout analysis
    const breakoutSignals = await polygonClient.analyzeBreakout(ticker);
    
    return NextResponse.json({
      success: true,
      ticker,
      analysis: {
        signals: breakoutSignals,
        summary: {
          totalSignals: breakoutSignals.length,
          avgConfidence: breakoutSignals.reduce((sum, signal) => sum + signal.confidence, 0) / breakoutSignals.length,
          strongSignals: breakoutSignals.filter(signal => signal.confidence > 70).length,
        }
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Breakout analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
    }, { status: 500 });
  }
} 