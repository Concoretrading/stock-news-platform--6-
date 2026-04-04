
import { educationAdvisor, ResearchSource } from '../lib/services/education-advisor';
import { gatedApprovals } from '../lib/pipeline/gated-approvals';

async function testEducationPipeline() {
    console.log('🧪 Starting Education Pipeline Verification Test...');

    const sampleResearch: ResearchSource = {
        id: 'arxiv_2024_001',
        title: 'Detecting Retail Overfitting in Modern Sentiment Models',
        url: 'https://arxiv.org/abs/sample',
        type: 'paper',
        content: 'Our research indicates that retail sentiment models often overfit to 5-minute price action. We suggest using ensemble diversity checks between different LLM providers to identify sentiment exhaustion points.',
        publishedDate: '2024-02-15'
    };

    // 1. Advisor Analysis
    const suggestions = await educationAdvisor.analyzeResearch(sampleResearch);
    console.log(`✅ Advisor generated ${suggestions.length} suggestions.`);

    for (const sugg of suggestions) {
        // 2. Submit to Gated Approval
        await gatedApprovals.submitSuggestion(sugg);
    }

    // 3. Check State
    const active = gatedApprovals.getActiveSuggestions();
    console.log(`📊 Active Suggestions in Pipeline: ${active.length}`);
    active.forEach((s: any) => console.log(`   - [${s.status.toUpperCase()}] ${s.title}`));
}


testEducationPipeline().catch(console.error);
