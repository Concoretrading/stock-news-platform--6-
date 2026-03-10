import { NextResponse } from 'next/server';
import { historicalPatternLearner } from '@/lib/services/historical-pattern-learner';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const start_date = searchParams.get('start_date') || '2023-01-01';
    const end_date = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Analyze patterns
    await historicalPatternLearner.analyzeHistoricalPatterns(symbol, start_date, end_date);

    // Get analysis results for different timeframes
    const timeframes = ['day', 'hour', '15min', '5min', '1min'];
    const results = timeframes.reduce((acc, timeframe) => {
      acc[timeframe] = historicalPatternLearner.getPatternAnalysis(symbol, timeframe);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      symbol,
      analysis: results
    });

  } catch (error) {
    console.error('Pattern learning error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 