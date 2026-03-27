
import { behavioralFinanceReference } from '../knowledge/behavioral-finance-reference';
import { mindsetCoachReference } from '../knowledge/mindset-coach-reference';
import { worldViewReference } from '../knowledge/world-view-reference';
import { institutionalReference } from '../knowledge/institutional-intermarket-reference';
import { investorReference } from '../knowledge/investor-reference';
import { masterTraderReference } from '../knowledge/master-trader-reference';
import { newsEventReference } from '../knowledge/news-event-reference';
import { bankingReference } from '../knowledge/banking-reference';
import { priceActionReference } from '../knowledge/price-action-reference';

// Unified Knowledge Foundation
// "A flexible foundation for all processes to reference holistically."

// --- Interface Definitions ---

export interface MarketContext {
    regime: 'consolidation' | 'trending' | 'volatile' | 'neutral';
    news_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    price_action: 'breakout' | 'breakdown' | 'chop' | 'rejection' | 'flush';
    participant_state: 'greed' | 'fear' | 'doubt' | 'relief' | 'unknown';
    specific_events?: string[]; // e.g., ['fed', 'earnings', 'apple', 'witching', 'upgrade']
    baton_phase?: 'IDLE' | 'RAW_WHISPER' | 'VALIDATED_WHISPER' | 'CONFIRMED_NARRATIVE';
}

export interface KnowledgeInsight {
    layer: 'Behavioral Finance' | 'Mindset Coach' | 'World View' | 'News Interpretation' | 'Elite Mindset' | 'Institutional & Intermarket' | 'Investor Mindset' | 'Master Trader' | 'News & Event Logic' | 'Banking & Macro Liquidity' | 'Price Action Mechanics';
    concept: string; // e.g., "Prospect Theory"
    application: string; // How it applies to the current context
    actionable_advice: string; // What the algo/trader should do
    confidence: number; // 0-100 relevance score
    citation?: string;
}

// --- Service Implementation ---

export class UnifiedKnowledgeFoundation {
    constructor() {
        console.log('🧠 UNIFIED KNOWLEDGE FOUNDATION INITIALIZED (Powered by Kahneman, Thaler, Shiller, Douglas, Steenbarger, Dalio, Perkins, Mallaby, Murphy, Graham, Carter, Bernanke, Diamond, Dybvig, Core News Logic)');
    }

    /**
     * Dynamically retrieves relevant knowledge insights based on the current market context.
     * Mimics a RAG system query.
     */
    public getInsights(context: MarketContext): KnowledgeInsight[] {
        const insights: KnowledgeInsight[] = [];
        const combinedTriggers = [
            context.regime,
            context.news_sentiment,
            context.price_action,
            context.participant_state,
            ...(context.specific_events || [])
        ];

        console.log(`🔍 Querying Knowledge Foundation for context: ${combinedTriggers.join(', ')}`);

        // 1. Behavioral Finance Layer (Kahneman/Thaler/Shiller)
        const behavioralConcepts = behavioralFinanceReference.getRelevantConcepts(combinedTriggers);
        behavioralConcepts.forEach(concept => {
            insights.push({
                layer: 'Behavioral Finance',
                concept: concept.concept,
                application: concept.definition,
                actionable_advice: `Market Implication: ${concept.market_implication}`,
                confidence: 90,
                citation: `[${concept.authors.join('/')}]`
            });
        });

        // 2. Mindset Coach Layer (Douglas/Steenbarger)
        const mindsetConcepts = mindsetCoachReference.getRelevantConcepts(combinedTriggers);
        mindsetConcepts.forEach(concept => {
            insights.push({
                layer: 'Mindset Coach',
                concept: concept.concept,
                application: concept.mechanism,
                actionable_advice: concept.actionable_coaching,
                confidence: 95,
                citation: `[${concept.author}]`
            });
        });

        // 3. World View Layer (Dalio/Perkins)
        const worldViewConcepts = worldViewReference.getRelevantConcepts(combinedTriggers);
        worldViewConcepts.forEach(concept => {
            insights.push({
                layer: 'World View',
                concept: concept.concept,
                application: concept.mechanism,
                actionable_advice: `Macro Insight: ${concept.market_implication}`,
                confidence: 85,
                citation: `[${concept.author}]`
            });
        });

        // 4. Institutional & Intermarket Layer (Mallaby/Murphy)
        const institutionalConcepts = institutionalReference.getRelevantConcepts(combinedTriggers);
        institutionalConcepts.forEach(concept => {
            insights.push({
                layer: 'Institutional & Intermarket',
                concept: concept.concept,
                application: concept.mechanism,
                actionable_advice: `Smart Money Insight: ${concept.market_implication}`,
                confidence: 88,
                citation: `[${concept.author}]`
            });
        });

        // 5. Investor Mindset Layer (Graham)
        const investorConcepts = investorReference.getRelevantConcepts(combinedTriggers);
        investorConcepts.forEach(concept => {
            insights.push({
                layer: 'Investor Mindset',
                concept: concept.concept,
                application: concept.mechanism,
                actionable_advice: `Value Insight: ${concept.market_implication}`,
                confidence: 89,
                citation: `[${concept.author}]`
            });
        });

        // 6. Master Trader Layer (Carter)
        const masterTraderConcepts = masterTraderReference.getRelevantConcepts(combinedTriggers);
        masterTraderConcepts.forEach(concept => {
            insights.push({
                layer: 'Master Trader',
                concept: concept.concept,
                application: concept.mechanism,
                actionable_advice: `Setup Insight: ${concept.market_implication}`,
                confidence: 92,
                citation: `[${concept.author}]`
            });
        });

        // 7. News & Event Logic Layer (Core System)
        const newsConcepts = newsEventReference.getRelevantConcepts(combinedTriggers);
        newsConcepts.forEach(concept => {
            insights.push({
                layer: 'News & Event Logic',
                concept: concept.concept,
                application: concept.mechanism,
                actionable_advice: `Event Protocol: ${concept.market_implication}`,
                confidence: 95,
                citation: `[System Core]`
            });
        });

        // 8. Banking & Macro Liquidity Layer (Bernanke/Diamond/Dybvig)
        const bankingConcepts = bankingReference.getRelevantConcepts(combinedTriggers);
        bankingConcepts.forEach(concept => {
            insights.push({
                layer: 'Banking & Macro Liquidity',
                concept: concept.concept,
                application: concept.mechanism,
                actionable_advice: `Banking Stress Insight: ${concept.market_implication}`,
                confidence: 93,
                citation: `[${concept.author}]`
            });
        });

        // 9. Price Action Mechanics Layer (Gaps & Pivots)
        const paConcepts = priceActionReference.getRelevantConcepts(combinedTriggers);
        paConcepts.forEach(concept => {
            insights.push({
                layer: 'Price Action Mechanics',
                concept: concept.concept,
                application: concept.mechanism,
                actionable_advice: `PA Strategy: ${concept.predator_edge}`,
                confidence: 94,
                citation: `[Tactical Core]`
            });
        });

        // Sort by confidence (or simple limited return for now)
        return insights.slice(0, 10);
    }

    /**
     * Generates a "Knowledge Application Note" for the daily review.
     */
    public generateApplicationNote(insights: KnowledgeInsight[]): string {
        if (!insights || insights.length === 0) return "No specific knowledge application notes for this session.";

        // Prioritize Mindset coaching if available, then Behavioral Finance
        const topInsight = insights.find(i => i.layer === 'Mindset Coach') || insights[0];

        return `Applied ${topInsight.layer} concept "${topInsight.concept}" ${topInsight.citation || ''}: ${topInsight.actionable_advice}`;
    }
}

export const unifiedKnowledgeFoundation = new UnifiedKnowledgeFoundation();
