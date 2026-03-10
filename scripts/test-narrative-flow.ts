
import { narrativeFlowEngine } from '../lib/services/narrative-flow-engine';
import { newsGravityAnalyzer } from '../lib/services/news-gravity-analyzer';

async function testNarrativeFlow() {
    console.log('🧪 STARTING NARRATIVE FLOW & SHOCK INTEGRATION TEST\n');

    const ticker = 'SPY';

    // 1. Scene 1: The Hook (War News) - Expected but meaningful
    console.log('🎬 STEP 1: News breaks about War Tensions (Expected initial shock)...');
    const step1 = narrativeFlowEngine.processNews('War Tensions', ['geopolitical', 'conflict'], { actual: 1, expected: 0.5 });
    console.log(`   Narrative: ${step1.narrative.topic} | Stage: ${step1.narrative.current_stage} | Intensity: ${step1.narrative.intensity}`);

    // 2. Scene 2: The Script (Consolidation)
    console.log('\n🎬 STEP 2: Narrative consolidates with justifications...');
    narrativeFlowEngine.processNews('War Tensions', ['geopolitical', 'conflict']); // To THE_SCRIPT
    const step2 = narrativeFlowEngine.processNews('War Tensions', ['geopolitical', 'conflict']); // To THE_CLIMAX
    console.log(`   Narrative: ${step2.narrative.topic} | Stage: ${step2.narrative.current_stage} | Intensity: ${step2.narrative.intensity}`);

    // Check for Peak Emotion
    const isPeak = narrativeFlowEngine.isPeakEmotion('War Tensions');
    console.log(`   Is Peak Emotion? ${isPeak ? '✅ YES' : '❌ NO'}`);

    // 3. Gravity Analysis at Peak
    console.log('\n🌌 STEP 3: Analyzing News Gravity at Narrative Climax...');
    const gravityAnalysis = await newsGravityAnalyzer.analyzeGravity(ticker);
    console.log(`   Narrative Context: ${gravityAnalysis.narrative_context}`);
    console.log(`   Trap Detection: ${gravityAnalysis.trap_detection.description}`);

    // 4. Scene 3: The Displacement + Shock (Massive Tech Breakthrough)
    console.log('\n🎬 STEP 4: Massive Tech Breakthrough (UNEXPECTED SHOCK) enters, displacing War news...');
    const step4 = narrativeFlowEngine.processNews('AI Revolution Spark', ['tech', 'productivity', 'earnings'], { actual: 9.5, expected: 1.0, stdDev: 1.0 }); // SHOCK (8.5 SD)

    if (step4.displacement) {
        console.log(`   🚨 DISPLACEMENT DETECTED!`);
        console.log(`   Displaced: ${step4.displacement.displaced_topic} | Intensity Drop: ${step4.displacement.intensity_drop}`);
        console.log(`   New Driver Status: ${step4.narrative.expectation_status} | Shock Factor: ${step4.narrative.shock_factor}`);
    }

    // 5. Gravity Analysis at Shock
    console.log('\n🌌 STEP 5: Analyzing News Gravity during SHOCK (AI Revolution Spark)...');
    const gravityShock = await newsGravityAnalyzer.analyzeGravity(ticker, 'AI Revolution Spark');
    const bullScenario = gravityShock.active_scenarios.find(s => s.name === 'BULL_CASE');
    console.log(`   Scenario: ${bullScenario?.description}`);
    console.log(`   Targets: ${bullScenario?.price_targets.join(', ')} (Expect multiplier applied)`);

    // 6. Scene 4: Bait Detection simulation (Expected news + High Sentiment)
    console.log('\n🎬 STEP 6: Simulating Bait (Expected news + High Sentiment)...');
    narrativeFlowEngine.processNews('AI Revolution Spark', ['tech'], { actual: 1.0, expected: 1.0 }); // Progress to Script with Expected data

    // Mocking high intensity for bait detection
    const step6 = narrativeFlowEngine.processNews('AI Revolution Spark', ['tech'], { actual: 1.0, expected: 1.0 }); // Progress to Climax

    const gravityWithBait = await newsGravityAnalyzer.analyzeGravity(ticker);
    console.log(`   Narrative: ${step6.narrative.topic} | Stage: ${step6.narrative.current_stage} | Status: ${step6.narrative.expectation_status}`);
    console.log(`   Trap Detection: ${gravityWithBait.trap_detection.description}`);

    console.log('\n✅ NARRATIVE FLOW & SHOCK TEST COMPLETE');
}

testNarrativeFlow().catch(console.error);
