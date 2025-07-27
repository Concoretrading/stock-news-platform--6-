import { NextResponse } from 'next/server';
import { futureIntelligenceEngine } from '../../../lib/services/future-intelligence-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const includeNewsAnalysis = searchParams.get('includeNews') !== 'false';
    
    console.log(`🔮 FUTURE INTELLIGENCE ANALYSIS for ${ticker}...`);
    
    // Mock current positions for analysis
    const currentPositions = [
      {
        ticker: ticker,
        position_type: 'LONG_CALLS',
        size: 1000,
        entry_price: 150.67,
        expiration: '2024-01-26',
        delta: 0.65
      }
    ];
    
    // Run comprehensive future intelligence analysis
    const futureIntelligence = await futureIntelligenceEngine.analyzeFutureIntelligence(
      ticker, 
      currentPositions
    );
    
    return NextResponse.json({
      success: true,
      ticker,
      future_intelligence: futureIntelligence,
      system_info: {
        analysis_type: 'FUTURE_INTELLIGENCE_ENGINE',
        capabilities: [
          'Event Impact Prediction',
          'News Interpretation & Analysis',
          'Position Preparation Strategies',
          'Seasonal Intelligence',
          'Historical Pattern Matching',
          'Real-time News Processing',
          'Contingency Planning',
          'Elite Timing Intelligence'
        ],
        data_sources: [
          'Economic Calendar',
          'Earnings Schedule',
          'Real-time News Feeds',
          'Historical Event Database',
          'Seasonal Pattern Analysis',
          'Market Microstructure Data'
        ]
      },
      elite_summary: {
        critical_events_ahead: futureIntelligence.upcoming_events.filter(e => 
          e.importance === 'CRITICAL' || e.importance === 'HIGH'
        ).length,
        preparation_required: futureIntelligence.preparation_strategies.length > 0,
        news_sentiment: futureIntelligence.news_analysis.length > 0 ? 
          futureIntelligence.news_analysis[0].sentiment : 'neutral',
        seasonal_bias: futureIntelligence.seasonal_intelligence.current_period,
        key_message: futureIntelligence.upcoming_events.some(e => e.importance === 'CRITICAL') ?
          '🚨 CRITICAL EVENTS APPROACHING - Prepare positions immediately' :
          futureIntelligence.upcoming_events.some(e => e.importance === 'HIGH') ?
          '⚠️ Important events ahead - Begin preparation strategy' :
          '✅ Clear path ahead - Focus on current market opportunities'
      },
      actionable_intelligence: {
        immediate_actions: futureIntelligence.elite_recommendations.slice(0, 3),
        preparation_timeline: futureIntelligence.preparation_strategies.length > 0 ?
          futureIntelligence.preparation_strategies[0].preparation_timeline : null,
        risk_adjustments: futureIntelligence.upcoming_events
          .filter(e => e.importance === 'HIGH' || e.importance === 'CRITICAL')
          .map(e => e.preparation_requirements.position_adjustments)
          .flat()
          .slice(0, 5)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Future Intelligence analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze future intelligence',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { newsItem } = body;
    
    console.log('📰 PROCESSING BREAKING NEWS...');
    
    // Interpret breaking news in real-time
    const newsAnalysis = await futureIntelligenceEngine.interpretBreakingNews(newsItem);
    
    return NextResponse.json({
      success: true,
      news_analysis: newsAnalysis,
      system_info: {
        analysis_type: 'REAL_TIME_NEWS_INTERPRETATION',
        processing_time: 'Under 3 seconds',
        confidence: newsAnalysis.credibility_score
      },
      immediate_recommendations: {
        urgency: newsAnalysis.market_impact_score > 80 ? 'HIGH' : 
                newsAnalysis.market_impact_score > 60 ? 'MEDIUM' : 'LOW',
        actions: newsAnalysis.immediate_actions.position_adjustments,
        opportunities: newsAnalysis.immediate_actions.new_opportunities,
        risks: newsAnalysis.immediate_actions.risk_changes
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('News interpretation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to interpret news',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 