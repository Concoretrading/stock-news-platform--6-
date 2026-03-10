
import { extensionMAConfluence } from '../lib/services/extension-ma-confluence';
import { InstitutionalFlowAnalysis } from '../lib/services/big-money-flow-interpreter';

async function testExtensionMA() {
    console.log('🦴 Testing ExtensionMA Confluence...');

    // Scenario 1: Extreme Overbought + Big Money Distribution (Fade Setup)
    console.log('\n🧠 SCENARIO 1: Extreme Overbought + Institutional Distribution');

    // Create synthetic price data (Uptrend into parabolic blowoff)
    const closes = Array.from({ length: 50 }, (_, i) => 100 + (i * 1.5)); // Linear up
    closes[48] = 175; // Spike
    closes[49] = 180; // Blowoff top (way above trend)

    // Highs/Lows for ATR
    const highs = closes.map(c => c + 2);
    const lows = closes.map(c => c - 2);

    // Mock Flow: Distribution
    const flow: InstitutionalFlowAnalysis = {
        timestamp: new Date().toISOString(),
        symbol: 'SPY',
        gap_analysis: { active_gap: null, gap_type: 'NONE', description: '' },
        strength_test: { tested_level: null, selling_pressure: 'HIGH', retreat_probability: 80, outcome_forecast: 'RETREAT_LIKELY' },
        institutional_intent: { action: 'DISTRIBUTION', confidence: 85, reason: 'Distribution' },
        strategic_bias: 'FADE_RETAIL'
    };

    try {
        const result = await extensionMAConfluence.analyzeExtension(
            'SPY', [], closes, highs, lows, flow
        );

        console.log('   Report 1:');
        console.log(`   - Keltner Status: ${result.keltner_state.status} (Ext Factor: ${result.keltner_state.extension_factor.toFixed(2)})`);
        console.log(`   - 21MA Extension: ${result.ma_structure.ma_21_diff_percent.toFixed(2)}%`);
        console.log(`   - Confluence Score: ${result.confluence_score}`);
        console.log(`   - Signal: ${result.signal.type} (${result.signal.reason})`);

    } catch (e) {
        console.error("Error during test 1:", e);
    }

    // Scenario 2: Healthy Pullback to 50SMA (Continuation)
    console.log('\n🧠 SCENARIO 2: Healthy Pullback to 50SMA');

    // Uptrend then pullback
    const closes2 = Array.from({ length: 60 }, (_, i) => 100 + i);
    // Pull back to ~125 (approx 50SMA level after run)
    // Manually crafting to hit 50SMA logic is tricky without full calc, so mocking inputs by overriding calculateMAs would be ideal, 
    // but here we just rely on the math.
    // 50SMA of linear 100..159 is approx 134.5?
    // Let's just feed a flat line then jump to 50SMA check.

    const closes3 = Array(50).fill(150); // SMA50 will be 150
    closes3.push(150.5); // Price at 150.5 (Bounce off 150)

    try {
        const result2 = await extensionMAConfluence.analyzeExtension(
            'QQQ', [], closes3, Array(51).fill(152), Array(51).fill(148)
        );

        console.log('   Report 2:');
        console.log(`   - 50SMA Interaction: ${result2.ma_structure.structural_support.interaction}`);
        console.log(`   - Signal: ${result2.signal.type}`);

    } catch (e) {
        console.error("Error during test 2:", e);
    }
}

testExtensionMA();
