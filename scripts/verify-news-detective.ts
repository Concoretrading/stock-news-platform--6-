
import { educationAdvisor } from '../lib/services/education-advisor';
import { gatedApprovals } from '../lib/pipeline/gated-approvals';
import { RawNewsSignal } from '../lib/services/news-detective';

async function testNewsDetective() {
    console.log('🧪 Starting News Detective Integration Test...');

    // Scenario: A "Bullish" upgrade hits X (Twitter), but big money is distributing (simulated).
    const signal: RawNewsSignal = {
        source: 'X',
        handle: 'Benzinga',
        headline: 'AAPL UPGRADED TO BUY BY GOLDMAN',
        content: 'Goldman Sachs upgrades Apple to buy with a price target of $250. Breaking news catalyst.',
        timestamp: new Date().toISOString(),
        ticker: 'AAPL'
    };

    console.log('📡 Simulating Breaking News from X...');

    // 1. Trigger Detective Investigation
    const suggestion = await educationAdvisor.analyzeBreakingNews(signal);

    if (suggestion && suggestion.metadata.detectiveOutput) {
        const out = suggestion.metadata.detectiveOutput;
        console.log('\n--- 🕵️ DETECTIVE OUTPUT ---');
        console.log(`SUMMARY: ${out.detective_summary}`);
        console.log(`VALIDATION: ${out.system_validation}`);
        console.log(`BIG-MONEY EVIDENCE: ${out.big_money_evidence}`);
        console.log(`SUGGESTED ACTION: ${out.suggested_action}`);
        console.log(`RISK: ${out.risk_assessment}`);
        console.log(`APPROVAL REQUIRED: ${out.approval_required}`);
        console.log('---------------------------\n');

        // 2. Submit to Gated Approvals
        await gatedApprovals.submitSuggestion(suggestion);
        console.log(`✅ Suggestion submitted to pipeline for shadow validation.`);
    } else {
        console.log('❌ Detective layer ignored signal (likely noise or no clear discrepancy).');
    }
}

testNewsDetective().catch(console.error);
