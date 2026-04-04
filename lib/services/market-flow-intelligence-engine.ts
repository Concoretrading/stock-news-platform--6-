// Market Flow Intelligence Engine - Elite Trader Philosophy
// "Flow with the market like the best human traders do, but without their emotional flaws"

import { MarketContext, unifiedKnowledgeFoundation } from './unified-knowledge-foundation';
import { premiumMasteryEngine } from './premium-mastery-engine';

/**
 * CORE PHILOSOPHY (from Grok):
 * 
 * 1. MASTER THE MIND FIRST
 *    - Understand emotions: fear, greed, overconfidence, loss aversion
 *    - Anticipate and exploit behavioral patterns
 *    - Never fall victim to emotional traps
 * 
 * 2. UNDERSTAND HOW MONEY MOVES
 *    - Institutional flows, dark pools, order book dynamics
 *    - Smart money positioning, rotations, liquidity
 * 
 * 3. CONTINUOUS EVOLUTION
 *    - Nothing is static - internals change every second
 *    - Watch everything evolve continuously and relatively
 *    - Adapt, retrain, never become static
 * 
 * 4. REGIME AWARENESS
 *    - Consolidation = both sides lose (theta decay, IV contraction)
 *    - Trending/Volatile = both sides can win
 *    - Must deeply understand momentum, news flow, premium behavior
 * 
 * 5. PREMIUM MASTERY
 *    - Know normal prices during consolidation
 *    - Identify mispricing (undervalued for expansion, overvalued for crush)
 *    - Recognize patterns during breakouts/breakdowns
 *    - Detect divergences (premium not rising with price = fading conviction)
 */

export interface MarketInternals {
    tick: {
        current: number;
        trajectory: 'RISING' | 'FALLING' | 'STABLE';
        velocity: number; // Rate of change
        extreme_reading: boolean; // > 1000 or < -1000
        distance_from_zero: number;
        recent_history: number[]; // Last 60 seconds
    };
    volume: {
        current: number;
        relative_volume: number; // vs 20-day average
        spike_detected: boolean;
        trend: 'INCREASING' | 'DECREASING' | 'FLAT';
        confirmation_strength: number; // 0-100
    };
    vix: {
        current: number;
        percentile_rank: number; // 0-100 (vs 252-day history)
        regime: 'LOW' | 'NORMAL' | 'ELEVATED' | 'EXTREME';
        trend: 'RISING' | 'FALLING' | 'STABLE';
    };
    level2: {
        bid_depth: number;
        ask_depth: number;
        imbalance: number; // -100 to +100 (negative = more sellers)
        iceberg_orders_detected: boolean;
        absorption_detected: boolean; // Large orders being absorbed
        liquidity_quality: 'THIN' | 'NORMAL' | 'DEEP';
    };
}

export interface SqueezeMetrics {
    dots: 'BLACK' | 'ORANGE' | 'RED'; // Compression strength
    momentum_histogram: {
        color: 'LIGHT_BLUE' | 'DARK_BLUE' | 'YELLOW' | 'RED';
        value: number;
        direction: 'BULLISH' | 'BEARISH';
        change: 'STRENGTHENING' | 'WEAKENING' | 'STABLE';
    };
    squeeze_duration: number; // Bars in squeeze
    compression_level: number; // 0-100
}

export interface PremiumMetrics {
    atm_call: {
        price: number;
        iv: number;
        delta: number;
        theta: number;
        vega: number;
        price_change_1m: number; // 1-minute change
        iv_change_1m: number;
        z_score: number; // vs consolidation norm
    };
    atm_put: {
        price: number;
        iv: number;
        delta: number;
        theta: number;
        vega: number;
        price_change_1m: number;
        iv_change_1m: number;
        z_score: number;
    };
    skew: {
        call_skew: number; // OTM calls vs ATM
        put_skew: number; // OTM puts vs ATM
        skew_shift: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        otm_value_placement: boolean; // MMs placing value on tails
    };
    iv_expansion_ratio: number; // Current IV / Historical consolidation IV
    mispricing_detected: {
        undervalued_for_expansion: boolean;
        overvalued_for_crush: boolean;
        divergence_from_price: boolean; // Premium not following price
    };
    // NEW: Python logic port insights
    mastery: {
        bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        pattern: 'EXPANSION_TAKEOFF' | 'DECAY_BREAKDOWN' | 'NEUTRAL_EXPANSION' | 'NEUTRAL_DECAY';
        confluence_score: number;
        confidence_score: number;
        strike_pinned: boolean;
    };
}

export interface MarketRegime {
    type: 'CONSOLIDATION' | 'TRENDING_BULLISH' | 'TRENDING_BEARISH' | 'VOLATILE';
    confidence: number; // 0-100
    duration_bars: number;
    characteristics: string[];
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    both_sides_loser_risk: number; // 0-100 (high in consolidation)
}

export interface EvolvingContext {
    timestamp: string;
    internals: MarketInternals;
    squeeze: SqueezeMetrics;
    premium: PremiumMetrics;
    regime: MarketRegime;

    // Evolution tracking
    evolution: {
        tick_heading_toward_zero: boolean;
        volume_flat_during_rip: boolean;
        premium_not_rising_with_price: boolean;
        otm_sudden_value: boolean;
        resistance_approaching: boolean;
        support_approaching: boolean;
    };

    // Relative context (not static thresholds!)
    relative_strength: {
        tick_vs_recent_average: number; // -100 to +100
        volume_vs_recent_average: number;
        premium_vs_consolidation_norm: number;
        iv_vs_historical_breakout: number;
    };
}

export interface OptimalAction {
    action_type: 'DIRECTIONAL' | 'VOLATILITY' | 'PREMIUM_SELLING' | 'HOLD' | 'DERISK';
    specific_strategy: string;
    contracts: {
        type: 'ATM_CALL' | 'ATM_PUT' | 'ITM_CALL' | 'ITM_PUT' | 'OTM_CALL' | 'OTM_PUT' | 'STRADDLE' | 'STRANGLE' | 'IRON_CONDOR' | 'CREDIT_SPREAD';
        strikes: number[];
        quantity: number;
    }[];
    confidence: number; // 0-100
    reasoning: string[];
    risk_factors: string[];
}

export interface LearningState {
    // Rich state for RL to "see" evolution
    current_context: EvolvingContext;
    history_1m: EvolvingContext[]; // Last 60 seconds
    history_5m: EvolvingContext[]; // Last 5 minutes

    // Deltas and ratios
    tick_delta_1m: number;
    volume_delta_1m: number;
    premium_delta_1m: number;
    iv_ratio: number; // Current / Historical norm

    // Distances to key levels
    distance_to_resistance: number;
    distance_to_support: number;

    // Regime-tagged historical averages
    consolidation_norms: {
        avg_iv: number;
        avg_atm_premium: number;
        avg_skew: number;
    };
    breakout_norms: {
        avg_iv_expansion: number;
        avg_premium_surge: number;
        avg_volume_spike: number;
    };
}

export interface RewardMetrics {
    sharpe_ratio: number;
    profit_factor: number;
    max_drawdown: number;
    win_rate: number;

    // Specific rewards
    spotted_undervalued_premium: boolean;
    avoided_consolidation_decay: boolean;
    capitalized_on_confirmed_fire: boolean;
    detected_maker_positioning: boolean;

    // Penalties
    chop_entry: boolean;
    ignored_fade_near_level: boolean;
    chased_without_confirmation: boolean;
}

export class MarketFlowIntelligenceEngine {
    private currentContext: EvolvingContext | null = null;
    private contextHistory: EvolvingContext[] = [];
    private consolidationNorms: Map<string, any> = new Map();
    private breakoutNorms: Map<string, any> = new Map();

    constructor() {
        console.log('🌊 INITIALIZING MARKET FLOW INTELLIGENCE ENGINE');
        console.log('🧠 Elite Trader Philosophy: Master Mind, Flow, Evolution');
        console.log('📊 Continuous Monitoring: Internals, Premium, Regime');
        console.log('🎯 No Static Thresholds: Everything Evolves Relatively');
        console.log('💡 Reinforcement Learning: Discover What Works From Data\n');
    }

    /**
     * CORE METHOD: Update context every second
     * Nothing is static - everything evolves continuously
     */
    updateContext(
        internals: MarketInternals,
        squeeze: SqueezeMetrics,
        premium: PremiumMetrics,
        currentPrice: number,
        bars: any[], // Added bars for Premium Mastery
        keyLevels: { resistance: number[], support: number[] }
    ): EvolvingContext {
        // Enforce Premium Mastery Logic (Python Port)
        const premiumPattern = premiumMasteryEngine.analyzePremium(bars);
        premium.mastery = {
            bias: premiumPattern.bias,
            pattern: premiumPattern.pattern,
            confluence_score: premiumPattern.confluence,
            confidence_score: premiumPattern.confidence,
            strike_pinned: premiumPattern.strike_pinned
        };

        const regime = this.classifyRegime(internals, squeeze, premium);

        const context: EvolvingContext = {
            timestamp: new Date().toISOString(),
            internals,
            squeeze,
            premium,
            regime,
            evolution: this.detectEvolution(internals, premium, currentPrice, keyLevels),
            relative_strength: this.calculateRelativeStrength(internals, premium)
        };

        // Store in history
        this.contextHistory.push(context);
        if (this.contextHistory.length > 300) { // Keep 5 minutes at 1-second intervals
            this.contextHistory.shift();
        }

        this.currentContext = context;
        return context;
    }

    /**
     * Classify market regime (CRITICAL for strategy selection)
     * Consolidation = both sides lose
     * Trending/Volatile = both sides can win
     */
    private classifyRegime(
        internals: MarketInternals,
        squeeze: SqueezeMetrics,
        premium: PremiumMetrics
    ): MarketRegime {
        let type: MarketRegime['type'] = 'CONSOLIDATION';
        let confidence = 0;
        const characteristics: string[] = [];
        let bothSidesLoserRisk = 0;

        // Consolidation indicators
        if (squeeze.dots === 'RED' && squeeze.squeeze_duration > 10) {
            type = 'CONSOLIDATION';
            confidence += 30;
            characteristics.push('High compression (RED dots)');
            characteristics.push(`Squeeze duration: ${squeeze.squeeze_duration} bars`);
            bothSidesLoserRisk += 40;
        }

        if (internals.volume.relative_volume < 0.8) {
            confidence += 20;
            characteristics.push('Low relative volume');
            bothSidesLoserRisk += 20;
        }

        if (premium.iv_expansion_ratio < 1.1) {
            confidence += 20;
            characteristics.push('IV compression');
            bothSidesLoserRisk += 20;
        }

        // Trending indicators
        if (squeeze.momentum_histogram.color === 'DARK_BLUE' || squeeze.momentum_histogram.color === 'RED') {
            if (squeeze.momentum_histogram.change === 'STRENGTHENING') {
                type = squeeze.momentum_histogram.direction === 'BULLISH' ? 'TRENDING_BULLISH' : 'TRENDING_BEARISH';
                confidence = 70;
                characteristics.length = 0; // Clear consolidation characteristics
                characteristics.push(`Strong ${squeeze.momentum_histogram.direction.toLowerCase()} momentum`);
                characteristics.push('Momentum strengthening');
                bothSidesLoserRisk = 10;
            }
        }

        if (internals.volume.spike_detected && internals.volume.relative_volume > 1.5) {
            if (type !== 'CONSOLIDATION') {
                confidence += 20;
                characteristics.push('Volume spike confirmation');
                bothSidesLoserRisk = Math.max(0, bothSidesLoserRisk - 20);
            }
        }

        // Volatile indicators
        if (internals.vix.regime === 'ELEVATED' || internals.vix.regime === 'EXTREME') {
            if (premium.iv_expansion_ratio > 1.3) {
                type = 'VOLATILE';
                confidence = 80;
                characteristics.length = 0;
                characteristics.push('High VIX environment');
                characteristics.push('IV expansion detected');
                bothSidesLoserRisk = 15;
            }
        }

        const riskLevel: MarketRegime['risk_level'] =
            bothSidesLoserRisk > 60 ? 'EXTREME' :
                bothSidesLoserRisk > 40 ? 'HIGH' :
                    bothSidesLoserRisk > 20 ? 'MEDIUM' : 'LOW';

        return {
            type,
            confidence: Math.min(100, confidence),
            duration_bars: squeeze.squeeze_duration,
            characteristics,
            risk_level: riskLevel,
            both_sides_loser_risk: bothSidesLoserRisk
        };
    }

    /**
     * Detect evolution patterns (NOT static thresholds!)
     * Watch how things are changing relative to recent context
     */
    private detectEvolution(
        internals: MarketInternals,
        premium: PremiumMetrics,
        currentPrice: number,
        keyLevels: { resistance: number[], support: number[] }
    ): EvolvingContext['evolution'] {
        const recentHistory = this.contextHistory.slice(-60); // Last 60 seconds

        // $TICK heading toward zero while approaching resistance
        const tickHeadingTowardZero =
            internals.tick.current > 0 &&
            internals.tick.trajectory === 'FALLING' &&
            keyLevels.resistance.some(r => Math.abs(currentPrice - r) / currentPrice < 0.01);

        // Volume flat or decreasing during a rip
        const volumeFlatDuringRip =
            currentPrice > (recentHistory[0]?.internals?.tick?.current || 0) * 1.005 && // 0.5% rip
            internals.volume.trend === 'FLAT';

        // Premium not rising with price (divergence)
        const premiumNotRisingWithPrice =
            currentPrice > (recentHistory[0]?.internals?.tick?.current || 0) * 1.003 && // 0.3% move up
            premium.atm_call.price_change_1m < 0;

        // OTM suddenly getting value (skew shift, IV jump)
        const otmSuddenValue =
            premium.skew.otm_value_placement &&
            (premium.atm_call.iv_change_1m > 5 || premium.atm_put.iv_change_1m > 5);

        // Approaching key levels
        const resistanceApproaching = keyLevels.resistance.some(r =>
            Math.abs(currentPrice - r) / currentPrice < 0.005 // Within 0.5%
        );

        const supportApproaching = keyLevels.support.some(s =>
            Math.abs(currentPrice - s) / currentPrice < 0.005
        );

        return {
            tick_heading_toward_zero: tickHeadingTowardZero,
            volume_flat_during_rip: volumeFlatDuringRip,
            premium_not_rising_with_price: premiumNotRisingWithPrice,
            otm_sudden_value: otmSuddenValue,
            resistance_approaching: resistanceApproaching,
            support_approaching: supportApproaching
        };
    }

    /**
     * Calculate relative strength (vs recent averages, NOT static thresholds)
     */
    private calculateRelativeStrength(
        internals: MarketInternals,
        premium: PremiumMetrics
    ): EvolvingContext['relative_strength'] {
        const recentHistory = this.contextHistory.slice(-60);

        if (recentHistory.length === 0) {
            return {
                tick_vs_recent_average: 0,
                volume_vs_recent_average: 0,
                premium_vs_consolidation_norm: 0,
                iv_vs_historical_breakout: 0
            };
        }

        const avgTick = recentHistory.reduce((sum, c) => sum + c.internals.tick.current, 0) / recentHistory.length;
        const avgVolume = recentHistory.reduce((sum, c) => sum + c.internals.volume.current, 0) / recentHistory.length;

        const tickVsAvg = ((internals.tick.current - avgTick) / Math.max(Math.abs(avgTick), 1)) * 100;
        const volumeVsAvg = ((internals.volume.current - avgVolume) / Math.max(avgVolume, 1)) * 100;

        // Premium vs consolidation norm (from learned data)
        const consolidationNorm = this.consolidationNorms.get('avg_atm_premium') || premium.atm_call.price;
        const premiumVsNorm = ((premium.atm_call.price - consolidationNorm) / Math.max(consolidationNorm, 1)) * 100;

        // IV vs historical breakout (from learned data)
        const breakoutIV = this.breakoutNorms.get('avg_iv_expansion') || 1.5;
        const ivVsBreakout = (premium.iv_expansion_ratio / breakoutIV) * 100;

        return {
            tick_vs_recent_average: Math.max(-100, Math.min(100, tickVsAvg)),
            volume_vs_recent_average: Math.max(-100, Math.min(100, volumeVsAvg)),
            premium_vs_consolidation_norm: Math.max(-100, Math.min(100, premiumVsNorm)),
            iv_vs_historical_breakout: Math.max(0, Math.min(200, ivVsBreakout))
        };
    }

    /**
     * Get current learning state (for RL agent)
     * Rich state with history, deltas, ratios, distances
     */
    getLearningState(
        currentPrice: number,
        keyLevels: { resistance: number[], support: number[] }
    ): LearningState | null {
        if (!this.currentContext) return null;

        const history1m = this.contextHistory.slice(-60);
        const history5m = this.contextHistory.slice(-300);

        const tickDelta1m = history1m.length > 0 ?
            this.currentContext.internals.tick.current - history1m[0].internals.tick.current : 0;

        const volumeDelta1m = history1m.length > 0 ?
            this.currentContext.internals.volume.current - history1m[0].internals.volume.current : 0;

        const premiumDelta1m = this.currentContext.premium.atm_call.price_change_1m;

        const nearestResistance = keyLevels.resistance.reduce((nearest, r) =>
            Math.abs(r - currentPrice) < Math.abs(nearest - currentPrice) ? r : nearest
            , keyLevels.resistance[0] || currentPrice * 1.05);

        const nearestSupport = keyLevels.support.reduce((nearest, s) =>
            Math.abs(s - currentPrice) < Math.abs(nearest - currentPrice) ? s : nearest
            , keyLevels.support[0] || currentPrice * 0.95);

        return {
            current_context: this.currentContext,
            history_1m: history1m,
            history_5m: history5m,
            tick_delta_1m: tickDelta1m,
            volume_delta_1m: volumeDelta1m,
            premium_delta_1m: premiumDelta1m,
            iv_ratio: this.currentContext.premium.iv_expansion_ratio,
            distance_to_resistance: (nearestResistance - currentPrice) / currentPrice,
            distance_to_support: (currentPrice - nearestSupport) / currentPrice,
            consolidation_norms: {
                avg_iv: this.consolidationNorms.get('avg_iv') || 20,
                avg_atm_premium: this.consolidationNorms.get('avg_atm_premium') || 100,
                avg_skew: this.consolidationNorms.get('avg_skew') || 0
            },
            breakout_norms: {
                avg_iv_expansion: this.breakoutNorms.get('avg_iv_expansion') || 1.5,
                avg_premium_surge: this.breakoutNorms.get('avg_premium_surge') || 1.3,
                avg_volume_spike: this.breakoutNorms.get('avg_volume_spike') || 2.0
            }
        };
    }

    /**
     * Learn consolidation norms from historical data
     * Called during backtesting to establish baselines
     */
    learnConsolidationNorms(historicalData: EvolvingContext[]): void {
        const consolidationPeriods = historicalData.filter(c => c.regime.type === 'CONSOLIDATION');

        if (consolidationPeriods.length === 0) return;

        const avgIV = consolidationPeriods.reduce((sum, c) => sum + c.premium.atm_call.iv, 0) / consolidationPeriods.length;
        const avgPremium = consolidationPeriods.reduce((sum, c) => sum + c.premium.atm_call.price, 0) / consolidationPeriods.length;
        const avgSkew = consolidationPeriods.reduce((sum, c) => sum + c.premium.skew.call_skew, 0) / consolidationPeriods.length;

        this.consolidationNorms.set('avg_iv', avgIV);
        this.consolidationNorms.set('avg_atm_premium', avgPremium);
        this.consolidationNorms.set('avg_skew', avgSkew);

        console.log('📊 Learned Consolidation Norms:');
        console.log(`   Avg IV: ${avgIV.toFixed(2)}`);
        console.log(`   Avg ATM Premium: $${avgPremium.toFixed(2)}`);
        console.log(`   Avg Skew: ${avgSkew.toFixed(2)}`);
    }

    /**
     * Learn breakout norms from historical data
     * Called during backtesting to establish baselines
     */
    learnBreakoutNorms(historicalData: EvolvingContext[]): void {
        const breakoutPeriods = historicalData.filter(c =>
            c.regime.type === 'TRENDING_BULLISH' || c.regime.type === 'TRENDING_BEARISH'
        );

        if (breakoutPeriods.length === 0) return;

        const avgIVExpansion = breakoutPeriods.reduce((sum, c) => sum + c.premium.iv_expansion_ratio, 0) / breakoutPeriods.length;
        const avgPremiumSurge = breakoutPeriods.reduce((sum, c) => sum + (c.premium.atm_call.price_change_1m / c.premium.atm_call.price), 0) / breakoutPeriods.length;
        const avgVolumeSpike = breakoutPeriods.reduce((sum, c) => sum + c.internals.volume.relative_volume, 0) / breakoutPeriods.length;

        this.breakoutNorms.set('avg_iv_expansion', avgIVExpansion);
        this.breakoutNorms.set('avg_premium_surge', avgPremiumSurge);
        this.breakoutNorms.set('avg_volume_spike', avgVolumeSpike);

        console.log('🔥 Learned Breakout Norms:');
        console.log(`   Avg IV Expansion: ${avgIVExpansion.toFixed(2)}x`);
        console.log(`   Avg Premium Surge: ${(avgPremiumSurge * 100).toFixed(2)}%`);
        console.log(`   Avg Volume Spike: ${avgVolumeSpike.toFixed(2)}x`);
    }
}

export const marketFlowIntelligenceEngine = new MarketFlowIntelligenceEngine();
