
import { finnhubService } from '../lib/services/finnhub-service';
import { grokService } from '../lib/services/grok-service';
import { liveDataAdapter, PolygonData } from '../lib/services/live-data-adapter';
import { newsGravityAnalyzer } from '../lib/services/news-gravity-analyzer';

async function verifyDualIntel() {
    console.log('🚀 INITIALIZING DUAL INTEL VERIFICATION...');

    // 1. Mock Polygon Data (Simulating a Breakout)
    const mockPriceData: PolygonData = {
        ticker: 'NVDA',
        price: 920.00,
        volume: 5000000,
        vwap: 905.00,
        prevClose: 900.00,
        timestamp: Date.now()
    };

    // To test TRAP detection specifically
    const mockContextOverride = {
        specific_events: ['bull_trap_divergence']
    };

    // 2. Mock Price Action Bars (for PremiumMastery validation)
    const mockBars = Array(30).fill(0).map((_, i) => ({
        c: 900 + (i * 0.5),
        h: 901 + (i * 0.5),
        l: 899 + (i * 0.5),
        o: 900 + (i * 0.5),
        v: 1000
    }));

    console.log('\n--- PHASE 1: Data Synthesis (The Baton Pass) ---');
    try {
        const context = await liveDataAdapter.synthesizeLiveContext(mockPriceData);
        console.log('✅ Live Context Synthesized Successfully');
        console.log(`   - Sentiment: ${context.news_sentiment}`);
        console.log(`   - Participant State: ${context.participant_state}`);
        console.log(`   - Events: ${context.specific_events?.join(', ') || 'None'}`);
        console.log(`   - Baton Phase: ${context.baton_phase}`);

        console.log('\n--- PHASE 2: Gravity Analysis (Scenario Shifting) ---');
        const gravityReport = await newsGravityAnalyzer.analyzeGravity('NVDA', 'Earnings Leak', { ...context, ...mockContextOverride });
        console.log('✅ Gravity Analysis Completed');
        console.log(`   - Recommendation: ${gravityReport.recommendation}`);

        const bullScenario = gravityReport.active_scenarios.find(s => s.name === 'BULL_CASE');
        console.log(`   - Bull Case Probability: ${bullScenario?.probability}%`);
        console.log(`   - Scenario Description: ${bullScenario?.description}`);

        if (gravityReport.trap_detection.active) {
            console.log(`   🚨 TRAP DETECTED: ${gravityReport.trap_detection.type}`);
            console.log(`   - Description: ${gravityReport.trap_detection.description}`);
        } else {
            console.log('   ✅ No Traps Detected via Dual-Expert Divergence');
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

verifyDualIntel();
