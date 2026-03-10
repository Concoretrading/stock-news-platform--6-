import { NextRequest, NextResponse } from 'next/server';
import { patternEngine } from '@/lib/services/pattern-recognition-engine';
import { polygonData } from '@/lib/services/polygon-data-provider';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'META';
    const days = parseInt(searchParams.get('days') || '30');

    console.log(`🔍 Analyzing patterns for ${symbol} over ${days} days...`);

    // Get historical data
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];

    // Initialize pattern recognition
    await patternEngine.initializeSymbol(symbol);

    // Get data for different timeframes
    const timeframes = ['5', '15', '30', '60', '240', '1D'];
    const timeframeData = await Promise.all(
      timeframes.map(async (timeframe) => {
        const data = await polygonData.getHistoricalData(
          symbol,
          timeframe,
          startDate,
          endDate
        );
        return { timeframe, data };
      })
    );

    // Process patterns for each timeframe
    const patterns = [];
    for (const { timeframe, data } of timeframeData) {
      const timeframePatterns = await patternEngine.processRealTimeData(symbol, {
        timeframe,
        data
      });
      patterns.push(...timeframePatterns);
    }

    // Analyze pattern statistics
    const patternStats = {
      total_patterns: patterns.length,
      patterns_by_type: {} as { [key: string]: number },
      patterns_by_timeframe: {} as { [key: string]: number },
      avg_confidence: 0,
      high_confidence_patterns: 0 // >80% confidence
    };

    patterns.forEach(pattern => {
      // Count by type
      patternStats.patterns_by_type[pattern.pattern_type] = 
        (patternStats.patterns_by_type[pattern.pattern_type] || 0) + 1;
      
      // Count by timeframe
      patternStats.patterns_by_timeframe[pattern.timeframe] = 
        (patternStats.patterns_by_timeframe[pattern.timeframe] || 0) + 1;
      
      // Add to confidence metrics
      patternStats.avg_confidence += pattern.confidence;
      if (pattern.confidence > 0.8) {
        patternStats.high_confidence_patterns++;
      }
    });

    // Calculate average confidence
    if (patterns.length > 0) {
      patternStats.avg_confidence /= patterns.length;
    }

    return NextResponse.json({
      success: true,
      message: `Pattern analysis completed for ${symbol}`,
      analysis_period: {
        start_date: startDate,
        end_date: endDate,
        days
      },
      results: {
        patterns_found: patterns.length,
        pattern_stats: patternStats,
        recent_patterns: patterns
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
          .map(p => ({
            type: p.pattern_type,
            timeframe: p.timeframe,
            confidence: p.confidence,
            timestamp: p.timestamp,
            signals: p.signals
          }))
      }
    });

  } catch (error) {
    console.error('Pattern Analysis Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 