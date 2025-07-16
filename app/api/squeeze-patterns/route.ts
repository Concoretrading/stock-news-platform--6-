import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    
    if (!ticker) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ticker parameter is required' 
      }, { status: 400 });
    }

    console.log(`🎯 ANALYZING SQUEEZE PATTERNS for ${ticker}`);
    
    // Get current market data first to validate ticker
    let quote;
    try {
      quote = await polygonClient.getDelayedQuote(ticker);
    } catch (error) {
      console.error(`Failed to get quote for ${ticker}:`, error);
      return NextResponse.json({
        success: false,
        error: `No data available for ${ticker}`
      }, { status: 404 });
    }
    
    // Get multi-timeframe squeeze analysis
    let squeezeAnalysis;
    try {
      squeezeAnalysis = await polygonClient.analyzeMultiTimeframeSqueeze(ticker);
    } catch (error) {
      console.error(`Failed to analyze squeeze patterns for ${ticker}:`, error);
      return NextResponse.json({
        success: false,
        error: `Failed to analyze squeeze patterns for ${ticker}`
      }, { status: 500 });
    }

    // Get market status
    let marketStatus;
    try {
      marketStatus = await polygonClient.getMarketStatus();
    } catch (error) {
      console.error('Failed to get market status:', error);
      marketStatus = { market: 'unknown' };
    }

    // Calculate summary statistics
    const allTimeframes = [
      ...squeezeAnalysis.ultraShort,
      ...squeezeAnalysis.short,
      ...squeezeAnalysis.medium,
      ...squeezeAnalysis.long
    ];

    const summary = {
      squeezedTimeframes: allTimeframes.filter(tf => tf.isSqueezed).length,
      totalTimeframes: allTimeframes.length,
      bullishMomentum: allTimeframes.filter(tf => tf.momentum.direction.startsWith('bullish')).length,
      bearishMomentum: allTimeframes.filter(tf => tf.momentum.direction.startsWith('bearish')).length,
      firingTimeframes: allTimeframes.filter(tf => tf.status === 'firing').length,
      buildingTimeframes: allTimeframes.filter(tf => tf.status === 'building').length,
      dominantColor: (() => {
        const colors = allTimeframes.map(tf => tf.color);
        return colors.sort((a, b) => 
          colors.filter(v => v === a).length - colors.filter(v => v === b).length
        ).pop();
      })(),
      momentumStrength: allTimeframes.reduce((sum, tf) => sum + Math.abs(tf.momentum.value), 0) / allTimeframes.length
    };
    
    return NextResponse.json({
      success: true,
      ticker,
      currentPrice: quote.price,
      timestamp: new Date().toISOString(),
      marketStatus: marketStatus.market,
      squeezeAnalysis,
      summary
    });
    
  } catch (error) {
    console.error('Squeeze pattern analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 