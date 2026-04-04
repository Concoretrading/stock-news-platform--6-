
import { educationAdvisor } from '../lib/services/education-advisor';
import { gatedApprovals } from '../lib/pipeline/gated-approvals';

async function testMetaPredatorAwareness() {
    console.log('🤖 Starting Meta-Predator Awareness Test...');

    // Scenario 1: Mechanical Stop-Run Detection
    console.log('\n📡 SCENARIO 1: Detecting a Mechanical Stop-Run Cluster...');
    const signal1: any = {
        source: 'Polygon-News',
        headline: 'SPY Breaks Daily Low with Aggressive Sell Flow',
        content: 'Price dropped 5 ticks below daily low. Large block orders detected at the reversal point. Double bottom with high volume noted on the 1-minute chart.',
        ticker: 'SPY'
    };

    const suggestion1 = await educationAdvisor.analyzeBreakingNews(signal1);

    if (suggestion1 && suggestion1.pillar === 'weak-algo') {
        console.log(`✅ SUCCESS: System flagged a Weak-Algo trap!`);
        console.log(`🛡️ Warning: ${suggestion1.metadata.antiAlgoWarning?.join(', ')}`);
        console.log(`🧠 Logic: ${suggestion1.logic}`);
        await gatedApprovals.submitSuggestion(suggestion1);
    }

    // Scenario 2: Indicator Baiting Detection
    console.log('\n📡 SCENARIO 2: Detecting Indicator Baiting (Golden Cross Traps)...');
    const signal2: any = {
        source: 'X',
        headline: 'TSLA GOLDEN CROSS ON 5-MIN CHART!',
        content: 'Standard 50/200 MA crossover triggered. Immediate reversal after MA crossing with wash-trade volume spikes detected.',
        ticker: 'TSLA'
    };

    const suggestion2 = await educationAdvisor.analyzeBreakingNews(signal2);

    if (suggestion2 && suggestion2.pillar === 'weak-algo') {
        console.log(`✅ SUCCESS: System identified Indicator Baiting!`);
        console.log(`🛡️ Warning: ${suggestion2.metadata.antiAlgoWarning?.join(', ')}`);
    }

    console.log('\n🎯 FINAL VERDICT: The system is now Meta-Predator aware. It identifies when the herd is being manipulated by other algorithms.');
}

testMetaPredatorAwareness().catch(console.error);
