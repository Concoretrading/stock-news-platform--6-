
import { EliteTradingBrain } from '../lib/services/elite-trading-brain';
import { OptionStrike } from '../lib/services/options-premium-mastery';

async function verifyStrategy() {
    console.log('🧪 Starting Strategy Verification: 4:1 Ratio Hedging (Dynamic Risk-Free Runner)');

    const eliteBrain = new EliteTradingBrain();

    // Mock Probability Signal (High Conviction)
    const mockSignal = {
        ticker: 'SPY',
        timestamp: new Date().toISOString(),
        probabilityAssessment: {
            breakoutProbability: 85, // Very High to ensure S tier
            confidenceLevel: 'HIGH' as const,
            expectedMoveSize: 5.50,
            keyRisks: []
        },
        consolidation: {
            isConsolidating: true,
            consolidationDuration: 15,
            breakoutProbability: 85, // Match above
            compressionLevel: 0.8
        },
        premiumSetup: {
            optimalStrikes: [],
            ivCompressionOpportunity: 80,
            entryTiming: 'IMMEDIATE' as const
        },
        scalingStrategy: {
            stages: 3,
            timeline: '2 days',
            riskManagement: 'Standard'
        }
    };

    // Mock Option Chain (needed for typing, but logic doesn't use it deeply yet)
    const mockChain: OptionStrike[] = [
        {
            strike: 500, expiration: '2024-12-20', type: 'CALL', bid: 2.0, ask: 2.1, last: 2.05,
            mark: 2.05, delta: 0.5, gamma: 0.05, theta: -0.1, vega: 0.2, implied_volatility: 0.15,
            iv_rank: 20, iv_percentile: 20, volume: 1000, open_interest: 5000, volume_oi_ratio: 0.2,
            intrinsic_value: 0, extrinsic_value: 2.0, time_value: 2.0, moneyness: 0,
            unusual_activity: false, smart_money_flow: 'neutral', retail_sentiment: 'neutral',
            atrLevel: 'ATM', consolidationPremiumScore: 50, breakoutPremiumScore: 50
        }
    ];

    try {
        const analysis = await eliteBrain.analyzeEliteSetup('SPY', 500, mockSignal, mockChain);

        console.log('\n🧠 Analysis Result:');
        console.log(`🎯 Rating: ${analysis.setup_quality.overall_rating} (${analysis.setup_quality.overall_score})`);
        console.log(`✅ Recommendation: ${analysis.elite_decision.final_recommendation}`);

        const entry = analysis.execution_plan.entry_strategy.primary_entry;
        console.log(`\n🚪 Entry Strategy:`);
        console.log(`   Instrument: ${entry.instrument}`);

        if (entry.ratio_configuration) {
            console.log(`   ⚖️ Ratio Config: ${entry.ratio_configuration.structure}`);
            console.log(`      Long Leg: ${entry.ratio_configuration.long_leg}`);
            console.log(`      Hedge Leg: ${entry.ratio_configuration.hedge_leg}`);
        } else {
            console.log('   ❌ Ratio Configuration NOT DETECTED');
        }

        const targets = analysis.execution_plan.exit_strategy.profit_targets;
        console.log(`\n🎯 Profit Targets:`);
        targets.forEach((t, i) => {
            console.log(`   Target ${i + 1}: $${t.price.toFixed(2)} - Size: ${t.size} - ${t.description}`);
        });

        const hedge = analysis.execution_plan.exit_strategy.hedge_management;
        console.log(`\n🛡️ Hedge Management:`);
        hedge?.forEach((h, i) => {
            console.log(`   Rule ${i + 1}: ${h.action} on "${h.trigger}" - ${h.description}`);
        });


        if (entry.instrument.includes('4:1') && analysis.setup_quality.overall_rating === 'S') {
            console.log('\n✅ VERIFICATION SUCCESS: 4:1 Ratio Strategy triggered correctly!');
        } else {
            console.error('\n❌ VERIFICATION FAILED: Strategy did not trigger as expected.');
            process.exit(1);
        }

    } catch (error) {
        console.error('Error running verification:', error);
        process.exit(1);
    }
}

verifyStrategy();
