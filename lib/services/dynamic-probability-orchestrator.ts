
import { edgeDecayTracker } from './edge-decay-tracker';
import { rlStrategyDiscoverer } from './rl-strategy-discoverer';

export interface ProbabilityFactor {
    id: string;
    name: string;
    category: 'TECHNICAL' | 'FLOW' | 'SENTIMENT' | 'MACRO' | 'BEHAVIORAL';
    base_weight: number; // Initial importance (0-1.0)
    current_value_score: number; // Score based on current market (0-1.0)
    historical_outcome_value: number; // Proven value from backtesting (0-1.0)
    is_decaying: boolean;
}

export interface OutcomeProbability {
    final_confidence: number; // 0-100
    weighted_factors: {
        factor_name: string;
        contribution_percentage: number;
        outcome_value: number;
    }[];
    primary_driver: string;
    truth_vs_noise_ratio: number; // 0-1.0
}

export class DynamicProbabilityOrchestrator {
    private factorRegistry: Map<string, ProbabilityFactor> = new Map();

    constructor() {
        this.initializeFactorRegistry();
        console.log('⚖️ DYNAMIC PROBABILITY ORCHESTRATOR INITIALIZED');
    }

    private initializeFactorRegistry() {
        // Core factors based on your strategy's proven value
        const initialFactors: ProbabilityFactor[] = [
            { id: 'tick_divergence', name: '$TICK Divergence', category: 'TECHNICAL', base_weight: 0.9, current_value_score: 0, historical_outcome_value: 0.95, is_decaying: false },
            { id: 'dark_pool_flow', name: 'Dark Pool Flow', category: 'FLOW', base_weight: 0.85, current_value_score: 0, historical_outcome_value: 0.9, is_decaying: false },
            { id: 'squeeze_momentum', name: 'TTM Squeeze Momentum', category: 'TECHNICAL', base_weight: 0.8, current_value_score: 0, historical_outcome_value: 0.85, is_decaying: false },
            { id: 'news_truth_reveal', name: 'News vs Reaction Divergence', category: 'SENTIMENT', base_weight: 0.75, current_value_score: 0, historical_outcome_value: 0.8, is_decaying: false },
            { id: 'vix_regime_alignment', name: 'VIX Regime Alignment', category: 'MACRO', base_weight: 0.7, current_value_score: 0, historical_outcome_value: 0.75, is_decaying: false },
            { id: 'herd_contrarian', name: 'Contrarian Crowd Trap', category: 'BEHAVIORAL', base_weight: 0.65, current_value_score: 0, historical_outcome_value: 0.7, is_decaying: false },
            { id: 'premium_expansion_momentum', name: 'Premium Expansion Momentum', category: 'FLOW', base_weight: 0.88, current_value_score: 0, historical_outcome_value: 0.92, is_decaying: false },
            { id: 'premium_asymmetry', name: 'Premium Asymmetry (Calls/Puts)', category: 'FLOW', base_weight: 0.82, current_value_score: 0, historical_outcome_value: 0.88, is_decaying: false }
        ];

        initialFactors.forEach(f => this.factorRegistry.set(f.id, f));
    }

    /**
     * The Brain: Calculates outcome probability by weighting what ACTUALLY works.
     */
    public calculateOutcomeProbability(contextFactors: { id: string; score: number }[]): OutcomeProbability {
        console.log('🧬 Calculating Dynamic Outcome Probability...');

        let totalWeightedScore = 0;
        let totalWeight = 0;
        const weightedFactors: OutcomeProbability['weighted_factors'] = [];

        contextFactors.forEach(input => {
            const factor = this.factorRegistry.get(input.id);
            if (!factor) return;

            // 1. Get Dynamic Weight (Base * Outcome Value)
            let dynamicWeight = factor.base_weight * factor.historical_outcome_value;

            // 2. Adjust for Edge Decay
            const decayAnalysis = edgeDecayTracker.checkEdge(factor.id);
            if (decayAnalysis && (decayAnalysis.decay_status === 'DECAYING' || decayAnalysis.decay_status === 'FAILED')) {
                console.log(`⚠️ Scaling down decaying factor: ${factor.name}`);
                dynamicWeight *= 0.5; // Discount by 50%
                factor.is_decaying = true;
            }

            // 3. Accumulate
            const contribution = input.score * dynamicWeight;
            totalWeightedScore += contribution;
            totalWeight += dynamicWeight;

            weightedFactors.push({
                factor_name: factor.name,
                contribution_percentage: 0, // Calculated below
                outcome_value: factor.historical_outcome_value
            });
        });

        // Normalize contributions to percentages
        weightedFactors.forEach(wf => {
            const factor = Array.from(this.factorRegistry.values()).find(f => f.name === wf.factor_name);
            if (factor) {
                const weight = factor.base_weight * factor.historical_outcome_value * (factor.is_decaying ? 0.5 : 1);
                wf.contribution_percentage = (weight / totalWeight) * 100;
            }
        });

        const finalConfidence = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

        // Determine Truth vs Noise (How much of our high-value info is hitting?)
        const highValueFactors = weightedFactors.filter(wf => wf.outcome_value > 0.85);
        const truthRatio = highValueFactors.length / weightedFactors.length;

        const primaryDriver = weightedFactors.sort((a, b) => b.contribution_percentage - a.contribution_percentage)[0]?.factor_name || 'None';

        return {
            final_confidence: Math.round(finalConfidence),
            weighted_factors: weightedFactors,
            primary_driver: primaryDriver,
            truth_vs_noise_ratio: truthRatio
        };
    }

    /**
     * Updates the historical value of a factor based on RL discovery
     */
    public updateFactorValue(factorId: string, newValue: number) {
        const factor = this.factorRegistry.get(factorId);
        if (factor) {
            console.log(`📝 Updating Information Value for ${factor.name}: ${newValue}`);
            factor.historical_outcome_value = newValue;
        }
    }
}

export const dynamicProbabilityOrchestrator = new DynamicProbabilityOrchestrator();
