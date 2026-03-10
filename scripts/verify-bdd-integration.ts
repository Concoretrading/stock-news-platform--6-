
import { educationAdvisor, ResearchSource } from '../lib/services/education-advisor';
import { gatedApprovals } from '../lib/pipeline/gated-approvals';
import { bankingReference } from '../lib/knowledge/banking-reference';

async function testBDDIntegration() {
    console.log('🧪 Starting BDD (Bernanke-Diamond-Dybvig) Integration Test...');

    const bankingResearch: ResearchSource = {
        id: 'banking_2022_nobel',
        title: 'Liquidity Transformation and Credit Information Cycles',
        url: 'https://nobel_prize_summary.com',
        type: 'paper',
        content: 'Historical evidence from Bernanke (1983) shows that bank runs destroy credit information, leading to protracted credit crunches. Diamond-Dybvig equilibrium models show that deposit insurance and maturity mismatch are key to banking stability.',
        publishedDate: '2022-10-10'
    };

    // 1. Advisor Analysis
    const suggestions = await educationAdvisor.analyzeResearch(bankingResearch);
    console.log(`✅ Advisor generated ${suggestions.length} suggestions.`);

    for (const sugg of suggestions) {
        console.log(`🔍 Suggestion: ${sugg.title}`);
        console.log(`   Pillar: ${sugg.pillar}`);
        console.log(`   Logic: ${sugg.logic.substring(0, 100)}...`);

        // 2. Submit to Gated Approval
        await gatedApprovals.submitSuggestion(sugg);
    }

    // 3. Banking Reference Check
    const concepts = bankingReference.getRelevantConcepts(['bank run', 'credit crunch']);
    console.log(`📊 Relevant Banking Concepts Found: ${concepts.length}`);
    concepts.forEach(c => console.log(bankingReference.formatInsight(c)));

    // 4. Final State Check
    const active = gatedApprovals.getActiveSuggestions();
    const bddSugg = active.find(s => s.pillar === 'macro');
    if (bddSugg) {
        console.log(`🎯 SUCCESS: BDD Macro Overlay is active in status: ${bddSugg.status.toUpperCase()}`);
    } else {
        console.error('❌ FAILURE: BDD Suggestion not found or rejected.');
    }
}

testBDDIntegration().catch(console.error);
