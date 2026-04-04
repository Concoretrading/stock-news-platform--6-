import { NextRequest, NextResponse } from 'next/server';
import { patternEngine } from '@/lib/services/pattern-recognition-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing pattern recognition engine...');

    // Initialize pattern recognition for core symbols
    const symbols = ['META', 'TSLA', 'SPY', 'QQQ', 'NFLX', 'NVDA'];

    for (const symbol of symbols) {
      await patternEngine.initializeSymbol(symbol);
    }

    // Test pattern recognition for META (last 5 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (5 * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];

    // Process historical data to find patterns
    const patterns = await patternEngine.processRealTimeData('META', {
      start_date: startDate,
      end_date: endDate
    });

    return NextResponse.json({
      success: true,
      message: 'Pattern recognition test successful!',
      test_results: {
        initialized_symbols: symbols,
        patterns_found: {
          count: patterns.length,
          details: patterns.map(p => ({
            symbol: p.symbol,
            pattern_type: p.pattern_type,
            timeframe: p.timeframe,
            confidence: p.confidence,
            signals: p.signals
          }))
        }
      }
    });

  } catch (error) {
    console.error('Pattern Recognition Test Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to test pattern recognition',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 