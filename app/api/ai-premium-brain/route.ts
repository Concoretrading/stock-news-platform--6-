import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const keyLevel = parseFloat(searchParams.get('keyLevel') || '0');
    
    console.log(`🧠 AI PREMIUM BRAIN ANALYSIS for ${ticker} at key level ${keyLevel}...`);
    
    // Use 21 EMA as default key level if not provided
    let actualKeyLevel = keyLevel;
    if (keyLevel === 0) {
      const currentQuote = await polygonClient.getDelayedQuote(ticker);
      const historicalData = await polygonClient.getHistoricalData(ticker, 30);
      const prices = historicalData.map((d: any) => d.close || d.c);
      const ema21Values = polygonClient.calculateEMA(prices, 21);
      actualKeyLevel = ema21Values[ema21Values.length - 1] || currentQuote.price * 0.95;
    }
    
    // Run AI Premium Brain Analysis
    const aiAnalysis = await polygonClient.analyzeAdvancedPremiumDynamics(ticker, actualKeyLevel);
    
    return NextResponse.json({
      success: true,
      ticker,
      keyLevel: actualKeyLevel,
      keyLevelType: keyLevel === 0 ? '21_EMA' : 'CUSTOM',
      aiAnalysis,
      systemInfo: {
        analysisType: 'AI_PREMIUM_BRAIN',
        components: [
          'Premium Memory',
          'Momentum-Premium Correlation',
          'Institutional Premium Patterns',
          'Volume-Premium Dynamics',
          'Key Level Premium Behavior',
          'Premium Flow Prediction'
        ],
        aiCapabilities: [
          'Historical Pattern Learning',
          'Multi-Factor Prediction',
          'Institutional Behavior Detection',
          'Volume-Premium Correlation',
          'Key Level Interaction Analysis'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('AI Premium Brain error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'AI Premium Brain analysis failed',
      fallback: 'Using simplified premium analysis'
    }, { status: 500 });
  }
} 