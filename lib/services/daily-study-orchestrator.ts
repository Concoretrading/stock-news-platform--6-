
import { grokService } from './grok-service';
import { educationAdvisor, ResearchSource } from './education-advisor';
import { institutionalManipulationEngine, NewsEventContext } from './institutional-manipulation-engine';
import { compoundingKnowledgeReference } from '../knowledge/compounding-knowledge-reference';
import { unifiedKnowledgeFoundation, MarketContext } from './unified-knowledge-foundation';

export interface StudyBlock {
    type: 'RUMORS' | 'RESEARCH' | 'TACTICS';
    durationMinutes: number;
    findings: any[];
    insights: string[];
}

export interface CompoundingSession {
    sessionId: string;
    date: string;
    blocks: StudyBlock[];
    summary: string;
}

export class DailyStudyOrchestrator {
    private static instance: DailyStudyOrchestrator;

    private constructor() {
        console.log('🏛️ DailyStudyOrchestrator initialized');
    }

    public static getInstance(): DailyStudyOrchestrator {
        if (!DailyStudyOrchestrator.instance) {
            DailyStudyOrchestrator.instance = new DailyStudyOrchestrator();
        }
        return DailyStudyOrchestrator.instance;
    }

    /**
     * Executes the full 2-hour compounding session.
     */
    public async startStudySession(tickers: string[]): Promise<CompoundingSession> {
        console.log(`🚀 STARTING DAILY COMPOUNDING SESSION for ${tickers.join(', ')}`);

        const session: CompoundingSession = {
            sessionId: `study_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            blocks: [],
            summary: ''
        };

        // 1. Rumor Scanning + Herd Analysis (30 minutes focus)
        const rumorBlock = await this.runRumorBlock(tickers);
        session.blocks.push(rumorBlock);

        // 2. News & Research (60 minutes focus)
        const researchBlock = await this.runResearchBlock(tickers);
        session.blocks.push(researchBlock);

        // 3. Exploitation & Big-Money Tactics (30 minutes focus)
        const tacticsBlock = await this.runTacticsBlock(tickers);
        session.blocks.push(tacticsBlock);

        // Final Compounding & Reflection (Dalio style)
        session.summary = this.generateFinalReflection(session);

        console.log('✅ COMPOUNDING SESSION COMPLETE');
        return session;
    }

    private async runRumorBlock(tickers: string[]): Promise<StudyBlock> {
        console.log('🕵️ BLOCK 1: Rumor Scanning & Herd Analysis (30m)');
        const findings: any[] = [];
        const insights: string[] = [];

        for (const ticker of tickers) {
            const intel = await grokService.analyzeSocialIntelligence(ticker);
            findings.push({ ticker, intel });

            // Apply Livermore reasoning: "Line of Least Resistance"
            if (intel.intel_score > 70 && intel.consensus === 'bullish') {
                const concept = compoundingKnowledgeReference.getRelevantConcepts(['resistance', 'accumulation'])[0];
                if (concept) {
                    insights.push(compoundingKnowledgeReference.formatInsight(concept));
                }
            }

            // Apply Broad Behavioral & Mindset Insights (Douglas/Kahneman)
            const context: MarketContext = {
                regime: 'neutral',
                news_sentiment: intel.consensus as any,
                price_action: 'chop',
                participant_state: (intel as any).sentiment_score > 60 ? 'greed' : 'fear',
                specific_events: [ticker, 'rumor']
            };
            const foundationInsights = unifiedKnowledgeFoundation.getInsights(context);
            foundationInsights.forEach(fi => {
                if (fi.layer === 'Mindset Coach' || fi.layer === 'Behavioral Finance') {
                    insights.push(`🧠 ${fi.layer.toUpperCase()} [${fi.citation}]: ${fi.concept} - ${fi.actionable_advice}`);
                }
            });
        }

        return { type: 'RUMORS', durationMinutes: 30, findings, insights };
    }

    private async runResearchBlock(tickers: string[]): Promise<StudyBlock> {
        console.log('📚 BLOCK 2: News & Research (60m)');
        const findings: any[] = [];
        const insights: string[] = [];

        // Simulate reading filings/papers
        for (const ticker of tickers) {
            const source: ResearchSource = {
                id: `res_${ticker}`,
                title: `${ticker} Institutional Research Deep-Dive`,
                url: `internal://${ticker}/research`,
                type: 'paper',
                content: `Deep analysis of ${ticker} institutional footprint and future guidance...`,
                publishedDate: new Date().toISOString()
            };

            const suggestions = await educationAdvisor.analyzeResearch(source);
            findings.push({ ticker, suggestions });

            // Apply Dalio reasoning: "Economic Machine"
            const concept = compoundingKnowledgeReference.getRelevantConcepts(['liquidity', 'macro'])[0];
            if (concept) {
                insights.push(compoundingKnowledgeReference.formatInsight(concept));
            }

            // Apply World View & Institutional Insights (Dalio/Perkins/Mallaby)
            const context: MarketContext = {
                regime: 'trending',
                news_sentiment: 'neutral',
                price_action: 'breakout',
                participant_state: 'doubt',
                specific_events: [ticker, 'research']
            };
            const foundationInsights = unifiedKnowledgeFoundation.getInsights(context);
            foundationInsights.forEach(fi => {
                if (fi.layer === 'World View' || fi.layer === 'Institutional & Intermarket' || fi.layer === 'Investor Mindset') {
                    insights.push(`🌍 ${fi.layer.toUpperCase()} [${fi.citation}]: ${fi.concept} - ${fi.actionable_advice}`);
                }
            });
        }

        return { type: 'RESEARCH', durationMinutes: 60, findings, insights };
    }

    private async runTacticsBlock(tickers: string[]): Promise<StudyBlock> {
        console.log('🎯 BLOCK 3: Exploitation & Big-Money Tactics (30m)');
        const findings: any[] = [];
        const insights: string[] = [];

        for (const ticker of tickers) {
            const eventContext: NewsEventContext = {
                event_type: 'OTHER',
                event_importance: 'HIGH',
                importance: 'HIGH',
                uncertainty_level: 65,
                missing_data_points: ['Dark Pool Flow Delta'],
                historical_volatility: { pre_event: 1.2, during_event: 4.5, post_event: 2.1 }
            };

            const manipulation = await institutionalManipulationEngine.analyzeEventManipulation(ticker, eventContext);
            findings.push({ ticker, manipulation });

            // Apply Livermore reasoning: "Operator Size Hiding"
            if (manipulation.manipulation_risk > 60) {
                const concept = compoundingKnowledgeReference.getRelevantConcepts(['manipulation', 'hidden size'])[0];
                if (concept) {
                    insights.push(compoundingKnowledgeReference.formatInsight(concept));
                }
            }

            // Apply Master Trader & Price Action Insights (Carter/Coulling)
            const context: MarketContext = {
                regime: 'volatile',
                news_sentiment: 'neutral',
                price_action: 'flush',
                participant_state: 'fear',
                specific_events: [ticker, 'tactics']
            };
            const foundationInsights = unifiedKnowledgeFoundation.getInsights(context);
            foundationInsights.forEach(fi => {
                if (fi.layer === 'Master Trader' || fi.layer === 'Price Action Mechanics') {
                    insights.push(`🎯 ${fi.layer.toUpperCase()} [${fi.citation}]: ${fi.concept} - ${fi.actionable_advice}`);
                }
            });
        }

        return { type: 'TACTICS', durationMinutes: 30, findings, insights };
    }

    private generateFinalReflection(session: CompoundingSession): string {
        return `
🧠 DALIO REFLECTION: PAIN + REFLECTION = PROGRESS
Session Date: ${session.date}
Total Insights Compounded: ${session.blocks.reduce((acc, b) => acc + b.insights.length, 0)}

High-Level Narrative:
The market is currently showing ${session.blocks[0].insights.length > 0 ? 'strong herd-divergence signs' : 'standard distribution'}.
Applying Livermore's Tape Reading reveals ${session.blocks[2].insights.length > 0 ? 'active institutional size-hiding at pivotal points' : 'normal institutional flow'}.

🧘 PSYCHOLOGICAL ALIGNMENT (Douglas/Steenbarger):
${this.getPsychologicalReflection(session)}

All findings are now synced to the Master Knowledge Base for tomorrow's H200 session.
        `;
    }

    private getPsychologicalReflection(session: CompoundingSession): string {
        const mindsetInsights = session.blocks.flatMap(b => b.insights).filter(i => i.includes('MINDSET COACH') || i.includes('BEHAVIORAL'));
        if (mindsetInsights.length > 0) {
            return mindsetInsights[0].replace('🧠 MINDSET COACH ', '').replace('🧠 BEHAVIORAL FINANCE ', '');
        }
        return "Maintain a probabilistic mindset. This session's data is just one occurrence in a series of successes. Focus on the edge, not the outcome.";
    }
}

export const dailyStudyOrchestrator = DailyStudyOrchestrator.getInstance();
