
import { educationAdvisor, ResearchSource } from '../lib/services/education-advisor';
import { gatedApprovals } from '../lib/pipeline/gated-approvals';
import { priceActionReference } from '../lib/knowledge/price-action-reference';
import { unifiedKnowledgeFoundation } from '../lib/services/unified-knowledge-foundation';

async function testPriceActionIntegration() {
    console.log('🧪 Starting Price Action (Gaps & Pivots) Integration Test...');

    const technicalResearch: ResearchSource = {
        id: 'tech_2024_005',
        title: 'Exploiting Opening Gap Fills with Pivot Confluence',
        url: 'https://technical-edge.com/gaps-pivots',
        type: 'trend',
        content: 'Analysis of 5,000 sessions shows that when an opening gap fill fails to materialize within 30 minutes, price often rotates to the daily R1 or S1 pivot point. Pivot point clusters provide high-probability reversal zones.',
        publishedDate: '2024-02-20'
    };

    // 1. Advisor Analysis
    const suggestions = await educationAdvisor.analyzeResearch(technicalResearch);
    console.log(`✅ Advisor generated ${suggestions.length} suggestions.`);

    for (const sugg of suggestions) {
        console.log(`🔍 Suggestion: ${sugg.title}`);
        console.log(`   Pillar: ${sugg.pillar}`);
        console.log(`   Impact: ${sugg.impactLevel.toUpperCase()}`);

        // 2. Submit to Gated Approval
        await gatedApprovals.submitSuggestion(sugg);
    }

    // 3. Unified Knowledge Check
    const context: any = {
        regime: 'volatile',
        news_sentiment: 'neutral',
        price_action: 'gap',
        participant_state: 'doubt',
        specific_events: ['opening gap', 'pivot']
    };

    const insights = unifiedKnowledgeFoundation.getInsights(context);
    console.log(`🧠 Unified Knowledge Foundation returned ${insights.length} insights.`);

    const paInsight = insights.find(i => i.layer === 'Price Action Mechanics');
    if (paInsight) {
        console.log(`🎯 SUCCESS: Price Action insight found!`);
        console.log(`   Concept: ${paInsight.concept}`);
        console.log(`   Advice: ${paInsight.actionable_advice}`);
    } else {
        console.error('❌ FAILURE: Price Action insight not found in foundation.');
    }

    // 4. Final State Check
    const active = gatedApprovals.getActiveSuggestions();
    const gapSugg = active.find(s => s.title.includes('Gap Fill'));
    if (gapSugg) {
        console.log(`🎯 SUCCESS: Gap Fill Strategy is active in status: ${gapSugg.status.toUpperCase()}`);
    } else {
        console.error('❌ FAILURE: Gap Fill Suggestion not found or rejected.');
    }
}

testPriceActionIntegration().catch(console.error);
