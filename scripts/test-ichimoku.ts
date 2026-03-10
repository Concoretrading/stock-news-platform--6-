
import { ichimokuCloudInterpreter } from '../lib/services/ichimoku-cloud-interpreter';
import { InstitutionalFlowAnalysis } from '../lib/services/big-money-flow-interpreter';
import { ExtensionConfluenceAnalysis } from '../lib/services/extension-ma-confluence';

async function testIchimoku() {
    console.log('☁️ Testing Ichimoku Cloud Interpreter...');

    // Scenario 1: Bullish Bounce off Cloud Top (Ideal Entry)
    console.log('\n🧠 SCENARIO 1: Bullish Bounce off Cloud Top');

    // Create synthetic price data (Uptrend, pullback to support)
    // Cloud Top approx 150
    const closes = Array(52).fill(160);
    closes.push(152); // Pullback to near 150
    closes.push(151); // Touching cloud top area

    // Mock Ichimoku Components (Force the state we want for testing)
    // We can't easily mock private methods, so we rely on the input arrays producing roughly what we want
    // OR we just interpret the output of the analyzer.
    // To properly test "Cloud Top" we need 52 periods of data.

    // Let's create a scenario where Cloud is at ~140-150.
    // Highs 160, Lows 140 -> Mid ~150.
    const highs = Array(52).fill(160);
    const lows = Array(52).fill(140);
    const volume = Array(52).fill(10000); // Standard volume

    // Mock Flow: Accumulation
    const flow: InstitutionalFlowAnalysis = {
        timestamp: new Date().toISOString(),
        symbol: 'TSLA',
        gap_analysis: { active_gap: null, gap_type: 'NONE', description: '' },
        strength_test: { tested_level: null, selling_pressure: 'LOW', retreat_probability: 20, outcome_forecast: 'SUPPORT_LIKELY' },
        institutional_intent: { action: 'ACCUMULATION', confidence: 80, reason: 'Buying the dip' },
        strategic_bias: 'FOLLOW_INSTITUTIONS'
    };

    try {
        const result = await ichimokuCloudInterpreter.analyzeCloud(
            'TSLA', closes, highs, lows, volume, flow
        );

        console.log('   Report 1:');
        console.log(`   - Trend Bias: ${result.trend_bias}`);
        console.log(`   - Cloud Status: ${result.interaction.status}`);
        console.log(`   - Interaction: ${result.interaction.interaction_type} (${result.interaction.support_resistance_strength} Cloud)`);
        console.log(`   - Strategy: ${result.handling_rule}`);
        console.log(`   - Confluence Score: ${result.confluence_score}`);

    } catch (e) {
        console.error("Error during test 1:", e);
    }

    // Scenario 2: Bearish Fade (Rally into Thick Cloud Resistance)
    console.log('\n🧠 SCENARIO 2: Bearish Fade into Thick Cloud');

    // Downtrend. Cloud is above price.
    // Cloud ~160. Price rallies to 158.
    const closes2 = Array(52).fill(140);
    closes2.push(155);
    closes2.push(158); // Rally into resistance

    // Make cloud thick: Highs 180, Lows 140 -> Mid 160.
    const highs2 = Array(52).fill(180);
    const lows2 = Array(52).fill(140);

    try {
        // Mock Extension: Overbought
        const kState: any = { status: 'OVERBOUGHT' };
        const ext: ExtensionConfluenceAnalysis = {
            // ... minimal mock
            keltner_state: kState,
            ma_structure: { structural_support: { interaction: 'NONE' } } as any,
            confluence_score: 0,
            signal: { type: 'REVERSION_SHORT', confidence: 0, reason: '' } as any,
            timestamp: '', symbol: ''
        };

        const result2 = await ichimokuCloudInterpreter.analyzeCloud(
            'SPY', closes2, highs2, lows2, volume, undefined, ext
        );

        console.log('   Report 2:');
        console.log(`   - Trend Bias: ${result2.trend_bias}`); // Should be BEARISH if price < cloud bottom? 
        // Note: Our mocked arrays are constant so Cloud spans might be flat. 
        // If price 158 and Cloud Bottom (Senkou B) is ~160 (mid of 180/140), then price < cloud.
        console.log(`   - Cloud Status: ${result2.interaction.status}`);
        console.log(`   - Strategy: ${result2.handling_rule}`);
        console.log(`   - Confluence with Extension: ${result2.confluence_score > 60}`);

    } catch (e) {
        console.error("Error during test 2:", e);
    }
}

testIchimoku();
