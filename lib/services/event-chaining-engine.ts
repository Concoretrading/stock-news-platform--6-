// Event Chaining Engine - Compounded Probability Calculations
// Chains multiple events together to calculate compounded probabilities

export interface MarketEvent {
    event_id: string;
    event_type: 'CPI' | 'FOMC' | 'EARNINGS' | 'NFP' | 'GDP' | 'RETAIL_SALES' | 'QUAD_WITCHING' | 'INDEX_INCLUSION' | 'TECH_KEYNOTE';
    event_date: string;
    ticker?: string; // Optional, for company-specific events
    expected_outcome: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    probability: number; // 0-100
    impact_magnitude: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    dependencies: string[]; // IDs of events this depends on
}

export interface EventChain {
    chain_id: string;
    events: MarketEvent[];
    compounded_probability: number; // 0-100
    chain_scenario: string; // e.g., "CPI bullish → FOMC dovish → Earnings beat"
    overall_outcome: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED';
    confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
    risk_factors: string[];
    trading_implications: {
        position_sizing: number; // 0-100% of normal size
        entry_timing: 'BEFORE_CHAIN' | 'AFTER_FIRST_EVENT' | 'AFTER_CONFIRMATION' | 'AVOID';
        hedge_strategy: string;
    };
}

export interface ChainAnalysis {
    all_chains: EventChain[];
    most_likely_chain: EventChain;
    best_risk_reward_chain: EventChain;
    correlation_matrix: {
        event1: string;
        event2: string;
        correlation: number; // -1 to 1
    }[];
}

export class EventChainingEngine {
    constructor() {
        console.log('🔗 INITIALIZING EVENT CHAINING ENGINE');
        console.log('📊 Calculating compounded probabilities across event sequences');
    }

    /**
     * Chain multiple events and calculate compounded probability
     */
    async chainEvents(events: MarketEvent[]): Promise<EventChain> {
        console.log(`🔗 Chaining ${events.length} events...`);

        // Sort events by date
        const sortedEvents = events.sort((a, b) =>
            new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        );

        // Calculate compounded probability
        const compoundedProb = this.calculateCompoundedProbability(sortedEvents);

        // Determine overall outcome
        const overallOutcome = this.determineOverallOutcome(sortedEvents);

        // Generate chain scenario description
        const chainScenario = this.generateChainScenario(sortedEvents);

        // Calculate confidence level
        const confidenceLevel = this.calculateConfidenceLevel(sortedEvents, compoundedProb);

        // Identify risk factors
        const riskFactors = this.identifyRiskFactors(sortedEvents);

        // Generate trading implications
        const tradingImplications = this.generateTradingImplications(
            sortedEvents,
            compoundedProb,
            overallOutcome
        );

        return {
            chain_id: this.generateChainId(sortedEvents),
            events: sortedEvents,
            compounded_probability: compoundedProb,
            chain_scenario: chainScenario,
            overall_outcome: overallOutcome,
            confidence_level: confidenceLevel,
            risk_factors: riskFactors,
            trading_implications: tradingImplications
        };
    }

    /**
     * Analyze all possible event chains
     */
    async analyzeAllChains(events: MarketEvent[]): Promise<ChainAnalysis> {
        console.log(`🔗 Analyzing all possible chains from ${events.length} events...`);

        // Generate all possible chains (combinations)
        const allChains: EventChain[] = [];

        // Single events
        for (const event of events) {
            const chain = await this.chainEvents([event]);
            allChains.push(chain);
        }

        // Pairs
        for (let i = 0; i < events.length; i++) {
            for (let j = i + 1; j < events.length; j++) {
                const chain = await this.chainEvents([events[i], events[j]]);
                allChains.push(chain);
            }
        }

        // Triples (if not too many events)
        if (events.length <= 5) {
            for (let i = 0; i < events.length; i++) {
                for (let j = i + 1; j < events.length; j++) {
                    for (let k = j + 1; k < events.length; k++) {
                        const chain = await this.chainEvents([events[i], events[j], events[k]]);
                        allChains.push(chain);
                    }
                }
            }
        }

        // Find most likely chain
        const mostLikely = allChains.reduce((max, chain) =>
            chain.compounded_probability > max.compounded_probability ? chain : max
        );

        // Find best risk/reward chain
        const bestRiskReward = this.findBestRiskRewardChain(allChains);

        // Calculate correlation matrix
        const correlationMatrix = this.calculateCorrelationMatrix(events);

        return {
            all_chains: allChains,
            most_likely_chain: mostLikely,
            best_risk_reward_chain: bestRiskReward,
            correlation_matrix: correlationMatrix
        };
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    /**
     * Calculate compounded probability
     */
    private calculateCompoundedProbability(events: MarketEvent[]): number {
        if (events.length === 0) return 0;
        if (events.length === 1) return events[0].probability;

        // Check for dependencies
        const hasDependencies = events.some(e => e.dependencies.length > 0);

        if (hasDependencies) {
            // Conditional probability (events are dependent)
            return this.calculateConditionalProbability(events);
        } else {
            // Independent events: multiply probabilities
            const product = events.reduce((prob, event) =>
                prob * (event.probability / 100), 1
            );
            return product * 100;
        }
    }

    /**
     * Calculate conditional probability for dependent events
     */
    private calculateConditionalProbability(events: MarketEvent[]): number {
        // Simplified conditional probability
        // In production, use Bayesian networks

        let prob = events[0].probability;

        for (let i = 1; i < events.length; i++) {
            const event = events[i];
            const prevEvent = events[i - 1];

            // If outcomes align, boost probability
            if (event.expected_outcome === prevEvent.expected_outcome) {
                prob = prob * (event.probability / 100) * 1.2; // 20% boost for alignment
            } else {
                prob = prob * (event.probability / 100) * 0.8; // 20% penalty for conflict
            }
        }

        return Math.min(100, prob); // Cap at 100%
    }

    /**
     * Determine overall outcome of chain
     */
    private determineOverallOutcome(events: MarketEvent[]): EventChain['overall_outcome'] {
        const bullishCount = events.filter(e => e.expected_outcome === 'BULLISH').length;
        const bearishCount = events.filter(e => e.expected_outcome === 'BEARISH').length;
        const neutralCount = events.filter(e => e.expected_outcome === 'NEUTRAL').length;

        if (bullishCount > bearishCount && bullishCount > neutralCount) return 'BULLISH';
        if (bearishCount > bullishCount && bearishCount > neutralCount) return 'BEARISH';
        if (neutralCount > bullishCount && neutralCount > bearishCount) return 'NEUTRAL';
        return 'MIXED';
    }

    /**
     * Generate chain scenario description
     */
    private generateChainScenario(events: MarketEvent[]): string {
        return events.map(e =>
            `${e.event_type} ${e.expected_outcome.toLowerCase()}`
        ).join(' → ');
    }

    /**
     * Calculate confidence level
     */
    private calculateConfidenceLevel(
        events: MarketEvent[],
        compoundedProb: number
    ): EventChain['confidence_level'] {
        // High confidence: high probability + aligned outcomes
        const outcomes = events.map(e => e.expected_outcome);
        const allSame = outcomes.every(o => o === outcomes[0]);

        if (compoundedProb >= 60 && allSame) return 'HIGH';
        if (compoundedProb >= 40) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Identify risk factors
     */
    private identifyRiskFactors(events: MarketEvent[]): string[] {
        const risks: string[] = [];

        // Check for conflicting outcomes
        const outcomes = events.map(e => e.expected_outcome);
        const hasConflict = new Set(outcomes).size > 1;
        if (hasConflict) {
            risks.push('Conflicting event outcomes - chain may break');
        }

        // Check for extreme impact events
        const hasExtreme = events.some(e => e.impact_magnitude === 'EXTREME');
        if (hasExtreme) {
            risks.push('Extreme impact event - high volatility expected');
        }

        // Check for tight timing
        const dates = events.map(e => new Date(e.event_date).getTime());
        const minGap = Math.min(...dates.slice(1).map((d, i) => d - dates[i]));
        const daysGap = minGap / (1000 * 60 * 60 * 24);
        if (daysGap < 2) {
            risks.push('Events too close together - limited reaction time');
        }

        return risks;
    }

    /**
     * Generate trading implications
     */
    private generateTradingImplications(
        events: MarketEvent[],
        compoundedProb: number,
        outcome: EventChain['overall_outcome']
    ): EventChain['trading_implications'] {
        let positionSizing = 0;
        let entryTiming: EventChain['trading_implications']['entry_timing'] = 'AVOID';
        let hedgeStrategy = 'No position recommended';

        if (compoundedProb >= 60 && outcome !== 'MIXED') {
            positionSizing = Math.min(100, compoundedProb);
            entryTiming = 'BEFORE_CHAIN';
            hedgeStrategy = `Enter ${outcome.toLowerCase()} position before first event`;
        } else if (compoundedProb >= 40) {
            positionSizing = 50;
            entryTiming = 'AFTER_FIRST_EVENT';
            hedgeStrategy = 'Wait for first event confirmation, then enter';
        } else {
            positionSizing = 0;
            entryTiming = 'AVOID';
            hedgeStrategy = 'Probability too low - avoid trading this chain';
        }

        return {
            position_sizing: positionSizing,
            entry_timing: entryTiming,
            hedge_strategy: hedgeStrategy
        };
    }

    /**
     * Find best risk/reward chain
     */
    private findBestRiskRewardChain(chains: EventChain[]): EventChain {
        // Simple heuristic: highest probability with fewest risk factors
        return chains.reduce((best, chain) => {
            const bestScore = best.compounded_probability - (best.risk_factors.length * 10);
            const chainScore = chain.compounded_probability - (chain.risk_factors.length * 10);
            return chainScore > bestScore ? chain : best;
        });
    }

    /**
     * Calculate correlation matrix
     */
    private calculateCorrelationMatrix(events: MarketEvent[]): ChainAnalysis['correlation_matrix'] {
        const matrix: ChainAnalysis['correlation_matrix'] = [];

        for (let i = 0; i < events.length; i++) {
            for (let j = i + 1; j < events.length; j++) {
                const correlation = this.calculateEventCorrelation(events[i], events[j]);
                matrix.push({
                    event1: events[i].event_id,
                    event2: events[j].event_id,
                    correlation
                });
            }
        }

        return matrix;
    }

    /**
     * Calculate correlation between two events
     */
    private calculateEventCorrelation(event1: MarketEvent, event2: MarketEvent): number {
        // Simplified correlation calculation
        // In production, use historical data

        // Same outcome = positive correlation
        if (event1.expected_outcome === event2.expected_outcome) {
            return 0.7;
        }

        // Opposite outcomes = negative correlation
        if ((event1.expected_outcome === 'BULLISH' && event2.expected_outcome === 'BEARISH') ||
            (event1.expected_outcome === 'BEARISH' && event2.expected_outcome === 'BULLISH')) {
            return -0.7;
        }

        // Neutral = low correlation
        return 0.1;
    }

    /**
     * Generate unique chain ID
     */
    private generateChainId(events: MarketEvent[]): string {
        return events.map(e => e.event_id).join('_');
    }
}

export const eventChainingEngine = new EventChainingEngine();
