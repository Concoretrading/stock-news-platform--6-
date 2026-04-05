import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { brainCoordinator } from '../lib/pillars/BrainCoordinator';

/**
 * DEEP PREPARATION PHASE TEST
 * Simulates 30-60m before market open for NVDA.
 */
async function testDeepPrep() {
  console.log('🚀 INITIALIZING DEEP PREPARATION PHASE TEST...');

  const symbol = 'NVDA';
  const currentPrice = 905.42;

  // 1. Mock Market Snapshot (Pre-Market)
  const snapshot = {
    history: [
      { close: 890, volume: 1000000 },
      { close: 895, volume: 1200000 },
      { close: 900, volume: 1500000 }
    ],
    liveContext: {
        baton_phase: 'VALIDATED_WHISPER',
        specific_events: ['bull_trap_divergence']
    },
    volumeSpike: true
  };

  try {
    // 2. Run the Deep Preparation Cycle
    const result = await brainCoordinator.runPreMarketPreparation(symbol, currentPrice, snapshot);

    console.log('\n--- 🌅 PHASE 1: DEEP PREP BRIEF ---');
    console.log(`Symbol: ${result.brief.symbol} | Bias: ${result.brief.executiveSummary.overallBias} (${result.brief.executiveSummary.convictionScore}%)`);
    console.log(`Movie Title: ${result.brief.narrativeMovie.title}`);
    console.log(`Movie Stage: ${result.brief.narrativeMovie.stage}`);
    console.log(`Macro Gold: ${result.brief.macroContext.intermarketDynamics.gold.trend}`);
    console.log(`Relative Strength (MU): ${result.brief.macroContext.relativeStrength.gauge_names[0].signal}`);
    
    console.log('\n--- 🎭 INSTITUTIONAL INTELLIGENCE ---');
    console.log(`Big Money Intent: ${result.brief.institutionalIntelligence.bigMoneyIntent}`);
    console.log('Deviations:');
    result.brief.institutionalIntelligence.deviationsFromShould.forEach(d => console.log(` * ${d}`));

    console.log('\n--- 🧠 PHASE 2: NEMOTRON STRATEGIC REASONING ---');
    console.log(`Thesis: ${result.strategic.autonomous_thesis}`);
    console.log(`Confidence: ${result.strategic.confidence}%`);
    console.log(`Traps: ${result.strategic.potential_traps_identified.join(', ')}`);

    console.log('\n--- ⚖️ SCENARIO ANALYSIS ---');
    result.brief.scenarios.forEach(s => console.log(` * ${s.name}: ${s.probability}% (Trigger: ${s.trigger})`));

    console.log('\n--- 🚀 QWEN TACTICAL READINESS ---');
    console.log(`Style: ${result.brief.qwenTacticalGuidance.executionStyle}`);
    console.log(`Entry: $${result.brief.qwenTacticalGuidance.primaryEntryLevel}`);
    console.log(`Runners: ${result.brief.qwenTacticalGuidance.runnersAdvice}`);

    console.log('\n✅ DEEP PREPARATION PHASE VERIFIED.');
  } catch (error) {
    console.error('❌ Deep Prep Test Failed:', error);
  }
}

testDeepPrep().catch(console.error);
