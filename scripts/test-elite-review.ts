
import { eliteDailyReviewPipeline } from '../lib/services/elite-daily-review-pipeline';

async function runTest() {
    console.log('🧪 Starting Elite Daily Review Pipeline Test...');

    try {
        const reviews = await eliteDailyReviewPipeline.runTestScenario();

        console.log('\n✨ GENERATED REVIEWS FOR 5 VOLATILE DAYS ✨\n');

        reviews.forEach((review, index) => {
            console.log(`\n📅 REVIEW ${index + 1}: ${review.date} (${review.market_context})`);
            console.log('---------------------------------------------------');

            console.log('1️⃣  TECHNICAL UNFOLD & TACTICAL IMPROVEMENTS');
            console.log(review.technical.price_action_summary);
            console.log('   • SYSTEM COMPONENT REVIEW:');
            console.log(`     - Squeeze: ${review.technical.system_component_review.squeeze_analysis.compression_strength} -> ${review.technical.system_component_review.squeeze_analysis.momentum_histogram}`);
            console.log(`     - TICK: Trend ${review.technical.system_component_review.tick_analysis.cumulative_trend}, Extremes [${review.technical.system_component_review.tick_analysis.extremes_hit.join(', ')}]`);
            console.log(`     - Level 2: ${review.technical.system_component_review.level2_analysis.bid_ask_depth} (${review.technical.system_component_review.level2_analysis.iceberg_orders.join(', ')})`);
            console.log(`     - Premium: IV Rank ${review.technical.system_component_review.premium_analysis.iv_rank}, Skew ${review.technical.system_component_review.premium_analysis.skew_direction}`);

            console.log(`   • Algo Performance: Entry ${review.technical.algo_performance.entry_accuracy}%, Exit ${review.technical.algo_performance.exit_accuracy}%`);
            console.log(`   • PnL Attribution: ${review.technical.algo_performance.pnl_attribution}`);
            console.log('   • Tactical Improvements:');
            review.technical.algo_performance.tactical_improvements.forEach(imp => console.log(`     - ${imp}`));

            console.log('\n2️⃣  EMOTIONAL RIDE & MANIPULATION INSIGHTS');
            console.log(`   • Psychology at Highs: ${review.emotional.participant_psychology.at_highs}`);
            console.log(`   • Psychology on Flush: ${review.emotional.participant_psychology.during_flush}`);
            console.log(`   • Manipulation: ${review.emotional.manipulation_insights.liquidity_grabs.join(', ')}`);
            console.log(`   • Societal Connection: ${review.emotional.societal_connection}`);

            console.log('\n3️⃣  ELITE MINDSET & PROCESS AUDIT');
            console.log(`   • Probabilistic Thinking: ${review.mindset.probabilistic_evaluation.thinking_in_odds_notes}`);
            console.log(`   • Risk-First Critique: Survival Rating ${review.mindset.risk_first_critique.survival_rating}/10`);
            console.log(`   • Process Score: ${review.mindset.process_vs_outcome.execution_quality}/10 ("${review.mindset.process_vs_outcome.process_notes}")`);
            console.log(`   • Radical Transparency: ${review.mindset.bias_check.radical_transparency_notes}`);
            console.log(`   • Logged Experience: "${review.mindset.self_critique.logged_experience}"`);

            console.log('\n🏆 RL REWARDS');
            console.log(`   Process: ${review.rl_rewards.process_score} | Risk: ${review.rl_rewards.risk_score} | Mindset Bonus: ${review.rl_rewards.mindset_bonus}`);
            console.log('---------------------------------------------------\n');
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runTest();
