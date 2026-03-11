// Autonomous Decision Engine - The Brain That Thinks For Itself
// Synthesizes all intelligence and makes independent trading decisions

import { tradingPsychologyEngine } from './trading-psychology-engine';
import { behavioralGravityEngine } from './behavioral-gravity-engine';
import { smartMoneyManipulationEngine } from './smart-money-manipulation-engine';
import { scenarioIntelligenceEngine } from './scenario-intelligence-engine';
import { monteCarloSimulator } from './monte-carlo-simulator';
import { newsGravityAnalyzer } from './news-gravity-analyzer';
import { futureIntelligenceEngine } from './future-intelligence-engine';
import { multiContractPositionManager } from './multi-contract-position-manager';
import { timeframeCouncil } from './timeframe-council';
import { dynamicProbabilityOrchestrator } from './dynamic-probability-orchestrator';
import { nemotronService } from './nemotron-service';


// ... (RiskParameters and MarketContext interfaces remain same)

// ...


export interface RiskParameters {
    max_daily_risk_dollars: number; // Max $ to risk per day
    max_position_size_percentage: number; // Max % of account per position
    risk_per_trade_percentage: number; // % of account to risk per trade
    max_contracts_per_position: number; // Max number of contracts
    hedge_ratio: number; // Calls:Puts ratio (e.g., 3:1 = 3.0)
    account_balance: number; // Current account size
}

export interface MarketContext {
    ticker: string;
    current_price: number;
    atr: number; // Average True Range
    implied_volatility: number; // IV percentage
    key_levels: {
        support: number[];
        resistance: number[];
    };
    internals: {
        tick: number; // $TICK
        add: number; // $ADD (Advance/Decline)
        vold: number; // $VOLD (Volume Up/Down)
        vix: number; // VIX level
    };
    time_of_day: 'OPEN' | 'MID_DAY' | 'CLOSE' | 'AFTER_HOURS';
}

export interface AutonomousDecision {
    decision_id: string;
    timestamp: string;
    ticker: string;

    // Decision
    should_trade: boolean;
    trade_direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence_score: number; // 0-100

    // Position Details
    position_setup: {
        calls: {
            strike: number;
            quantity: number;
            premium: number;
            expiration: string;
            missions: string[]; // ['QUICK_PROFIT', 'SCALE_OUT', 'RUNNER']
        } | null;
        puts: {
            strike: number;
            quantity: number;
            premium: number;
            expiration: string;
            mission: 'HEDGE';
        } | null;
        total_cost: number;
        max_risk: number;
        expected_return: number;
        risk_reward_ratio: number;
    };

    // Intelligence Summary
    intelligence_consensus: {
        psychology_signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        flow_signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        technical_signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        scenario_probability: number; // 0-100
        monte_carlo_win_rate: number; // 0-100
        expert_agreement: number; // 0-100, how many experts agree
    };

    // Reasoning
    reasoning: string[];
    warnings: string[];

    // Execution Plan
    execution_plan: {
        entry_timing: 'IMMEDIATE' | 'WAIT_FOR_PULLBACK' | 'WAIT_FOR_BREAKOUT' | 'DO_NOT_TRADE';
        stop_loss: number;
        profit_targets: number[];
        scenario_rules: string[];
    };
}

export class AutonomousDecisionEngine {
    private riskParams: RiskParameters;
    private dailyRiskUsed: number = 0;
    private decisionsToday: AutonomousDecision[] = [];

    constructor(riskParams: RiskParameters) {
        this.riskParams = riskParams;

        console.log('🧠 INITIALIZING AUTONOMOUS DECISION ENGINE');
        console.log('🤖 The Brain That Thinks For Itself');
        console.log(`💰 Account Balance: $${riskParams.account_balance.toLocaleString()}`);
        console.log(`⚠️  Max Daily Risk: $${riskParams.max_daily_risk_dollars.toLocaleString()}`);
        console.log(`📊 Risk Per Trade: ${riskParams.risk_per_trade_percentage}%`);
        console.log(`🎯 Hedge Ratio: ${riskParams.hedge_ratio}:1 (Calls:Puts)`);
    }

    /**
     * Main decision-making method - analyzes all data and makes autonomous decision
     */
    async makeDecision(marketContext: MarketContext): Promise<AutonomousDecision> {
        console.log(`\n🧠 ========================================`);
        console.log(`🧠 AUTONOMOUS DECISION ANALYSIS: ${marketContext.ticker}`);
        console.log(`🧠 ========================================\n`);

        const decisionId = `${marketContext.ticker}_${Date.now()}`;

        // Step 1: Gather all intelligence
        console.log('📊 Step 1: Gathering Intelligence from All Experts...\n');
        const intelligence = await this.gatherIntelligence(marketContext);

        // Step 1.5: Convene Timeframe Council
        console.log('🏛️ Step 1.5: Convening Timeframe Council...\n');
        // Mock data for now - in production this comes from HistoricalManager
        const timeframeAnalysis = {
            weekly: {
                timeframe: 'weekly' as const,
                trend: 'uptrend' as const,
                key_levels: { nearest_resistance: 1000, nearest_support: 800, distance_to_resistance_pct: 0.1, distance_to_support_pct: 0.1 },
                structure: 'breakout' as const,
                momentum: 'accelerating' as const
            },
            daily: {
                timeframe: 'daily' as const,
                trend: intelligence.technical.signal === 'BULLISH' ? 'uptrend' as const : 'downtrend' as const,
                key_levels: { nearest_resistance: 1000, nearest_support: 800, distance_to_resistance_pct: 0.05, distance_to_support_pct: 0.05 },
                structure: 'breakout' as const,
                momentum: 'accelerating' as const
            },
            scalp: {
                timeframe: '5min' as const,
                trend: intelligence.technical.signal === 'BULLISH' ? 'uptrend' as const : 'downtrend' as const,
                key_levels: { nearest_resistance: 1000, nearest_support: 800, distance_to_resistance_pct: 0.01, distance_to_support_pct: 0.01 },
                structure: 'breakout' as const,
                momentum: 'accelerating' as const
            }
        };

        const councilDecision = timeframeCouncil.conveneCouncil(
            marketContext.ticker,
            timeframeAnalysis.weekly,
            timeframeAnalysis.daily,
            timeframeAnalysis.scalp
        );

        console.log(`   Council Grade: ${councilDecision.trade_grade}`);
        console.log(`   Runner Mode: ${councilDecision.runner_mode}`);
        console.log(`   Rationale: ${councilDecision.rationale_summary}\n`);

        // Step 2: Check if we should trade (risk management + psychology + council)
        console.log('🎯 Step 2: Evaluating Trade Viability...\n');
        const tradeViability = this.evaluateTradeViability(intelligence, marketContext, councilDecision);

        if (!tradeViability.should_trade) {
            console.log('❌ DECISION: DO NOT TRADE');
            console.log(`   Reason: ${tradeViability.reason}\n`);

            return this.createNoTradeDecision(decisionId, marketContext, intelligence, tradeViability.reason);
        }

        // Step 3: Determine trade direction and confidence
        console.log('🧭 Step 3: Determining Trade Direction...\n');
        const direction = this.determineDirection(intelligence);
        const confidence = this.calculateConfidence(intelligence, councilDecision);

        console.log(`   Direction: ${direction.trade_direction}`);
        console.log(`   Confidence: ${confidence}%\n`);

        // Step 4: Calculate optimal strikes and position sizing
        console.log('💰 Step 4: Calculating Position Sizing & Strikes...\n');
        const positionSetup = this.calculatePositionSetup(
            marketContext,
            direction.trade_direction,
            confidence,
            councilDecision
        );

        // Step 5: Run Monte Carlo simulation on proposed position
        console.log('🎲 Step 5: Running Monte Carlo Simulation...\n');
        const monteCarloResults = await this.simulatePosition(
            marketContext,
            positionSetup,
            intelligence
        );

        // Step 6: Generate execution plan
        console.log('📋 Step 6: Generating Execution Plan...\n');
        const executionPlan = this.generateExecutionPlan(
            marketContext,
            intelligence,
            positionSetup
        );

        // Step 6.5: Consult Nemotron 3 Super (The Main Brain)
        console.log('🧠 Step 6.5: Consulting NVIDIA Nemotron 3 Super (Main Brain)...\n');
        const nemotronSynthesis = await nemotronService.synthesizeIntelligence({
            ticker: marketContext.ticker,
            currentPrice: marketContext.current_price,
            expertSignals: intelligence,
            macroContext: councilDecision.rationale_summary,
            reasoningBudget: 75 // High depth for autonomous thinking
        });

        console.log(`   Nemotron Thesis: ${nemotronSynthesis.autonomous_thesis}`);
        console.log(`   Nemotron Direction: ${nemotronSynthesis.final_trade_direction}`);
        console.log(`   Nemotron Confidence: ${nemotronSynthesis.confidence}%\n`);

        // Step 7: Final decision
        const decision: AutonomousDecision = {
            decision_id: decisionId,
            timestamp: new Date().toISOString(),
            ticker: marketContext.ticker,
            should_trade: nemotronSynthesis.final_trade_direction !== 'NEUTRAL',
            trade_direction: nemotronSynthesis.final_trade_direction,
            confidence_score: (confidence + nemotronSynthesis.confidence) / 2, // Blend statistical + LLM confidence
            position_setup: positionSetup,
            intelligence_consensus: {
                psychology_signal: intelligence.psychology.signal,
                flow_signal: intelligence.flow.signal,
                technical_signal: intelligence.technical.signal,
                scenario_probability: intelligence.scenarios.best_scenario.probability,
                monte_carlo_win_rate: monteCarloResults.statistics.probability_profit,
                expert_agreement: this.calculateExpertAgreement(intelligence)
            },
            reasoning: [
                ...this.generateReasoning(intelligence, positionSetup, monteCarloResults),
                `Nemotron Thesis: ${nemotronSynthesis.autonomous_thesis}`,
                `Nemotron Logic: ${nemotronSynthesis.internal_reasoning}`
            ],
            warnings: [
                ...this.generateWarnings(intelligence, marketContext),
                ...nemotronSynthesis.potential_traps_identified.map(t => `⚠️ Nemotron Warning: ${t}`)
            ],
            execution_plan: {
                ...executionPlan,
                scenario_rules: [
                    ...executionPlan.scenario_rules,
                    `Nemotron Adjustment: ${nemotronSynthesis.adjustment_advice}`
                ]
            }
        };

        // Update daily risk tracking
        this.dailyRiskUsed += positionSetup.max_risk;
        this.decisionsToday.push(decision);

        console.log(`\n✅ DECISION: TRADE ${direction.trade_direction}`);
        console.log(`   Confidence: ${confidence}%`);
        console.log(`   Total Cost: $${positionSetup.total_cost.toFixed(2)}`);
        console.log(`   Max Risk: $${positionSetup.max_risk.toFixed(2)}`);
        console.log(`   Expected Return: $${positionSetup.expected_return.toFixed(2)}`);
        console.log(`   Risk/Reward: 1:${positionSetup.risk_reward_ratio.toFixed(2)}\n`);

        return decision;
    }

    /**
     * Gather intelligence from all expert systems
     */
    private async gatherIntelligence(context: MarketContext) {
        // Psychology
        const psychology = await tradingPsychologyEngine.analyzeTradingPsychology(context.ticker);
        const behavioral = await behavioralGravityEngine.analyzeBehavioralBiases(
            context.ticker,
            context.current_price,
            context.atr
        );

        // Flow & Manipulation
        const flow = await smartMoneyManipulationEngine.analyzeSmartMoneyManipulation(context.ticker);

        // News & Events
        const news = await newsGravityAnalyzer.analyzeGravity(context.ticker, null);
        const future = await futureIntelligenceEngine.analyzeFutureIntelligence(context.ticker, []);

        // Scenarios
        const scenarioAnalysis = await scenarioIntelligenceEngine.generateScenarioAnalysis(
            context.ticker,
            [],
            context
        );

        return {
            psychology: {
                emotion: psychology.market_emotional_state.primary_emotion,
                intensity: psychology.market_emotional_state.intensity_level,
                should_trade: psychology.trade_filter.should_trade,
                signal: psychology.market_emotional_state.primary_emotion === 'greed' || psychology.market_emotional_state.primary_emotion === 'euphoria' ? 'BULLISH' as const :
                    psychology.market_emotional_state.primary_emotion === 'fear' || psychology.market_emotional_state.primary_emotion === 'panic' ? 'BEARISH' as const :
                        'NEUTRAL' as const
            },
            behavioral: {
                biases: behavioral.biases_detected,
                contrarian_signal: behavioral.biases_detected.herd_behavior?.contrarian_signal || false
            },
            flow: {
                direction: flow.institutional_activity.dark_pool_flow.flow_direction,
                phase: flow.institutional_activity.dark_pool_flow.timing_patterns.current_phase,
                signal: flow.institutional_activity.dark_pool_flow.flow_direction === 'BUYING' ? 'BULLISH' as const :
                    flow.institutional_activity.dark_pool_flow.flow_direction === 'SELLING' ? 'BEARISH' as const :
                        'NEUTRAL' as const
            },
            news: {
                gravity_levels: news.gravity_levels,
                market_state: news.market_state
            },
            scenarios: {
                all_scenarios: scenarioAnalysis.primary_scenarios,
                best_scenario: scenarioAnalysis.scenario_tree.base_scenario || { probability: 0, scenario_name: 'NONE' }
            },
            technical: {
                signal: context.current_price > context.key_levels.support[0] ? 'BULLISH' as const : 'BEARISH' as const
            }
        };
    }

    /**
     * Evaluate if we should trade (risk management + psychology)
     */
    private evaluateTradeViability(intelligence: any, context: MarketContext, councilDecision: any): {
        should_trade: boolean;
        reason: string;
    } {
        // Check daily risk limit
        if (this.dailyRiskUsed >= this.riskParams.max_daily_risk_dollars) {
            return { should_trade: false, reason: 'Daily risk limit reached' };
        }

        // Check Council Veto
        if (councilDecision.trade_grade === 'No Trade') {
            return { should_trade: false, reason: `Timeframe Council Veto: ${councilDecision.rationale_summary}` };
        }

        // Check psychology
        if (!intelligence.psychology.should_trade) {
            return { should_trade: false, reason: 'Psychology engine says DO NOT TRADE' };
        }

        // Check if market is too choppy (VIX too high)
        if (context.internals.vix > 30) {
            return { should_trade: false, reason: 'VIX too high - market too volatile' };
        }

        // Check time of day
        if (context.time_of_day === 'AFTER_HOURS') {
            return { should_trade: false, reason: 'After hours - avoid trading' };
        }

        return { should_trade: true, reason: 'All systems go' };
    }

    /**
     * Determine trade direction based on expert consensus
     */
    private determineDirection(intelligence: any): { trade_direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' } {
        const signals = [
            intelligence.psychology.signal,
            intelligence.flow.signal,
            intelligence.technical.signal
        ];

        const bullishCount = signals.filter(s => s === 'BULLISH').length;
        const bearishCount = signals.filter(s => s === 'BEARISH').length;

        if (bullishCount >= 2) return { trade_direction: 'BULLISH' };
        if (bearishCount >= 2) return { trade_direction: 'BEARISH' };
        return { trade_direction: 'NEUTRAL' };
    }

    /**
     * Calculate confidence score (0-100) using dynamic probability weighting
     */
    private calculateConfidence(intelligence: any, councilDecision: any): number {
        console.log('⚖️ Convening Dynamic Probability Council...');

        // Map intelligence to orchestrator factors
        const factors = [
            { id: 'tick_divergence', score: Math.abs(intelligence.technical.tick_value || 0) > 800 ? 1.0 : 0.5 },
            { id: 'dark_pool_flow', score: intelligence.flow.signal === 'BULLISH' ? 0.9 : 0.4 },
            { id: 'squeeze_momentum', score: intelligence.technical.squeeze_active ? 0.95 : 0.3 },
            { id: 'news_truth_reveal', score: intelligence.news.market_state === 'REACTING' ? 0.8 : 0.5 },
            { id: 'vix_regime_alignment', score: intelligence.technical.vix_alignment ? 0.9 : 0.4 },
            { id: 'herd_contrarian', score: intelligence.behavioral.contrarian_signal ? 1.0 : 0.5 }
        ];

        // Add Timeframe Council Alignment as a high-value factor
        const councilScore = councilDecision.alignment_score / 100;

        const outcome = dynamicProbabilityOrchestrator.calculateOutcomeProbability(factors);

        // Final confidence blends the data-driven outcome with the Council's macro alignment
        const finalConfidence = (outcome.final_confidence * 0.7) + (councilScore * 30);

        console.log(`🎯 Outcome Strategy: ${outcome.primary_driver} driving the core edge.`);
        console.log(`📊 Truth/Noise Ratio: ${(outcome.truth_vs_noise_ratio * 100).toFixed(0)}%`);
        console.log(`✅ Final Confidence: ${finalConfidence.toFixed(0)}%`);

        return Math.round(finalConfidence);
    }

    /**
     * Calculate position setup (strikes, quantities, costs)
     */
    /**
     * Calculate position setup (strikes, quantities, costs)
     */
    private calculatePositionSetup(
        context: MarketContext,
        direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
        confidence: number,
        councilDecision: any
    ) {
        const riskAmount = (this.riskParams.risk_per_trade_percentage / 100) * this.riskParams.account_balance;

        // Apply Council Sizing Multiplier (e.g., 2x for A+, 0.5x for C)
        const adjustedRiskAmount = riskAmount * councilDecision.suggested_sizing_multiplier;

        // Calculate number of calls based on hedge ratio (e.g., 3:1 = 3 calls, 1 put)
        const totalContracts = Math.min(
            Math.floor(adjustedRiskAmount / (context.current_price * 0.1)), // Assume 10% of stock price for option
            this.riskParams.max_contracts_per_position
        );

        const numCalls = Math.floor(totalContracts * (this.riskParams.hedge_ratio / (this.riskParams.hedge_ratio + 1)));
        const numPuts = totalContracts - numCalls;

        // ... (Strike calculation remains same)
        const callStrike = direction === 'BULLISH' ?
            context.current_price * 1.02 : // 2% OTM for bullish
            context.current_price * 0.98;  // 2% ITM for bearish

        const putStrike = context.current_price * 0.98; // 2% OTM for hedge

        // ... (Premium calculation remains same)
        const callPremium = context.current_price * 0.05; // 5% of stock price
        const putPremium = context.current_price * 0.03; // 3% of stock price

        const callsCost = numCalls * callPremium;
        const putsCost = numPuts * putPremium;
        const totalCost = callsCost + putsCost;

        // Expected return (based on confidence and ATR)
        const expectedMove = context.atr * (confidence / 100);
        const expectedReturn = numCalls * expectedMove * 0.5; // Conservative estimate

        return {
            calls: numCalls > 0 ? {
                strike: callStrike,
                quantity: numCalls,
                premium: callPremium,
                expiration: this.calculateExpiration(),
                missions: this.assignMissions(numCalls, councilDecision.runner_mode)
            } : null,
            puts: numPuts > 0 ? {
                strike: putStrike,
                quantity: numPuts,
                premium: putPremium,
                expiration: this.calculateExpiration(),
                mission: 'HEDGE' as const
            } : null,
            total_cost: totalCost,
            max_risk: totalCost, // Max risk is total premium paid
            expected_return: expectedReturn,
            risk_reward_ratio: expectedReturn / totalCost
        };
    }

    private assignMissions(numCalls: number, runnerMode: boolean): string[] {
        if (!runnerMode) {
            // Scalp Only: All Quick Profit or Scale Out
            if (numCalls === 1) return ['QUICK_PROFIT'];
            return Array(numCalls).fill('QUICK_PROFIT');
        }

        // Runner Mode Active
        if (numCalls === 1) return ['RUNNER'];
        if (numCalls === 2) return ['QUICK_PROFIT', 'RUNNER'];
        return ['QUICK_PROFIT', 'SCALE_OUT', 'RUNNER'];
    }

    /**
     * Simulate position with Monte Carlo
     */
    private async simulatePosition(context: MarketContext, positionSetup: any, intelligence: any) {
        // Create mock scenario for Monte Carlo
        const scenario = {
            scenario_id: 'autonomous_decision',
            scenario_name: 'Autonomous Trade',
            probability: intelligence.scenarios.best_scenario.probability,
            confidence_level: 'MEDIUM' as const,
            trigger_conditions: [],
            expected_outcomes: [{
                asset: context.ticker,
                direction: 'UP' as const,
                magnitude: context.atr / context.current_price,
                timeframe: 'days' as const,
                probability: 70
            }],
            trading_implications: { current_positions: [], new_opportunities: [], hedge_adjustments: { current_hedges: 'MAINTAIN' as const, new_hedges: [], reasoning: '' } },
            last_updated: new Date().toISOString(),
            data_inputs: [],
            scenario_evolution: 'STABLE' as const
        };

        return await monteCarloSimulator.simulate(
            scenario,
            context.current_price,
            { market_emotional_state: { primary_emotion: 'greed' as const, intensity_level: 50, duration_days: 1, historical_context: 'normal' as const, regime_shift_probability: 10 }, crowd_behavior: { retail_sentiment: { bullish_percentage: 50, put_call_ratio: 0.8, social_media_sentiment: 'neutral' as const, retail_flow: 'neutral' as const, capitulation_signals: [] }, institutional_behavior: { smart_money_flow: 'neutral' as const, dark_pool_activity: 'moderate' as const, insider_activity: 'neutral' as const, hedge_fund_positioning: 'neutral' as const }, divergence_score: 50 }, market_regime: { current_regime: 'bull_trending' as const, regime_confidence: 80, regime_age_days: 10, transition_probability: { to_bull: 80, to_bear: 10, to_sideways: 10 }, supporting_factors: [], contradicting_factors: [] }, trade_filter: { should_trade: true, confidence_level: 75, recommended_action: 'NORMAL' as const, avoid_reasons: [], time_horizon_adjustment: 'normal' as const, position_sizing_modifier: 1.0, primary_concerns: [] }, trading_environment: { overall_rating: 'EXCELLENT', score: 80, factors: { volatility_environment: 'optimal', trend_clarity: 'clear', volume_quality: 'strong', correlation_breakdown: false, sector_rotation_health: 'healthy' }, reasoning: [] }, key_insights: [], actionable_intelligence: [], timestamp: new Date().toISOString() } as any,
            { timestamp: new Date().toISOString(), biases_detected: { prospect_theory: { active: false, loss_aversion_factor: 1, risk_adjustment: 'NONE' as const }, herd_behavior: { active: false, sentiment_extreme: 'NONE' as const, contrarian_signal: false }, anchoring: { active: false, anchored_level: null, bias_correction: 'NONE' as const }, disposition_effect: { active: false, pressure: 'NONE' as const, automation_override: 'NONE' as const } }, strategic_advice: [], risk_modifiers: { max_size_multiplier: 1.0, stop_loss_multiplier: 1.0 } } as any,
            { num_simulations: 1000, time_horizon_days: 7 }
        );
    }

    /**
     * Generate execution plan
     */
    private generateExecutionPlan(context: MarketContext, intelligence: any, positionSetup: any) {
        return {
            entry_timing: intelligence.flow.phase === 'ACCUMULATION' ? 'IMMEDIATE' as const : 'WAIT_FOR_PULLBACK' as const,
            stop_loss: context.current_price * 0.97, // 3% stop
            profit_targets: [
                context.current_price * 1.05, // 5% target
                context.current_price * 1.10, // 10% target
                context.current_price * 1.15  // 15% target
            ],
            scenario_rules: [
                'Close 1 call at 50% profit (quick profit)',
                'Close 1 call at 100% profit (scale out)',
                'Hold 1 call as runner until selling pressure',
                'Hold hedge until position closed or profit secured'
            ]
        };
    }

    // Helper methods
    private calculateExpertAgreement(intelligence: any): number {
        const signals = [intelligence.psychology.signal, intelligence.flow.signal, intelligence.technical.signal];
        const mode = signals.sort((a, b) => signals.filter(v => v === a).length - signals.filter(v => v === b).length).pop();
        const agreement = signals.filter(s => s === mode).length;
        return (agreement / signals.length) * 100;
    }

    private generateReasoning(intelligence: any, positionSetup: any, monteCarloResults: any): string[] {
        return [
            `Expert consensus: ${this.calculateExpertAgreement(intelligence).toFixed(0)}% agreement`,
            `Psychology: ${intelligence.psychology.emotion} (${intelligence.psychology.intensity}% intensity)`,
            `Institutional flow: ${intelligence.flow.direction} (${intelligence.flow.phase})`,
            `Monte Carlo win rate: ${monteCarloResults.statistics.probability_profit.toFixed(1)}%`,
            `Risk/Reward: 1:${positionSetup.risk_reward_ratio.toFixed(2)}`
        ];
    }

    private generateWarnings(intelligence: any, context: MarketContext): string[] {
        const warnings: string[] = [];
        if (intelligence.psychology.intensity > 80) warnings.push('⚠️  Extreme emotion - reduce size');
        if (context.internals.vix > 25) warnings.push('⚠️  Elevated VIX - expect volatility');
        if (intelligence.behavioral.contrarian_signal) warnings.push('⚠️  Contrarian signal - herd at extreme');
        return warnings;
    }

    private calculateExpiration(): string {
        const date = new Date();
        date.setDate(date.getDate() + 7); // 7 days out
        return date.toISOString().split('T')[0];
    }

    private createNoTradeDecision(decisionId: string, context: MarketContext, intelligence: any, reason: string): AutonomousDecision {
        return {
            decision_id: decisionId,
            timestamp: new Date().toISOString(),
            ticker: context.ticker,
            should_trade: false,
            trade_direction: 'NEUTRAL',
            confidence_score: 0,
            position_setup: {
                calls: null,
                puts: null,
                total_cost: 0,
                max_risk: 0,
                expected_return: 0,
                risk_reward_ratio: 0
            },
            intelligence_consensus: {
                psychology_signal: intelligence.psychology.signal,
                flow_signal: intelligence.flow.signal,
                technical_signal: intelligence.technical.signal,
                scenario_probability: 0,
                monte_carlo_win_rate: 0,
                expert_agreement: 0
            },
            reasoning: [reason],
            warnings: [],
            execution_plan: {
                entry_timing: 'DO_NOT_TRADE',
                stop_loss: 0,
                profit_targets: [],
                scenario_rules: []
            }
        };
    }




    /**
     * Reset daily risk tracking (call at start of new trading day)
     */
    resetDailyRisk(): void {
        this.dailyRiskUsed = 0;
        this.decisionsToday = [];
        console.log('✅ Daily risk tracking reset');
    }

    /**
     * Get remaining daily risk budget
     */
    getRemainingDailyRisk(): number {
        return this.riskParams.max_daily_risk_dollars - this.dailyRiskUsed;
    }
}

export const autonomousDecisionEngine = new AutonomousDecisionEngine({
    max_daily_risk_dollars: 1000,
    max_position_size_percentage: 10,
    risk_per_trade_percentage: 2,
    max_contracts_per_position: 4,
    hedge_ratio: 3.0, // 3:1 (3 calls, 1 put)
    account_balance: 50000
});
