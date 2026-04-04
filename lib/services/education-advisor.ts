import { educationPipelineReference } from '../knowledge/education-pipeline-reference';
import { newsDetective, RawNewsSignal } from './news-detective';
import { idealSetupReference } from '../knowledge/ideal-setup-reference';
import { antiAlgoReference } from '../knowledge/anti-algo-reference';

export interface ResearchSource {
    id: string;
    title: string;
    url: string;
    type: 'paper' | 'blog' | 'news' | 'trend';
    content: string;
    publishedDate: string;
}

export interface StrategicSuggestion {
    id: string;
    sourceId: string;
    pillar: 'volume' | 'momentum' | 'sentiment' | 'weak-algo' | 'risk' | 'macro' | 'behavioral';
    title: string;
    recommendation: string;
    logic: string;
    idealSetupScore: number; // 0-100 based on User's Golden Standard
    impactLevel: 'low' | 'medium' | 'high';
    alignmentScore: number; // 0-100
    status: 'draft' | 'backtesting' | 'shadow_mode' | 'approved' | 'rejected';
    metadata: {
        isHerdLike: boolean;
        targetModule: string;
        suggestedThresholds?: Record<string, number>;
        detectiveOutput?: any;
        antiAlgoWarning?: string[];
    };
}

export class EducationAdvisor {
    private static instance: EducationAdvisor;

    private constructor() {
        console.log('🎓 EducationAdvisor service initialized');
    }

    public static getInstance(): EducationAdvisor {
        if (!EducationAdvisor.instance) {
            EducationAdvisor.instance = new EducationAdvisor();
        }
        return EducationAdvisor.instance;
    }

    /**
     * Processes a research source and generates potential suggestions.
     * In a real system, this would use LLM analysis (ai-service) to parse the paper.
     */
    public async analyzeResearch(source: ResearchSource): Promise<StrategicSuggestion[]> {
        console.log(`🔍 Analyzing research: ${source.title}`);

        // Simulate LLM analysis logic
        const suggestions: StrategicSuggestion[] = [];

        // Example: If a paper mentions "overfitting in retail sentiment"
        if (source.content.toLowerCase().includes('retail sentiment') || source.content.toLowerCase().includes('overfitting')) {
            const suggestion: StrategicSuggestion = {
                id: `sugg_${Date.now()}_1`,
                sourceId: source.id,
                pillar: 'sentiment',
                title: 'Ensemble Diversity for Sentiment Filters',
                recommendation: 'Use three distinct sentiment models (NLP, Social Engagement, and Big-Money-Flow) and only execute when all three align.',
                logic: 'Based on arXiv research on ensemble diversity helping with retail sentiment bias.',
                idealSetupScore: 0, // Calculated below
                impactLevel: 'medium',
                alignmentScore: 88,
                status: 'draft',
                metadata: {
                    isHerdLike: false,
                    targetModule: 'SentimentEngine',
                    suggestedThresholds: {
                        modelAgreement: 0.85
                    }
                }
            };

            suggestion.idealSetupScore = idealSetupReference.calculateSetupScore(suggestion.logic, source.content);
            if (this.isAlignedWithFramework(suggestion)) {
                suggestions.push(suggestion);
            }
        }

        // Example: If a paper mentions "banking liquidity"
        if (source.content.toLowerCase().includes('banking') || source.content.toLowerCase().includes('liquidity')) {
            const suggestion: StrategicSuggestion = {
                id: `sugg_${Date.now()}_2`,
                sourceId: source.id,
                pillar: 'macro',
                title: 'Macro Liquidity Stress Overlay',
                recommendation: 'Apply a BDD-based stress multiplier to stop-loss levels during high-fragility phases.',
                logic: 'Inspired by BDD banking research. Prevents getting stopped out during liquidity-driven panic spikes.',
                idealSetupScore: 0, // Calculated below
                impactLevel: 'high',
                alignmentScore: 95,
                status: 'draft',
                metadata: {
                    isHerdLike: false,
                    targetModule: 'RiskManager',
                    suggestedThresholds: {
                        liquidityBuffer: 1.25
                    }
                }
            };

            suggestion.idealSetupScore = idealSetupReference.calculateSetupScore(suggestion.logic, source.content);
            if (this.isAlignedWithFramework(suggestion)) {
                suggestions.push(suggestion);
            }
        }

        // BDD Check: Liquidity and Credit Stress
        const bddKeywords = ['bank run', 'liquidity', 'credit crunch', 'bernanke', 'diamond-dybvig', 'fire sale'];
        if (bddKeywords.some(key => source.content.toLowerCase().includes(key))) {
            const suggestion: StrategicSuggestion = {
                id: `sugg_${Date.now()}_bdd`,
                sourceId: source.id,
                pillar: 'macro',
                title: 'Macro Liquidity Stress Overlay (BDD)',
                recommendation: 'Activate Macro Overlay: Tighten risk parameters (reduce size 30%, widen stops) when liquidity mismatch signals spike.',
                logic: 'Based on Diamond-Dybvig and Bernanke Nobel insights. Fragmentation in banking liquidity creates self-fulfilling panics. Predator logic must avoid being the exit liquidity for failing herds.',
                idealSetupScore: 0, // Calculated below
                impactLevel: 'high',
                alignmentScore: 95,
                status: 'draft',
                metadata: {
                    isHerdLike: false,
                    targetModule: 'RiskManager',
                    suggestedThresholds: {
                        maxLeverage: 1.5,
                        stopMultiplier: 1.2
                    }
                }
            };

            suggestion.idealSetupScore = idealSetupReference.calculateSetupScore(suggestion.logic, source.content);

            // Check for Anti-Algo Traps
            const antiAlgo = antiAlgoReference.detectAlgoPredation(source.content);
            if (antiAlgo.detected) {
                suggestion.metadata.antiAlgoWarning = antiAlgo.patterns;
                suggestion.pillar = 'weak-algo';
                suggestion.title = `META-PREDATOR: Exploiting ${antiAlgo.patterns.join(', ')}`;
            }

            if (this.isAlignedWithFramework(suggestion)) {
                suggestions.push(suggestion);
            }
        }

        // Price Action Check: Gaps and Pivots
        const paKeywords = ['gap fill', 'pivot point', 'r1', 's1', 'opening gap', 'technical levels'];
        if (paKeywords.some(key => source.content.toLowerCase().includes(key))) {
            const suggestion: StrategicSuggestion = {
                id: `sugg_${Date.now()}_pa`,
                sourceId: source.id,
                pillar: 'momentum',
                title: 'Gap Fill & Pivot Confluence Strategy',
                recommendation: 'Target standard Gap Fills when price fails to break the 30-minute range. Use S1/R1 pivots as high-probability fade targets.',
                logic: 'Based on Predator Price Action Reference. Gaps are often emotional amateurs chasing. Pivots provide the mechanical exits to fade trapped herds.',
                idealSetupScore: 0, // Calculated below
                impactLevel: 'medium',
                alignmentScore: 92,
                status: 'draft',
                metadata: {
                    isHerdLike: false,
                    targetModule: 'PriceActionProcessor',
                    suggestedThresholds: {
                        gapFillThreshold: 0.9,
                        pivotBuffer: 0.05
                    }
                }
            };

            suggestion.idealSetupScore = idealSetupReference.calculateSetupScore(suggestion.logic, source.content);
            if (this.isAlignedWithFramework(suggestion)) {
                suggestions.push(suggestion);
            }
        }

        return suggestions;
    }

    /**
     * Ensures suggestions don't violate the "Predator" framework.
     */
    private isAlignedWithFramework(suggestion: StrategicSuggestion): boolean {
        const framework = educationPipelineReference.getPrinciples();

        // Check 1: Herd Correlation
        if (suggestion.metadata.isHerdLike) {
            console.warn(`⚠️ Suggestion rejected: Too correlated with herd behavior.`);
            return false;
        }

        // Check 2: Core Drift
        if (suggestion.metadata.targetModule === 'CoreStrategy' && suggestion.impactLevel === 'high') {
            console.warn(`⚠️ Suggestion requires extreme caution: Direct core strategy impact detected.`);
        }

        return educationPipelineReference.validateAlignment(suggestion.logic);
    }

    /**
     * Real-time News Detective Analysis
     */
    public async analyzeBreakingNews(signal: RawNewsSignal): Promise<StrategicSuggestion | null> {
        console.log(`🕵️ EducationAdvisor Triggering Detective Layer for: ${signal.ticker || 'Market'}`);

        try {
            const investigation = await newsDetective.investigate(signal);

            // Convert Detective Analysis to a Strategic Suggestion for the pipeline
            const suggestion: StrategicSuggestion = {
                id: `detective_${Date.now()}`,
                sourceId: signal.source,
                pillar: 'behavioral',
                title: `DETECTIVE: ${signal.headline}`,
                recommendation: investigation.suggested_action,
                logic: investigation.detective_summary,
                idealSetupScore: 0, // Calculated below
                impactLevel: investigation.risk_assessment.includes('High') ? 'high' : 'medium',
                alignmentScore: 95,
                status: 'draft',
                metadata: {
                    isHerdLike: false, // The detective filter ensures this is contrarian
                    targetModule: 'ContrarianExecution',
                    detectiveOutput: investigation
                }
            };

            suggestion.idealSetupScore = idealSetupReference.calculateSetupScore(suggestion.logic, signal.content);

            // Meta-Predator check for breaking news (e.g., Algo Squeezes)
            const antiAlgo = antiAlgoReference.detectAlgoPredation(signal.content || signal.headline);
            if (antiAlgo.detected) {
                suggestion.metadata.antiAlgoWarning = antiAlgo.patterns;
                suggestion.title = `META-PREDATOR: ${signal.headline}`;
                suggestion.pillar = 'weak-algo';
            }

            if (this.isAlignedWithFramework(suggestion)) {
                return suggestion;
            }
        } catch (error) {
            console.warn(`🕵️ Detective Signal Rejected: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return null;
    }
}

export const educationAdvisor = EducationAdvisor.getInstance();
