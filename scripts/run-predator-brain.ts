import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { BrainCoordinator } from '../lib/pillars/BrainCoordinator';

async function testFullPredatorBrain() {
  console.log('🚀 INITIALIZING FULL PREDATOR INTELLIGENCE LOOP...');

  // 1. Initialize Brain with a specific Market Open time (e.g., 2 hours ago to trigger H200 era)
  const marketOpen = new Date();
  marketOpen.setHours(marketOpen.getHours() - 2);
  const brain = new BrainCoordinator(marketOpen);

  // 2. Mock Live Market Snapshot
  const symbol = 'NVDA';
  const currentPrice = 905.42;
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
    // 3. Run the complete Decision Cycle
    const result = await brain.runDecisionCycle(symbol, currentPrice, snapshot);

    console.log('\n--- 📁 PHASE 1: PILLAR SYNTHESIS ---');
    console.log(`Symbol: ${result.brief.symbol} | Bias: ${result.brief.overallBias} (${result.brief.confidenceScore}%)`);
    console.log(`Insight: ${result.brief.pillarInsights.flow[0]}`);

    console.log('\n--- 🧠 PHASE 2: NEMOTRON STRATEGY ---');
    console.log(`Thesis: ${result.strategic.autonomous_thesis}`);
    console.log(`Conviction: ${result.strategic.confidence}%`);

    console.log('\n--- 🐆 PHASE 3: QWEN TACTICAL ---');
    console.log(`Action: ${result.tactical.action}`);
    console.log(`Entry: $${result.tactical.entryPrice}`);
    console.log(`Stop: $${result.tactical.stopLoss}`);
    console.log(`Reasoning: ${result.tactical.reasoning}`);

    console.log('\n✅ PREDATOR BRAIN BRIDGE VERIFIED.');
  } catch (error) {
    console.error('❌ Integration Test Failed:', error);
  }
}

testFullPredatorBrain().catch(console.error);
