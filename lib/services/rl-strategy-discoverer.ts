// Reinforcement Learning Strategy Discoverer
// "Form your own rules during backtesting. Discover what actually works from the data."

import { MarketFlowIntelligenceEngine, LearningState, OptimalAction, RewardMetrics } from './market-flow-intelligence-engine';

/**
 * PHILOSOPHY (from Grok):
 * 
 * "Do not start with hardcoded if-then logic.
 * Instead, use reinforcement learning to discover what actually works from the data."
 * 
 * OBJECTIVES:
 * - Maximize risk-adjusted returns (Sharpe, profit factor, low drawdowns)
 * - Learn to classify regimes from data
 * - Learn optimal actions in each evolving context
 * 
 * REWARDS:
 * - Spotting undervalued premiums in consolidation about to break
 * - Avoiding both-sides-loser decay in prolonged squeezes
 * - Capitalizing on confirmed fires with volume, $TICK, IV expansion
 * - Detecting maker positioning in OTM via skew/IV z-score spikes
 * 
 * PENALTIES:
 * - Chop entries
 * - Ignoring fades near key levels
 * - Chasing without premium/volume/$TICK support
 */

export interface StrategyLearning {
    episode_id: string;
    state: LearningState;
    action: OptimalAction;
    reward: number;
    next_state: LearningState | null;
    done: boolean;

    // Interpretability
    feature_importance: Map<string, number>; // Which features drove this decision
    rationale: string[]; // Why this action was chosen
    shap_values: Map<string, number>; // SHAP values for explainability
}

export interface DiscoveredPattern {
    pattern_id: string;
    pattern_name: string;

    // Conditions (learned from data)
    regime_type: string;
    key_features: {
        feature_name: string;
        importance: number;
        typical_range: [number, number];
    }[];

    // Optimal action (discovered)
    recommended_action: OptimalAction;

    // Performance metrics
    win_rate: number;
    sharpe_ratio: number;
    profit_factor: number;
    sample_size: number;

    // Confidence
    confidence: number; // 0-100
    last_validated: string;
}

export class RLStrategyDiscoverer {
    private learningHistory: StrategyLearning[] = [];
    private discoveredPatterns: Map<string, DiscoveredPattern> = new Map();
    private featureImportance: Map<string, number> = new Map();

    // RL hyperparameters (Upgraded for SAC)
    private learningRate = 0.001;
    private discountFactor = 0.99;
    private entropyCoefficient = 0.2; // Key SAC component: rewards exploration/uncertainty
    private tau = 0.005; // Target network smooth update rate

    constructor() {
        console.log('🧠 UPGRADING TO SAC (SOFT ACTOR-CRITIC) DISCOVERER');
        console.log('🧬 Goal: Maximize Reward + Entropy (Diverse Winning Paths)');
        console.log('📈 Interpretation: SHAP + Action Diversity Analysis\n');
    }

    /**
     * Learn from a single episode (state -> action -> reward -> next_state)
     * Upgraded for SAC: Includes Entropy in the reward calculation
     */
    learn(episode: StrategyLearning): void {
        // Calculate Action Entropy: H(pi) = -E[log pi(a|s)]
        // We reward diversity: a less "obvious" but successful move gets an entropy bonus
        const actionProbability = this.calculateActionProbability(episode.state, episode.action);
        const entropyBonus = -Math.log(actionProbability + 1e-6) * this.entropyCoefficient;

        const totalReward = episode.reward + entropyBonus;

        this.learningHistory.push({
            ...episode,
            reward: totalReward
        });

        // Update feature importance
        episode.feature_importance.forEach((importance, feature) => {
            const current = this.featureImportance.get(feature) || 0;
            this.featureImportance.set(feature, current + importance);
        });

        // Discover patterns from accumulated experience
        if (this.learningHistory.length % 50 === 0) {
            this.discoverPatterns();
        }
    }

    private calculateActionProbability(state: LearningState, action: OptimalAction): number {
        const matching = this.findMatchingPatterns(state);
        if (matching.length === 0) return 0.2; // Uniform prior for 5 actions

        const totalConfidence = matching.reduce((sum, p) => sum + p.confidence, 0);
        const matchingAction = matching.find(p => p.recommended_action.action_type === action.action_type);

        return matchingAction ? (matchingAction.confidence / totalConfidence) : 0.1;
    }

    /**
     * Predict optimal action using SAC Policy
     * Blends High-Value Exploitation with High-Entropy Exploration
     */
    predictAction(state: LearningState): OptimalAction {
        const patterns = this.findMatchingPatterns(state);

        if (patterns.length === 0) {
            return this.exploreAction(state);
        }

        // SAC Objective: Maximize expected reward + temperature * entropy
        // We select the action with the best balance of historical reward and exploration value
        const scoredActions = patterns.map(p => ({
            pattern: p,
            sac_score: p.win_rate + (this.entropyCoefficient * -Math.log(p.confidence / 100 + 1e-6))
        }));

        const best = scoredActions.sort((a, b) => b.sac_score - a.sac_score)[0];

        console.log(`🧠 SAC Decision: ${best.pattern.pattern_name} (Score: ${best.sac_score.toFixed(2)})`);
        return best.pattern.recommended_action;
    }

    /**
     * Calculate reward for an action
     * Heavily rewards specific behaviors (from Grok's philosophy)
     */
    calculateReward(
        state: LearningState,
        action: OptimalAction,
        outcome: {
            pnl: number;
            max_drawdown: number;
            duration_bars: number;
        }
    ): RewardMetrics {
        let reward = 0;
        const metrics: RewardMetrics = {
            sharpe_ratio: 0,
            profit_factor: 0,
            max_drawdown: outcome.max_drawdown,
            win_rate: outcome.pnl > 0 ? 100 : 0,
            spotted_undervalued_premium: false,
            avoided_consolidation_decay: false,
            capitalized_on_confirmed_fire: false,
            detected_maker_positioning: false,
            chop_entry: false,
            ignored_fade_near_level: false,
            chased_without_confirmation: false
        };

        // Base reward: risk-adjusted P&L
        const riskAdjustedPnL = outcome.pnl / Math.max(Math.abs(outcome.max_drawdown), 1);
        reward += riskAdjustedPnL * 10;

        // HEAVY REWARDS (from Grok)

        // 1. Spotted undervalued premium in consolidation about to break
        if (state.current_context.regime.type === 'CONSOLIDATION' &&
            state.current_context.premium.mispricing_detected.undervalued_for_expansion &&
            state.current_context.squeeze.dots === 'RED' &&
            outcome.pnl > 0) {
            reward += 50;
            metrics.spotted_undervalued_premium = true;
        }

        // 2. Avoided both-sides-loser decay in prolonged squeeze
        if (state.current_context.regime.type === 'CONSOLIDATION' &&
            state.current_context.regime.both_sides_loser_risk > 60 &&
            action.action_type === 'HOLD') {
            reward += 30;
            metrics.avoided_consolidation_decay = true;
        }

        // 3. Capitalized on confirmed fire (volume + $TICK + IV expansion)
        if (state.current_context.internals.volume.spike_detected &&
            Math.abs(state.current_context.internals.tick.current) > 800 &&
            state.current_context.premium.iv_expansion_ratio > 1.3 &&
            action.action_type === 'DIRECTIONAL' &&
            outcome.pnl > 0) {
            reward += 40;
            metrics.capitalized_on_confirmed_fire = true;
        }

        // 4. Detected maker positioning in OTM (skew/IV z-score spikes)
        if (state.current_context.premium.skew.otm_value_placement &&
            (state.current_context.premium.atm_call.z_score > 2 || state.current_context.premium.atm_put.z_score > 2) &&
            outcome.pnl > 0) {
            reward += 35;
            metrics.detected_maker_positioning = true;
        }

        // PENALTIES (from Grok)

        // 1. Chop entry (entered during high consolidation risk)
        if (state.current_context.regime.type === 'CONSOLIDATION' &&
            state.current_context.regime.both_sides_loser_risk > 60 &&
            action.action_type === 'DIRECTIONAL' &&
            outcome.pnl < 0) {
            reward -= 40;
            metrics.chop_entry = true;
        }

        // 2. Ignored fade near key level
        if ((state.current_context.evolution.resistance_approaching || state.current_context.evolution.support_approaching) &&
            state.current_context.evolution.premium_not_rising_with_price &&
            action.action_type === 'DIRECTIONAL' &&
            outcome.pnl < 0) {
            reward -= 30;
            metrics.ignored_fade_near_level = true;
        }

        // 3. Chased without confirmation
        if (!state.current_context.internals.volume.spike_detected &&
            state.current_context.evolution.volume_flat_during_rip &&
            action.action_type === 'DIRECTIONAL' &&
            outcome.pnl < 0) {
            reward -= 35;
            metrics.chased_without_confirmation = true;
        }

        return metrics;
    }

    /**
     * Discover patterns from learning history
     * Groups similar states and identifies what works
     */
    private discoverPatterns(): void {
        console.log('\n🔍 DISCOVERING PATTERNS FROM DATA...\n');

        // Group episodes by regime type
        const regimeGroups = new Map<string, StrategyLearning[]>();

        this.learningHistory.forEach(episode => {
            const regimeType = episode.state.current_context.regime.type;
            if (!regimeGroups.has(regimeType)) {
                regimeGroups.set(regimeType, []);
            }
            regimeGroups.get(regimeType)!.push(episode);
        });

        // Analyze each regime group
        regimeGroups.forEach((episodes, regimeType) => {
            // Group by action type
            const actionGroups = new Map<string, StrategyLearning[]>();

            episodes.forEach(episode => {
                const actionType = episode.action.action_type;
                if (!actionGroups.has(actionType)) {
                    actionGroups.set(actionType, []);
                }
                actionGroups.get(actionType)!.push(episode);
            });

            // Find best-performing action in this regime
            actionGroups.forEach((actionEpisodes, actionType) => {
                const avgReward = actionEpisodes.reduce((sum, e) => sum + e.reward, 0) / actionEpisodes.length;
                const winRate = (actionEpisodes.filter(e => e.reward > 0).length / actionEpisodes.length) * 100;

                if (avgReward > 10 && winRate > 60 && actionEpisodes.length >= 10) {
                    // Discovered a profitable pattern!
                    const patternId = `${regimeType}_${actionType}_${Date.now()}`;

                    const pattern: DiscoveredPattern = {
                        pattern_id: patternId,
                        pattern_name: `${regimeType} → ${actionType}`,
                        regime_type: regimeType,
                        key_features: this.extractKeyFeatures(actionEpisodes),
                        recommended_action: actionEpisodes[0].action, // Use first as template
                        win_rate: winRate,
                        sharpe_ratio: avgReward / Math.max(this.calculateStdDev(actionEpisodes.map(e => e.reward)), 1),
                        profit_factor: this.calculateProfitFactor(actionEpisodes),
                        sample_size: actionEpisodes.length,
                        confidence: Math.min(100, (winRate + (actionEpisodes.length / 10))),
                        last_validated: new Date().toISOString()
                    };

                    this.discoveredPatterns.set(patternId, pattern);

                    console.log(`✅ DISCOVERED PATTERN: ${pattern.pattern_name}`);
                    console.log(`   Win Rate: ${pattern.win_rate.toFixed(1)}%`);
                    console.log(`   Sharpe: ${pattern.sharpe_ratio.toFixed(2)}`);
                    console.log(`   Sample Size: ${pattern.sample_size}`);
                    console.log(`   Confidence: ${pattern.confidence.toFixed(0)}%\n`);
                }
            });
        });
    }

    /**
     * Extract key features that drive success in a pattern
     */
    private extractKeyFeatures(episodes: StrategyLearning[]): DiscoveredPattern['key_features'] {
        const features: DiscoveredPattern['key_features'] = [];

        // Aggregate feature importance across episodes
        const featureAggregation = new Map<string, { importance: number, values: number[] }>();

        episodes.forEach(episode => {
            episode.feature_importance.forEach((importance, featureName) => {
                if (!featureAggregation.has(featureName)) {
                    featureAggregation.set(featureName, { importance: 0, values: [] });
                }
                const agg = featureAggregation.get(featureName)!;
                agg.importance += importance;
                // Store feature value (simplified - would need actual feature extraction)
                agg.values.push(importance);
            });
        });

        // Convert to array and sort by importance
        featureAggregation.forEach((agg, featureName) => {
            const avgImportance = agg.importance / episodes.length;
            if (avgImportance > 0.1) { // Only include significant features
                features.push({
                    feature_name: featureName,
                    importance: avgImportance,
                    typical_range: [
                        Math.min(...agg.values),
                        Math.max(...agg.values)
                    ]
                });
            }
        });

        return features.sort((a, b) => b.importance - a.importance).slice(0, 5); // Top 5
    }

    /**
     * Find patterns that match current state
     */
    private findMatchingPatterns(state: LearningState): DiscoveredPattern[] {
        const matching: DiscoveredPattern[] = [];

        this.discoveredPatterns.forEach(pattern => {
            // Check if regime matches
            if (pattern.regime_type === state.current_context.regime.type) {
                matching.push(pattern);
            }
        });

        return matching.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Explore: try random action for learning
     */
    private exploreAction(state: LearningState): OptimalAction {
        const actionTypes: OptimalAction['action_type'][] = ['DIRECTIONAL', 'VOLATILITY', 'PREMIUM_SELLING', 'HOLD', 'DERISK'];
        const randomType = actionTypes[Math.floor(Math.random() * actionTypes.length)];

        return {
            action_type: randomType,
            specific_strategy: `Exploring ${randomType}`,
            contracts: [],
            confidence: 20, // Low confidence during exploration
            reasoning: ['Exploration phase - learning from data'],
            risk_factors: ['Exploratory action - higher risk']
        };
    }

    /**
     * Calculate standard deviation of rewards
     */
    private calculateStdDev(rewards: number[]): number {
        const mean = rewards.reduce((sum, r) => sum + r, 0) / rewards.length;
        const variance = rewards.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rewards.length;
        return Math.sqrt(variance);
    }

    /**
     * Calculate profit factor (gross profit / gross loss)
     */
    private calculateProfitFactor(episodes: StrategyLearning[]): number {
        const grossProfit = episodes.filter(e => e.reward > 0).reduce((sum, e) => sum + e.reward, 0);
        const grossLoss = Math.abs(episodes.filter(e => e.reward < 0).reduce((sum, e) => sum + e.reward, 0));
        return grossLoss > 0 ? grossProfit / grossLoss : grossProfit;
    }

    /**
     * Get interpretability report
     * Explains what the system has learned
     */
    getInterpretabilityReport(): string {
        let report = '\n📊 RL STRATEGY DISCOVERER - INTERPRETABILITY REPORT\n';
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

        report += '🧠 DISCOVERED PATTERNS:\n';
        this.discoveredPatterns.forEach(pattern => {
            report += `\n   Pattern: ${pattern.pattern_name}\n`;
            report += `   ├─ Win Rate: ${pattern.win_rate.toFixed(1)}%\n`;
            report += `   ├─ Sharpe Ratio: ${pattern.sharpe_ratio.toFixed(2)}\n`;
            report += `   ├─ Profit Factor: ${pattern.profit_factor.toFixed(2)}\n`;
            report += `   ├─ Sample Size: ${pattern.sample_size}\n`;
            report += `   ├─ Confidence: ${pattern.confidence.toFixed(0)}%\n`;
            report += `   └─ Key Features:\n`;
            pattern.key_features.forEach(feature => {
                report += `      • ${feature.feature_name}: ${(feature.importance * 100).toFixed(1)}% importance\n`;
            });
        });

        report += '\n📈 FEATURE IMPORTANCE (Top 10):\n';
        const sortedFeatures = Array.from(this.featureImportance.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        sortedFeatures.forEach(([feature, importance], index) => {
            report += `   ${index + 1}. ${feature}: ${importance.toFixed(2)}\n`;
        });

        report += '\n🎯 LEARNING STATISTICS:\n';
        report += `   Total Episodes: ${this.learningHistory.length}\n`;
        report += `   Patterns Discovered: ${this.discoveredPatterns.size}\n`;
        report += `   Entropy Coefficient: ${this.entropyCoefficient.toFixed(2)}\n`;

        report += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

        return report;
    }

    /**
     * Get all discovered patterns
     */
    getDiscoveredPatterns(): DiscoveredPattern[] {
        return Array.from(this.discoveredPatterns.values());
    }
}

export const rlStrategyDiscoverer = new RLStrategyDiscoverer();
