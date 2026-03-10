import { NextRequest, NextResponse } from 'next/server';
import { MultiPillarPatternAnalyzer } from '../../../lib/services/multi-pillar-pattern-analyzer';
import { PolygonDataProvider } from '../../../lib/services/polygon-data-provider';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'META';
    const months = parseInt(searchParams.get('months') || '6');
    
    // Calculate date range (6 months back from now)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`🧠 Starting ${months}-month multi-pillar analysis for ${symbol}`);
    console.log(`📅 Date range: ${startDateStr} to ${endDateStr}`);
    
    const dataProvider = new PolygonDataProvider();
    const analyzer = new MultiPillarPatternAnalyzer();
    
    const timeframes = ['day', '4hour', '1hour'];
    const results: any = {};
    
    for (const timeframe of timeframes) {
      try {
        console.log(`\n📊 Analyzing ${timeframe} timeframe...`);
        
        // Get historical data
        const data = await dataProvider.getHistoricalData(
          symbol,
          startDateStr,
          endDateStr,
          timeframe,
          50000 // High limit for comprehensive analysis
        );
        
        if (!data || data.length < 50) {
          console.log(`⚠️ Insufficient data for ${timeframe}, skipping...`);
          continue;
        }
        
        console.log(`✅ Got ${data.length} bars for ${timeframe}`);
        
        // Analyze all pillars
        const analysis = await analyzer.analyzeAllPillars(
          symbol,
          data,
          timeframe,
          startDateStr,
          endDateStr
        );
        
        results[timeframe] = analysis;
        
        console.log(`📊 ${timeframe} Analysis Complete:`);
        console.log(`  - Volume patterns: ${analysis.individual_pillars.volume.length}`);
        console.log(`  - S/R patterns: ${analysis.individual_pillars.support_resistance.length}`);
        console.log(`  - Price action patterns: ${analysis.individual_pillars.price_action.length}`);
        console.log(`  - Momentum patterns: ${analysis.individual_pillars.momentum.length}`);
        console.log(`  - Premium patterns: ${analysis.individual_pillars.premium.length}`);
        console.log(`  - Combined patterns: ${analysis.combined_patterns.length}`);
        console.log(`  - Best pillar: ${analysis.statistics.best_performing_pillar}`);
        
      } catch (error) {
        console.error(`❌ Error analyzing ${timeframe}:`, error);
        results[timeframe] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    // Generate comprehensive insights
    const insights = generateComprehensiveInsights(results);
    
    return NextResponse.json({
      success: true,
      symbol,
      analysis_period: `${months} months`,
      date_range: { start: startDateStr, end: endDateStr },
      timeframe_results: results,
      comprehensive_insights: insights,
      execution_summary: {
        timeframes_analyzed: Object.keys(results).filter(tf => !results[tf].error),
        total_patterns_found: Object.values(results)
          .filter((r: any) => !r.error)
          .reduce((sum: number, r: any) => sum + r.statistics.total_patterns, 0),
        best_timeframe: findBestTimeframe(results),
        top_pattern_combinations: getTopCombinations(results)
      }
    });
    
  } catch (error) {
    console.error('Error in multi-pillar analysis:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

function generateComprehensiveInsights(results: any) {
  const insights = {
    pillar_performance: {} as Record<string, any>,
    cross_timeframe_patterns: [] as any[],
    trading_recommendations: [] as string[],
    risk_analysis: {} as any
  };
  
  // Analyze pillar performance across timeframes
  const pillars = ['volume', 'support_resistance', 'price_action', 'momentum', 'premium'];
  
  for (const pillar of pillars) {
    const pillarData = {
      avg_success_rate: 0,
      best_timeframe: '',
      pattern_count: 0,
      top_patterns: [] as any[]
    };
    
    let totalSuccessRate = 0;
    let timeframeCount = 0;
    let bestRate = 0;
    
    for (const [timeframe, analysis] of Object.entries(results)) {
      if ((analysis as any).error) continue;
      
      const pillarPatterns = (analysis as any).individual_pillars[pillar] || [];
      if (pillarPatterns.length > 0) {
        const avgRate = pillarPatterns.reduce((sum: number, p: any) => sum + p.success_rate, 0) / pillarPatterns.length;
        totalSuccessRate += avgRate;
        timeframeCount++;
        pillarData.pattern_count += pillarPatterns.length;
        
        if (avgRate > bestRate) {
          bestRate = avgRate;
          pillarData.best_timeframe = timeframe;
        }
        
        // Collect top patterns
        pillarData.top_patterns.push(
          ...pillarPatterns
            .sort((a: any, b: any) => b.success_rate - a.success_rate)
            .slice(0, 3)
            .map((p: any) => ({ ...p, timeframe }))
        );
      }
    }
    
    pillarData.avg_success_rate = timeframeCount > 0 ? totalSuccessRate / timeframeCount : 0;
    pillarData.top_patterns = pillarData.top_patterns
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 5);
    
    insights.pillar_performance[pillar] = pillarData;
  }
  
  // Generate trading recommendations
  const bestPillar = Object.entries(insights.pillar_performance)
    .sort(([,a], [,b]) => (b as any).avg_success_rate - (a as any).avg_success_rate)[0];
  
  if (bestPillar) {
    insights.trading_recommendations.push(
      `Focus on ${bestPillar[0].replace('_', ' ')} signals - highest average success rate of ${(bestPillar[1] as any).avg_success_rate.toFixed(1)}%`
    );
    
    insights.trading_recommendations.push(
      `Best timeframe for ${bestPillar[0].replace('_', ' ')}: ${(bestPillar[1] as any).best_timeframe}`
    );
  }
  
  // Find cross-timeframe alignment
  for (const [timeframe, analysis] of Object.entries(results)) {
    if ((analysis as any).error) continue;
    
    const topCombos = (analysis as any).combined_patterns
      .filter((c: any) => c.overall_success_rate > 70)
      .slice(0, 3);
    
    insights.cross_timeframe_patterns.push({
      timeframe,
      high_confidence_setups: topCombos.length,
      top_combination: topCombos[0] || null
    });
  }
  
  return insights;
}

function findBestTimeframe(results: any): string {
  let bestTimeframe = '';
  let bestScore = 0;
  
  for (const [timeframe, analysis] of Object.entries(results)) {
    if ((analysis as any).error) continue;
    
    const totalPatterns = (analysis as any).statistics.total_patterns;
    const avgSuccessRate = Object.values((analysis as any).statistics.avg_success_rates)
      .reduce((sum: number, rate: any) => sum + rate, 0) / 5;
    
    const score = totalPatterns * avgSuccessRate / 100;
    
    if (score > bestScore) {
      bestScore = score;
      bestTimeframe = timeframe;
    }
  }
  
  return bestTimeframe;
}

function getTopCombinations(results: any): any[] {
  const allCombos: any[] = [];
  
  for (const [timeframe, analysis] of Object.entries(results)) {
    if ((analysis as any).error) continue;
    
    const combos = (analysis as any).combined_patterns
      .map((c: any) => ({ ...c, timeframe }))
      .slice(0, 5);
    
    allCombos.push(...combos);
  }
  
  return allCombos
    .sort((a, b) => b.overall_success_rate - a.overall_success_rate)
    .slice(0, 10);
} 