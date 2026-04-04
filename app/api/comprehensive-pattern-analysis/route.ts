import { NextRequest, NextResponse } from 'next/server';
import { ComprehensivePatternLearner } from '../../../lib/services/comprehensive-pattern-learner';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'SPY';
    const startDate = searchParams.get('start_date') || '2022-01-01';
    const endDate = searchParams.get('end_date') || '2024-01-01';
    
    console.log(`🧠 Starting comprehensive pattern analysis for ${symbol}`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    
    const learner = new ComprehensivePatternLearner(null);
    
    const analysis = await learner.analyzeComprehensivePatterns(
      symbol,
      startDate,
      endDate
    );
    
    console.log('\n📊 Analysis Summary:');
    console.log(`Total Patterns Found: ${analysis.summary.total_patterns_found}`);
    console.log(`Total Combinations: ${analysis.summary.total_combinations}`);
    console.log(`Best Performing Pillars:`, analysis.summary.best_performing_pillars);
    console.log(`Highest Probability Combinations:`, analysis.summary.highest_probability_combinations);
    
    return NextResponse.json({
      success: true,
      symbol,
      date_range: { start: startDate, end: endDate },
      analysis: {
        pillars: analysis.pillars,
        combinations: analysis.combinations,
        summary: analysis.summary
      },
      insights: {
        most_reliable_patterns: analysis.combinations
          .filter(c => c.success_rate > 70 && c.sample_size > 10)
          .slice(0, 5),
        pattern_categories: {
          price_action: analysis.pillars.filter(p => p.name.includes('price_action')).length,
          volume: analysis.pillars.filter(p => p.name.includes('volume')).length,
          momentum: analysis.pillars.filter(p => p.name.includes('momentum')).length,
          support_resistance: analysis.pillars.filter(p => p.name.includes('support_resistance')).length
        },
        recommendations: generateRecommendations(analysis)
      }
    });
    
  } catch (error) {
    console.error('Error in comprehensive pattern analysis:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

function generateRecommendations(analysis: any) {
  const recommendations = [];
  
  // Find best timeframe
  const timeframeCounts = new Map();
  analysis.pillars.forEach((pillar: any) => {
    const timeframe = pillar.name.split('_').pop();
    timeframeCounts.set(timeframe, (timeframeCounts.get(timeframe) || 0) + pillar.success_rate);
  });
  
  const bestTimeframe = Array.from(timeframeCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  if (bestTimeframe) {
    recommendations.push(`Focus on ${bestTimeframe} timeframe for highest success rates`);
  }
  
  // Find best pillar combinations
  const bestCombo = analysis.combinations[0];
  if (bestCombo && bestCombo.success_rate > 60) {
    recommendations.push(`Prioritize ${bestCombo.pillars.join(' + ')} combination (${bestCombo.success_rate.toFixed(1)}% success rate)`);
  }
  
  // Volume recommendations
  const volumePillars = analysis.pillars.filter((p: any) => p.name.includes('volume'));
  const avgVolumeSuccess = volumePillars.reduce((sum: number, p: any) => sum + p.success_rate, 0) / volumePillars.length;
  
  if (avgVolumeSuccess > 65) {
    recommendations.push('Volume confirmation is critical - wait for volume spikes before entering trades');
  }
  
  return recommendations;
} 