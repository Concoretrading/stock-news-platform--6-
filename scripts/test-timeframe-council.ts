
import { timeframeCouncil, TimeframeAnalysis } from '../lib/services/timeframe-council';

async function runTest() {
    console.log('🏛️ TESTING TIMEFRAME COUNCIL ALIGNMENT...\n');

    // Scenario 1: The "Grade A+" Setup (All Aligned)
    console.log('--- SCENARIO 1: TOTAL ALIGNMENT (THE INVESTOR BREAKOUT) ---');
    const scenario1 = timeframeCouncil.conveneCouncil(
        'NVDA',
        { // Weekly
            timeframe: 'weekly',
            trend: 'uptrend',
            key_levels: { nearest_resistance: 600, nearest_support: 400, distance_to_resistance_pct: 0.15, distance_to_support_pct: 0.2 },
            structure: 'breakout',
            momentum: 'accelerating'
        },
        { // Daily
            timeframe: 'daily',
            trend: 'uptrend',
            key_levels: { nearest_resistance: 550, nearest_support: 520, distance_to_resistance_pct: 0.05, distance_to_support_pct: 0.02 },
            structure: 'breakout',
            momentum: 'accelerating'
        },
        { // Scalp
            timeframe: '5min',
            trend: 'uptrend',
            key_levels: { nearest_resistance: 535, nearest_support: 530, distance_to_resistance_pct: 0.01, distance_to_support_pct: 0.01 },
            structure: 'breakout',
            momentum: 'accelerating'
        }
    );
    console.log(`DECISION: ${scenario1.trade_grade} Grade | Sizing: ${scenario1.suggested_sizing_multiplier}x | Runners: ${scenario1.runner_mode}`);
    console.log(`RATIONALE: ${scenario1.rationale_summary}\n`);


    // Scenario 2: The "Scalp Only" (Daily Divergence Conflict)
    console.log('--- SCENARIO 2: SWING DIVERGENCE (SCALP ONLY) ---');
    const scenario2 = timeframeCouncil.conveneCouncil(
        'SPY',
        { // Weekly
            timeframe: 'weekly',
            trend: 'uptrend',
            key_levels: { nearest_resistance: 450, nearest_support: 420, distance_to_resistance_pct: 0.05, distance_to_support_pct: 0.05 },
            structure: 'consolidation',
            momentum: 'neutral'
        },
        { // Daily (Bearish Divergence)
            timeframe: 'daily',
            trend: 'uptrend',
            key_levels: { nearest_resistance: 445, nearest_support: 435, distance_to_resistance_pct: 0.01, distance_to_support_pct: 0.02 },
            structure: 'extension',
            momentum: 'divergence'
        },
        { // Scalp (Bullish Breakout)
            timeframe: '5min',
            trend: 'uptrend',
            key_levels: { nearest_resistance: 442, nearest_support: 440, distance_to_resistance_pct: 0.005, distance_to_support_pct: 0.005 },
            structure: 'breakout',
            momentum: 'accelerating'
        }
    );
    console.log(`DECISION: ${scenario2.trade_grade} Grade | Sizing: ${scenario2.suggested_sizing_multiplier}x | Runners: ${scenario2.runner_mode}`);
    console.log(`RATIONALE: ${scenario2.rationale_summary}\n`);


    // Scenario 3: The "Investor Veto" (Major Resistance)
    console.log('--- SCENARIO 3: INVESTOR VETO (MAJOR RESISTANCE) ---');
    const scenario3 = timeframeCouncil.conveneCouncil(
        'TSLA',
        { // Weekly (Downtrend + Resistance)
            timeframe: 'weekly',
            trend: 'downtrend',
            key_levels: { nearest_resistance: 200, nearest_support: 150, distance_to_resistance_pct: 0.01, distance_to_support_pct: 0.2 }, // At 1% from resistance
            structure: 'breakdown',
            momentum: 'decelerating'
        },
        { // Daily (Neutral)
            timeframe: 'daily',
            trend: 'downtrend',
            key_levels: { nearest_resistance: 200, nearest_support: 180, distance_to_resistance_pct: 0.01, distance_to_support_pct: 0.1 },
            structure: 'consolidation',
            momentum: 'neutral'
        },
        { // Scalp (Bullish Pump)
            timeframe: '5min',
            trend: 'uptrend',
            key_levels: { nearest_resistance: 199, nearest_support: 195, distance_to_resistance_pct: 0.01, distance_to_support_pct: 0.01 },
            structure: 'breakout',
            momentum: 'accelerating'
        }
    );
    console.log(`DECISION: ${scenario3.trade_grade} Grade | Sizing: ${scenario3.suggested_sizing_multiplier}x | Runners: ${scenario3.runner_mode}`);
    console.log(`RATIONALE: ${scenario3.rationale_summary}\n`);
}

runTest();
