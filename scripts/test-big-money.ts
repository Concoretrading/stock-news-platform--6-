
import { bigMoneyFlowInterpreter } from '../lib/services/big-money-flow-interpreter';

async function testBigMoneyFlow() {
    console.log('💼 Testing BigMoneyFlow Interpreter...');

    // Scenario 1: Gap Up + High Volume Retest (The "Trap" or "Retreat")
    console.log('\n🧠 SCENARIO 1: Gap Up with Heavy Selling on Retest');
    // Open $450 (Gap Up from Prev Close $445), Current $448 (Retesting Gap), Vol High

    try {
        const analysis1 = await bigMoneyFlowInterpreter.analyzeFlow(
            'SPY',
            448.00, // Current
            450.00, // Open
            445.00, // Prev Close
            150000, // Current Vol (High)
            10000   // Avg Vol (Low baseline for test)
        );

        console.log('   Report 1:');
        console.log(`   - Gap Type: ${analysis1.gap_analysis.gap_type} (${analysis1.gap_analysis.description})`);
        console.log(`   - Strength Test: ${analysis1.strength_test.selling_pressure} Pressure`);
        console.log(`   - Retreat Probability: ${analysis1.strength_test.retreat_probability}%`);
        console.log(`   - Institutional Intent: ${analysis1.institutional_intent.action}`);
        console.log(`   - Strategic Bias: ${analysis1.strategic_bias}`);

    } catch (e) {
        console.error("Error during test 1:", e);
    }

    // Scenario 2: Gap Up + Low Volume Absorption (The "Value Buy")
    console.log('\n🧠 SCENARIO 2: Gap Up with Low Volume Support');
    try {
        const analysis2 = await bigMoneyFlowInterpreter.analyzeFlow(
            'SPY',
            448.00, // Current
            450.00, // Open
            445.00, // Prev Close
            5000,   // Current Vol (Low - Absorption)
            10000   // Avg Vol
        );

        console.log('   Report 2:');
        console.log(`   - Strength Test: ${analysis2.strength_test.selling_pressure} Pressure`);
        console.log(`   - Forecast: ${analysis2.strength_test.outcome_forecast}`);
        console.log(`   - Strategic Bias: ${analysis2.strategic_bias}`);

    } catch (e) {
        console.error("Error during test 2:", e);
    }
}

testBigMoneyFlow();
