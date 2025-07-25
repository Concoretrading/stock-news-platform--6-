import { NextRequest, NextResponse } from 'next/server';
import { PremiumProbabilityEngine } from '@/lib/services/premium-probability-engine';
import { optionsPremiumMastery } from '@/lib/services/options-premium-mastery';

const probabilityEngine = new PremiumProbabilityEngine();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const currentPrice = parseFloat(searchParams.get('price') || '0');
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }
    
    // Use current market price if not provided
    const price = currentPrice || 150.67; // Would get from real-time feed
    
    console.log(`🧠 PREMIUM PROBABILITY ANALYSIS for ${ticker} at $${price}`);
    
    // Get options premium analysis first
    const premiumAnalysis = await optionsPremiumMastery.masterPremiumAnalysisWithPatterns(ticker.toUpperCase(), price);
    
    // Extract consolidation patterns and option chain
    const consolidationPatterns = premiumAnalysis.consolidationAnalysis;
    const optionChain = premiumAnalysis.real_time_tracking.tracked_strikes;
    const atr = premiumAnalysis.atrAnalysis.currentATR;
    
    // Run probability analysis
    const probabilityAnalysis = await probabilityEngine.analyzeSetup(
      ticker.toUpperCase(),
      price,
      consolidationPatterns,
      Array.from(optionChain.values()),
      atr
    );
    
    // Log key insights
    console.log('\n🧠 PROBABILITY ANALYSIS RESULTS:');
    console.log(`🎯 Breakout Probability: ${probabilityAnalysis.probabilityAssessment.breakoutProbability.toFixed(1)}%`);
    console.log(`💪 Confidence Score: ${probabilityAnalysis.probabilityAssessment.confidenceScore.toFixed(1)}%`);
    console.log(`📈 Expected Move: ${probabilityAnalysis.probabilityAssessment.expectedMoveSize.toFixed(1)}%`);
    console.log(`⚠️ Key Risks: ${probabilityAnalysis.probabilityAssessment.keyRisks.join(', ')}`);
    
    // Log scaling strategy
    console.log('\n📊 SCALING STRATEGY:');
    console.log(`🎯 Initial Entry: ${probabilityAnalysis.recommendedStrategy.entryStages.initial.size * 100}% at ${probabilityAnalysis.recommendedStrategy.entryStages.initial.strike}`);
    probabilityAnalysis.recommendedStrategy.exitStages.targets.forEach((target, i) => {
      console.log(`📍 Target ${i + 1}: ${target.percentage}% profit, Scale ${target.size * 100}%, Move stop to ${target.adjustStopTo}%`);
    });
    console.log(`🛡️ Hedge: ${probabilityAnalysis.recommendedStrategy.hedgeRules.initialHedge.type} at ${probabilityAnalysis.recommendedStrategy.hedgeRules.initialHedge.when}`);
    
    return NextResponse.json({
      success: true,
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString(),
      price,
      analysis: probabilityAnalysis,
      summary: {
        breakoutProbability: probabilityAnalysis.probabilityAssessment.breakoutProbability,
        confidenceScore: probabilityAnalysis.probabilityAssessment.confidenceScore,
        expectedMove: probabilityAnalysis.probabilityAssessment.expectedMoveSize,
        optimalStrikes: {
          atr1: probabilityAnalysis.premiumSetup.optimalStrikes.atr1,
          atr2: probabilityAnalysis.premiumSetup.optimalStrikes.atr2
        },
        scalingStrategy: {
          initialEntry: {
            size: probabilityAnalysis.recommendedStrategy.entryStages.initial.size,
            strike: probabilityAnalysis.recommendedStrategy.entryStages.initial.strike
          },
          targets: probabilityAnalysis.recommendedStrategy.exitStages.targets,
          hedge: probabilityAnalysis.recommendedStrategy.hedgeRules.initialHedge
        },
        keyRisks: probabilityAnalysis.probabilityAssessment.keyRisks
      }
    });
    
  } catch (error) {
    console.error('Error in premium probability analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze premium probabilities' },
      { status: 500 }
    );
  }
} 