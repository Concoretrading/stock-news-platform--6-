// Monte Carlo Simulator - Advanced Probability Estimation
// Runs 10k+ simulations with psychology randomness to estimate outcome distributions

import { MarketScenario } from './scenario-intelligence-engine';
import { PsychologyEngineOutput } from './trading-psychology-engine';
import { BehavioralBiasReport } from './behavioral-gravity-engine';

export interface MonteCarloConfig {
    num_simulations: number; // Default: 10,000
    time_horizon_days: number; // How many days to simulate
    psychology_volatility: number; // 0-1, how much psych can shift
    include_black_swans: boolean; // Include rare extreme events
    confidence_intervals: number[]; // e.g., [10, 50, 90] for percentiles
}

export interface PricePathSimulation {
    simulation_id: number;
    final_price: number;
    final_pnl: number;
    max_drawdown: number;
    max_profit: number;
    path: number[]; // Daily prices
    psychology_events: PsychologyEvent[];
}

export interface PsychologyEvent {
    day: number;
    event_type: 'PANIC' | 'EUPHORIA' | 'CAPITULATION' | 'FOMO' | 'NORMAL';
    price_impact: number; // Percentage impact
}

export interface MonteCarloResults {
    config: MonteCarloConfig;
    simulations: PricePathSimulation[];
    statistics: {
        mean_final_price: number;
        median_final_price: number;
        std_dev: number;
        mean_pnl: number;
        median_pnl: number;
        probability_profit: number; // 0-100%
        probability_loss: number; // 0-100%
        max_gain: number;
        max_loss: number;
        sharpe_ratio: number;
        sortino_ratio: number;
    };
    percentiles: {
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
    };
    risk_metrics: {
        value_at_risk_95: number; // 95% VaR
        conditional_var_95: number; // Expected loss beyond VaR
        max_drawdown_avg: number;
        max_drawdown_worst: number;
    };
    scenario_alignment: {
        bullish_paths: number;
        bearish_paths: number;
        neutral_paths: number;
    };
}

export class MonteCarloSimulator {
    private defaultConfig: MonteCarloConfig = {
        num_simulations: 10000,
        time_horizon_days: 30,
        psychology_volatility: 0.3,
        include_black_swans: true,
        confidence_intervals: [10, 25, 50, 75, 90]
    };

    constructor() {
        console.log('🎲 INITIALIZING MONTE CARLO SIMULATOR');
        console.log('📊 Default: 10,000 simulations with psychology randomness');
    }

    /**
     * Main simulation method
     */
    async simulate(
        scenario: MarketScenario,
        currentPrice: number,
        psychology: PsychologyEngineOutput,
        biases: BehavioralBiasReport,
        config?: Partial<MonteCarloConfig>
    ): Promise<MonteCarloResults> {
        const finalConfig = { ...this.defaultConfig, ...config };

        console.log(`🎲 Running ${finalConfig.num_simulations.toLocaleString()} Monte Carlo simulations...`);
        console.log(`📈 Scenario: ${scenario.scenario_name} (${scenario.probability}% probability)`);

        const simulations: PricePathSimulation[] = [];

        // Run simulations
        for (let i = 0; i < finalConfig.num_simulations; i++) {
            const simulation = this.runSingleSimulation(
                i,
                scenario,
                currentPrice,
                psychology,
                biases,
                finalConfig
            );
            simulations.push(simulation);
        }

        // Calculate statistics
        const statistics = this.calculateStatistics(simulations, currentPrice);
        const percentiles = this.calculatePercentiles(simulations);
        const riskMetrics = this.calculateRiskMetrics(simulations);
        const scenarioAlignment = this.calculateScenarioAlignment(simulations, currentPrice);

        return {
            config: finalConfig,
            simulations,
            statistics,
            percentiles,
            risk_metrics: riskMetrics,
            scenario_alignment: scenarioAlignment
        };
    }

    /**
     * Run a single price path simulation
     */
    private runSingleSimulation(
        id: number,
        scenario: MarketScenario,
        startPrice: number,
        psychology: PsychologyEngineOutput,
        biases: BehavioralBiasReport,
        config: MonteCarloConfig
    ): PricePathSimulation {
        const path: number[] = [startPrice];
        const psychologyEvents: PsychologyEvent[] = [];

        let currentPrice = startPrice;

        // Determine base drift and volatility from scenario
        const expectedMove = scenario.expected_outcomes[0]?.magnitude || 0;
        const dailyDrift = expectedMove / config.time_horizon_days;

        // Base volatility (annualized ~20%, daily ~1.26%)
        let dailyVolatility = 0.0126;

        // Adjust volatility based on psychology
        if (psychology.market_emotional_state.primary_emotion === 'panic') {
            dailyVolatility *= 2.0; // Double volatility in panic
        } else if (psychology.market_emotional_state.primary_emotion === 'euphoria') {
            dailyVolatility *= 1.5; // 50% higher in euphoria
        }

        // Simulate each day
        for (let day = 1; day <= config.time_horizon_days; day++) {
            // Random walk component (Geometric Brownian Motion)
            const randomShock = this.randomNormal(0, dailyVolatility);

            // Psychology event (random with probability based on config)
            const psychEvent = this.simulatePsychologyEvent(
                day,
                psychology,
                config.psychology_volatility
            );

            if (psychEvent) {
                psychologyEvents.push(psychEvent);
                currentPrice *= (1 + psychEvent.price_impact);
            }

            // Apply drift + random shock
            currentPrice *= (1 + dailyDrift + randomShock);

            // Black swan events (rare, extreme moves)
            if (config.include_black_swans && Math.random() < 0.01) { // 1% chance per day
                const blackSwanImpact = this.randomNormal(0, 0.05); // ±5% extreme move
                currentPrice *= (1 + blackSwanImpact);

                psychologyEvents.push({
                    day,
                    event_type: blackSwanImpact > 0 ? 'EUPHORIA' : 'PANIC',
                    price_impact: blackSwanImpact
                });
            }

            path.push(currentPrice);
        }

        const finalPrice = path[path.length - 1];
        const finalPnl = ((finalPrice - startPrice) / startPrice) * 100;
        const maxDrawdown = this.calculateMaxDrawdown(path);
        const maxProfit = this.calculateMaxProfit(path, startPrice);

        return {
            simulation_id: id,
            final_price: finalPrice,
            final_pnl: finalPnl,
            max_drawdown: maxDrawdown,
            max_profit: maxProfit,
            path,
            psychology_events: psychologyEvents
        };
    }

    /**
     * Simulate random psychology events
     */
    private simulatePsychologyEvent(
        day: number,
        psychology: PsychologyEngineOutput,
        volatility: number
    ): PsychologyEvent | null {
        // Probability of psychology event based on current state
        let eventProbability = 0.05; // 5% base chance per day

        if (psychology.market_emotional_state.intensity_level > 70) {
            eventProbability = 0.15; // 15% if emotions are intense
        }

        if (Math.random() > eventProbability) {
            return null; // No event
        }

        // Determine event type based on current psychology
        const emotion = psychology.market_emotional_state.primary_emotion;
        let eventType: PsychologyEvent['event_type'] = 'NORMAL';
        let priceImpact = 0;

        if (emotion === 'fear' || emotion === 'panic') {
            eventType = Math.random() < 0.7 ? 'PANIC' : 'CAPITULATION';
            priceImpact = this.randomNormal(-0.03, 0.02); // -3% avg, 2% std
        } else if (emotion === 'greed' || emotion === 'euphoria') {
            eventType = Math.random() < 0.7 ? 'EUPHORIA' : 'FOMO';
            priceImpact = this.randomNormal(0.03, 0.02); // +3% avg, 2% std
        } else {
            return null; // No event in neutral psychology
        }

        return {
            day,
            event_type: eventType,
            price_impact: priceImpact * volatility // Scale by volatility config
        };
    }

    /**
     * Calculate statistics from all simulations
     */
    private calculateStatistics(
        simulations: PricePathSimulation[],
        startPrice: number
    ): MonteCarloResults['statistics'] {
        const finalPrices = simulations.map(s => s.final_price);
        const pnls = simulations.map(s => s.final_pnl);

        const meanPrice = this.mean(finalPrices);
        const medianPrice = this.median(finalPrices);
        const stdDev = this.standardDeviation(finalPrices);

        const meanPnl = this.mean(pnls);
        const medianPnl = this.median(pnls);

        const profitablePaths = pnls.filter(p => p > 0).length;
        const probabilityProfit = (profitablePaths / simulations.length) * 100;
        const probabilityLoss = 100 - probabilityProfit;

        const maxGain = Math.max(...pnls);
        const maxLoss = Math.min(...pnls);

        // Sharpe Ratio (assuming risk-free rate = 0 for simplicity)
        const sharpeRatio = meanPnl / (stdDev || 1);

        // Sortino Ratio (downside deviation only)
        const downsidePnls = pnls.filter(p => p < 0);
        const downsideStd = downsidePnls.length > 0 ? this.standardDeviation(downsidePnls) : stdDev;
        const sortinoRatio = meanPnl / (downsideStd || 1);

        return {
            mean_final_price: meanPrice,
            median_final_price: medianPrice,
            std_dev: stdDev,
            mean_pnl: meanPnl,
            median_pnl: medianPnl,
            probability_profit: probabilityProfit,
            probability_loss: probabilityLoss,
            max_gain: maxGain,
            max_loss: maxLoss,
            sharpe_ratio: sharpeRatio,
            sortino_ratio: sortinoRatio
        };
    }

    /**
     * Calculate percentiles
     */
    private calculatePercentiles(simulations: PricePathSimulation[]): MonteCarloResults['percentiles'] {
        const pnls = simulations.map(s => s.final_pnl).sort((a, b) => a - b);

        return {
            p10: this.percentile(pnls, 10),
            p25: this.percentile(pnls, 25),
            p50: this.percentile(pnls, 50),
            p75: this.percentile(pnls, 75),
            p90: this.percentile(pnls, 90)
        };
    }

    /**
     * Calculate risk metrics
     */
    private calculateRiskMetrics(simulations: PricePathSimulation[]): MonteCarloResults['risk_metrics'] {
        const pnls = simulations.map(s => s.final_pnl).sort((a, b) => a - b);
        const drawdowns = simulations.map(s => s.max_drawdown);

        // Value at Risk (95th percentile loss)
        const var95 = this.percentile(pnls, 5); // 5th percentile = 95% VaR

        // Conditional VaR (expected loss beyond VaR)
        const beyondVar = pnls.filter(p => p <= var95);
        const cvar95 = beyondVar.length > 0 ? this.mean(beyondVar) : var95;

        const maxDrawdownAvg = this.mean(drawdowns);
        const maxDrawdownWorst = Math.min(...drawdowns);

        return {
            value_at_risk_95: var95,
            conditional_var_95: cvar95,
            max_drawdown_avg: maxDrawdownAvg,
            max_drawdown_worst: maxDrawdownWorst
        };
    }

    /**
     * Calculate scenario alignment
     */
    private calculateScenarioAlignment(
        simulations: PricePathSimulation[],
        startPrice: number
    ): MonteCarloResults['scenario_alignment'] {
        let bullish = 0;
        let bearish = 0;
        let neutral = 0;

        simulations.forEach(sim => {
            const change = ((sim.final_price - startPrice) / startPrice) * 100;

            if (change > 2) bullish++;
            else if (change < -2) bearish++;
            else neutral++;
        });

        return {
            bullish_paths: bullish,
            bearish_paths: bearish,
            neutral_paths: neutral
        };
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    private calculateMaxDrawdown(path: number[]): number {
        let maxDrawdown = 0;
        let peak = path[0];

        for (const price of path) {
            if (price > peak) peak = price;
            const drawdown = ((price - peak) / peak) * 100;
            if (drawdown < maxDrawdown) maxDrawdown = drawdown;
        }

        return maxDrawdown;
    }

    private calculateMaxProfit(path: number[], startPrice: number): number {
        const maxPrice = Math.max(...path);
        return ((maxPrice - startPrice) / startPrice) * 100;
    }

    private randomNormal(mean: number, stdDev: number): number {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z0 * stdDev;
    }

    private mean(arr: number[]): number {
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    private median(arr: number[]): number {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    private standardDeviation(arr: number[]): number {
        const avg = this.mean(arr);
        const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
        const avgSquareDiff = this.mean(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    }

    private percentile(sortedArr: number[], p: number): number {
        const index = (p / 100) * (sortedArr.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;

        return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
    }
}

export const monteCarloSimulator = new MonteCarloSimulator();
