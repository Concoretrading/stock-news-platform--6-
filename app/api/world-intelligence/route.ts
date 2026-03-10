import { NextRequest, NextResponse } from 'next/server';
import { worldConnectedIntelligence } from '@/lib/services/world-connected-intelligence';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'SPY';

    console.log(`🌍 World Intelligence API called for: ${symbol}`);

    const worldAnalysis = await worldConnectedIntelligence.analyzeWorldConnection(symbol);

    return NextResponse.json({
      success: true,
      data: worldAnalysis,
      message: `World intelligence analysis completed for ${symbol}`
    });

  } catch (error) {
    console.error('World Intelligence API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze world intelligence',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, event_type, breaking_news } = body;

    console.log(`🌍 Processing real-time world event: ${event_type || 'BREAKING_NEWS'}`);

    if (breaking_news) {
      // Process breaking news in real-time
      const newsImpact = await worldConnectedIntelligence.analyzeWorldConnection(symbol || 'SPY');
      
      return NextResponse.json({
        success: true,
        data: {
          immediate_analysis: newsImpact,
          recommended_actions: [
            'ASSESS_IMMEDIATE_IMPACT',
            'CHECK_POSITIONING',
            'ADJUST_RISK_IF_NEEDED',
            'PREPARE_FOR_FOLLOW_THROUGH'
          ]
        },
        message: 'Real-time news analysis completed'
      });
    }

    // Regular world intelligence analysis
    const worldAnalysis = await worldConnectedIntelligence.analyzeWorldConnection(symbol || 'SPY');

    return NextResponse.json({
      success: true,
      data: worldAnalysis,
      message: 'World intelligence analysis completed'
    });

  } catch (error) {
    console.error('World Intelligence POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process world intelligence request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 