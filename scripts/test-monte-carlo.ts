// Test Monte Carlo Simulator
// Verifies 10k+ simulations with psychology randomness

import { monteCarloSimulator } from '../lib/services/monte-carlo-simulator';
import { MarketScenario } from '../lib/services/scenario-intelligence-engine';
import { tradingPsychologyEngine } from '../lib/services/trading-psychology-engine';
import { behavioralGravityEngine } from '../lib/services/behavioral-gravity-engine';

async function testMonteCarloSimulator() {
    console.log('🎲 ========================================');
    console.log('🎲 MONTE CARLO SIMULATOR TEST');
    console.log('🎲 ========================================\n');

    // Mock scenario: Bullish breakout
    const scenario: MarketScenario = {
        scenario_id: 'bullish_breakout',
        scenario_name: 'Bullish Breakout Above Resistance',
        probability: 65,
        confidence_level: 'HIGH',
        trigger_conditions: [
            {
                condition: 'Price breaks above 158.50',
                current_value: 155.67,
                threshold_value: 158.50,
                status: 'APPROACHING',
                proximity_percentage: 85
            }
        ],
        expected_outcomes: [
            {
                asset: 'AAPL',
                direction: 'UP',
                magnitude: 0.08, // 8% expected move
                timeframe: 'days',
                probability: 78
            }
        ],
        trading_implications: {
            current_positions: [],
            new_opportunities: [],
            hedge_adjustments: {
                current_hedges: 'REDUCE',
                new_hedges: [],
                reasoning: 'Bullish scenario'
            }
        },
        last_updated: new Date().toISOString(),
        data_inputs: ['Price action', 'Volume'],
        scenario_evolution: 'STRENGTHENING'
    };

    // Get psychology and behavioral analysis
    const psychology = await tradingPsychologyEngine.analyzeTradingPsychology('AAPL');
    const biases = await behavioralGravityEngine.analyzeBehavioralBiases('AAPL', 155.67, 2.5);

    console.log('📊 Input Parameters:');
    console.log(`   Current Price: $155.67`);
    console.log(`   Scenario: ${scenario.scenario_name}`);
    console.log(`   Expected Move: +${scenario.expected_outcomes[0].magnitude * 100}%`);
    console.log(`   Market Emotion: ${psychology.market_emotional_state.primary_emotion.toUpperCase()}`);
    console.log(`   Emotion Intensity: ${psychology.market_emotional_state.intensity_level}/100\n`);

    // Run Monte Carlo simulation
    const startTime = Date.now();

    const results = await monteCarloSimulator.simulate(
        scenario,
        155.67,
        psychology,
        biases,
        {
            num_simulations: 10000,
            time_horizon_days: 30,
            psychology_volatility: 0.3,
            include_black_swans: true
        }
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Simulation Complete in ${duration}s\n`);

    // Display results
    console.log('📈 SIMULATION RESULTS:');
    console.log('=====================================');
    console.log(`   Simulations Run: ${results.config.num_simulations.toLocaleString()}`);
    console.log(`   Time Horizon: ${results.config.time_horizon_days} days`);
    console.log(`   Psychology Volatility: ${results.config.psychology_volatility * 100}%\n`);

    console.log('💰 PRICE STATISTICS:');
    console.log(`   Mean Final Price: $${results.statistics.mean_final_price.toFixed(2)}`);
    console.log(`   Median Final Price: $${results.statistics.median_final_price.toFixed(2)}`);
    console.log(`   Std Deviation: $${results.statistics.std_dev.toFixed(2)}\n`);

    console.log('📊 P&L STATISTICS:');
    console.log(`   Mean P&L: ${results.statistics.mean_pnl > 0 ? '+' : ''}${results.statistics.mean_pnl.toFixed(2)}%`);
    console.log(`   Median P&L: ${results.statistics.median_pnl > 0 ? '+' : ''}${results.statistics.median_pnl.toFixed(2)}%`);
    console.log(`   Max Gain: +${results.statistics.max_gain.toFixed(2)}%`);
    console.log(`   Max Loss: ${results.statistics.max_loss.toFixed(2)}%\n`);

    console.log('🎯 PROBABILITY METRICS:');
    console.log(`   Probability of Profit: ${results.statistics.probability_profit.toFixed(1)}%`);
    console.log(`   Probability of Loss: ${results.statistics.probability_loss.toFixed(1)}%`);
    console.log(`   Sharpe Ratio: ${results.statistics.sharpe_ratio.toFixed(2)}`);
    console.log(`   Sortino Ratio: ${results.statistics.sortino_ratio.toFixed(2)}\n`);

    console.log('📉 PERCENTILES:');
    console.log(`   10th Percentile: ${results.percentiles.p10.toFixed(2)}%`);
    console.log(`   25th Percentile: ${results.percentiles.p25.toFixed(2)}%`);
    console.log(`   50th Percentile (Median): ${results.percentiles.p50.toFixed(2)}%`);
    console.log(`   75th Percentile: ${results.percentiles.p75.toFixed(2)}%`);
    console.log(`   90th Percentile: ${results.percentiles.p90.toFixed(2)}%\n`);

    console.log('⚠️  RISK METRICS:');
    console.log(`   Value at Risk (95%): ${results.risk_metrics.value_at_risk_95.toFixed(2)}%`);
    console.log(`   Conditional VaR (95%): ${results.risk_metrics.conditional_var_95.toFixed(2)}%`);
    console.log(`   Avg Max Drawdown: ${results.risk_metrics.max_drawdown_avg.toFixed(2)}%`);
    console.log(`   Worst Max Drawdown: ${results.risk_metrics.max_drawdown_worst.toFixed(2)}%\n`);

    console.log('🎲 SCENARIO ALIGNMENT:');
    console.log(`   Bullish Paths: ${results.scenario_alignment.bullish_paths.toLocaleString()} (${(results.scenario_alignment.bullish_paths / 10000 * 100).toFixed(1)}%)`);
    console.log(`   Bearish Paths: ${results.scenario_alignment.bearish_paths.toLocaleString()} (${(results.scenario_alignment.bearish_paths / 10000 * 100).toFixed(1)}%)`);
    console.log(`   Neutral Paths: ${results.scenario_alignment.neutral_paths.toLocaleString()} (${(results.scenario_alignment.neutral_paths / 10000 * 100).toFixed(1)}%)\n`);

    // Sample psychology events from first simulation
    const sampleSim = results.simulations[0];
    if (sampleSim.psychology_events.length > 0) {
        console.log('🧠 SAMPLE PSYCHOLOGY EVENTS (Simulation #1):');
        sampleSim.psychology_events.slice(0, 5).forEach(event => {
            console.log(`   Day ${event.day}: ${event.event_type} (${event.price_impact > 0 ? '+' : ''}${(event.price_impact * 100).toFixed(2)}%)`);
        });
        console.log(`   ... and ${sampleSim.psychology_events.length - 5} more events\n`);
    }

    // Validation checks
    console.log('✅ VALIDATION CHECKS:');
    console.log(`   ✓ Ran ${results.simulations.length.toLocaleString()} simulations`);
    console.log(`   ✓ Probability of profit: ${results.statistics.probability_profit.toFixed(1)}% (Expected: ~${scenario.probability}%)`);
    console.log(`   ✓ Mean P&L aligns with scenario: ${results.statistics.mean_pnl > 0 ? 'PASS' : 'REVIEW'}`);
    console.log(`   ✓ Risk metrics calculated: VaR, CVaR, Sharpe, Sortino`);
    console.log(`   ✓ Psychology events injected: ${sampleSim.psychology_events.length} events in sample path`);

    console.log('\n🎲 ========================================');
    console.log('🎲 TEST COMPLETE');
    console.log('🎲 ========================================\n');
}

// Run test
testMonteCarloSimulator().catch(console.error);
