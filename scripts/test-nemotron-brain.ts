import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local BEFORE other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Test script for verifying the Nemotron 3 Super integration.
 * Demonstrates how the expert signals are synthesized by the "Main Brain".
 */

async function runNemotronTest() {
    console.log('🧪 RUNNING NEMOTRON BRAIN INTEGRATION TEST...\n');

    // Dynamically import the engine AFTER env vars are loaded
    const { autonomousDecisionEngine } = await import('../lib/services/autonomous-decision-engine');

    // Use the type from the imported engine (or define locally for the test)
    const mockContext: any = {
        ticker: 'NVDA',
        current_price: 135.50,
        atr: 4.2,
        implied_volatility: 45,
        key_levels: {
            support: [130, 125],
            resistance: [140, 145]
        },
        internals: {
            tick: 400,
            add: 1200,
            vold: 1.5,
            vix: 18.5
        },
        time_of_day: 'OPEN'
    };

    console.log(`📡 Sending Market Context for ${mockContext.ticker} to Autonomous Decision Engine...`);

    try {
        const decision = await autonomousDecisionEngine.makeDecision(mockContext);

        console.log('\n🏆 FINAL AUTONOMOUS DECISION:');
        console.log(`   Decision ID: ${decision.decision_id}`);
        console.log(`   Should Trade: ${decision.should_trade}`);
        console.log(`   Direction: ${decision.trade_direction}`);
        console.log(`   Confidence: ${decision.confidence_score.toFixed(1)}%`);
        console.log('\n🧠 NEMOTRON REASONING:');
        decision.reasoning.filter(r => r.startsWith('Nemotron')).forEach(r => console.log(`   > ${r}`));

        console.log('\n⚠️ WARNINGS:');
        decision.warnings.forEach(w => console.log(`   - ${w}`));

        console.log('\n📋 EXECUTION RULES:');
        decision.execution_plan.scenario_rules.forEach(s => console.log(`   * ${s}`));

        console.log('\n✅ TEST COMPLETE.');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runNemotronTest();
