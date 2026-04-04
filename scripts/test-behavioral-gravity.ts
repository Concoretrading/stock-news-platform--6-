
import { behavioralGravityEngine } from '../lib/services/behavioral-gravity-engine';
import { newsGravityAnalyzer } from '../lib/services/news-gravity-analyzer';

async function testBehavioralGravity() {
    console.log('🌌 Testing BehavioralGravity Engine...');

    // 1. Setup Context (Mocking News Gravity Memory)
    console.log('\n📝 Setting up Anchor Points...');
    newsGravityAnalyzer.recordNewsEvent('SPY', 'Previous ATH', 480.00, 460.00, 'Bullish');

    // 2. Scenario A: The "Panic Sell" Trap (Loss Aversion + Fear)
    console.log('\n🧠 SCENARIO A: Panic Selling (Price $450, P&L -5%)');
    // Note: implementation checks psychology engine, which is mocked. 
    // We assume the engine returns "Fear" based on its internal mock state or we'd need to mock the dependency.
    // For this test, we rely on the default mock state of psychology engine.

    try {
        const analysisA = await behavioralGravityEngine.analyzeBehavioralBiases('SPY', 450.00, -5.0);
        console.log('   Bias Report A:');
        console.log(`   - Loss Aversion Factor: ${analysisA.biases_detected.prospect_theory.loss_aversion_factor.toFixed(2)}`);
        console.log(`   - Risk Modifier (Size): ${analysisA.risk_modifiers.max_size_multiplier}`);
        console.log(`   - Advice: ${analysisA.strategic_advice.join(' | ')}`);

        // 3. Scenario B: The "Premature Ejection" (Disposition Effect + Anchor)
        console.log('\n🧠 SCENARIO B: Selling Winner Early (Price $479, P&L +8%)');
        const analysisB = await behavioralGravityEngine.analyzeBehavioralBiases('SPY', 479.00, 8.0);
        console.log('   Bias Report B:');
        console.log(`   - Disposition Pressure: ${analysisB.biases_detected.disposition_effect.pressure}`);
        console.log(`   - Anchoring Active: ${analysisB.biases_detected.anchoring.active} (Level: ${analysisB.biases_detected.anchoring.anchored_level})`);
        console.log(`   - Advice: ${analysisB.strategic_advice.join(' | ')}`);

    } catch (e) {
        console.error("Error during test:", e);
    }
}

testBehavioralGravity();
