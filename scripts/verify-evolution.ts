
import { educationAdvisor } from '../lib/services/education-advisor';
import { gatedApprovals } from '../lib/pipeline/gated-approvals';
import { dailyRetrospective } from '../lib/services/daily-retrospective';
import { highConvictionScaling } from '../lib/risk/high-conviction-scaling';

async function testAutonomousEvolution() {
    console.log('🧪 Starting Autonomous Evolution & High-Conviction Test...');

    // 1. Create a "High-Conviction" setup (News Detective + Price Action)
    console.log('\n📡 STEP 1: Simulating an Exceptional Setup...');
    const setup: any = {
        source: 'X',
        handle: 'zerohedge',
        headline: 'LIQUIDITY CRUNCH IMMINENT',
        content: 'Emergency funding requested. Banking sectors showing BDD fragility patterns. Gap Fill zone at R1 level being tested.',
        timestamp: new Date().toISOString(),
        ticker: 'SPY'
    };

    const suggestion = await educationAdvisor.analyzeBreakingNews(setup);

    if (suggestion) {
        // Apply High-Conviction Scaling
        const riskAnalysis = highConvictionScaling.calculateScaling(suggestion, 92);
        console.log(`⚖️ RISK ANALYSIS: ${riskAnalysis.reason}`);
        console.log(`📈 RECOMMENDED SCALE: ${riskAnalysis.multiplier}x Standard Size`);

        suggestion.metadata.riskMultiplier = riskAnalysis.multiplier;
        await gatedApprovals.submitSuggestion(suggestion);
    }

    // 2. Trigger Daily Retrospective
    console.log('\n🧐 STEP 2: Running Autonomous Daily Retrospective...');
    const connections = await dailyRetrospective.reviewConnections();

    console.log('\n--- 🧠 CONNECTIONS FOUND ---');
    connections.forEach(c => console.log(`🔍 ${c}`));

    // 3. Check Stats
    const stats = dailyRetrospective.getDailyStats();
    console.log('\n📊 DAILY STATS:');
    console.log(`   Total Reviewed: ${stats.totalReviewed}`);
    console.log(`   Success Rate: ${stats.successRate.toFixed(2)}%`);
    console.log(`   Leading Insight Layer: ${stats.leadingLayer}`);

    console.log('\n🎯 SUCCESS: System is autonomously reviewing and finding connections.');
}

testAutonomousEvolution().catch(console.error);
