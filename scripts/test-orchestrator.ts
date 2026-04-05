import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { pillarOrchestrator } from '../lib/pillars/PillarOrchestrator';
import { nemotronService } from '../lib/services/nemotron-service';

async function runConcreteExample() {
  const symbol = 'NVDA';
  const currentPrice = 905.42;

  // Mock Market Snapshot (In a real run, this would be live data from Schwab/Polygon)
  const marketSnapshot = {
    history: [
      { close: 890, volume: 1000000 },
      { close: 895, volume: 1200000 },
      { close: 900, volume: 1500000 }
    ],
    liveContext: {
      baton_phase: 'VALIDATED_WHISPER',
      specific_events: ['bull_trap_divergence']
    }
  };

  console.log(`🚀 STARTING PREDATOR ORCHESTRATION: ${symbol} at $${currentPrice}`);

  // 1. RUN ORCHESTRATOR
  const strategicBrief = await pillarOrchestrator.getIntegratedBriefing(symbol, currentPrice, marketSnapshot);

  console.log('\n--- 📁 STRATEGIC BRIEF GENERATED ---');
  console.log(`Global Bias: ${strategicBrief.overallBias} (${strategicBrief.confidenceScore}%)`);
  console.log(`Manipulation Risk: ${strategicBrief.manipulationRisk.level}`);
  console.log(`Logic: ${strategicBrief.manipulationRisk.description}`);
  
  console.log('\n💡 RAY DALIO PRINCIPLES:');
  strategicBrief.dalioPrinciplesContext.forEach(p => console.log(`- ${p}`));

  console.log('\n🔮 PROBABILISTIC SCENARIOS:');
  strategicBrief.scenarios.forEach(s => console.log(`- ${s.name}: ${s.probability}% (Target: $${s.targetPrice})`));

  // 2. SEND TO NEMOTRON
  console.log('\n🧠 SENDING BRIEF TO NEMOTRON FOR DEEP REASONING...');
  
  const synthesisRequest = {
    ticker: symbol,
    currentPrice: currentPrice,
    expertSignals: {
      psychology: strategicBrief.pillarSummaries.context.rawMetrics,
      behavioral: strategicBrief.pillarSummaries.priceAction.rawMetrics,
      flow: strategicBrief.pillarSummaries.flow.rawMetrics,
      news: strategicBrief.pillarSummaries.context.keyInsights,
      technical: strategicBrief.pillarSummaries.momentum.rawMetrics
    },
    macroContext: `Global Bias: ${strategicBrief.overallBias}. Dalio Insights: ${strategicBrief.dalioPrinciplesContext.join('; ')}`,
    reasoningBudget: 75
  };

  const finalDecision = await nemotronService.synthesizeIntelligence(synthesisRequest);

  console.log('\n--- 🏆 FINAL STRATEGIC DECISION ---');
  console.log(`Action: ${finalDecision.final_trade_direction}`);
  console.log(`Confidence: ${finalDecision.confidence}%`);
  console.log(`Reasoning: ${finalDecision.internal_reasoning.substring(0, 300)}...`);
  console.log('\n--- 🎯 TACTICAL GUIDANCE FOR QWEN ---');
  console.log(`Instruction: ${strategicBrief.tacticalDirectives.instruction}`);
  console.log(`Invalidation: $${strategicBrief.tacticalDirectives.invalidationPoint}`);
}

runConcreteExample().catch(console.error);
