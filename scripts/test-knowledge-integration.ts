
import { eliteDailyReviewPipeline } from '../lib/services/elite-daily-review-pipeline';

async function runTest() {
    console.log('🧪 Starting Unified Knowledge Integration Test (Neutral Days)...');

    const neutralDays = [
        {
            date: '2023-05-15',
            ticker: 'SPY',
            open: 412, high: 413.50, low: 411, close: 412.20,
            volume: 45000000,
            vix_open: 16, vix_close: 15.5,
            events: ['No News', 'Chop Fest']
        },
        {
            date: '2023-05-16',
            ticker: 'SPY',
            open: 411, high: 412, low: 410.50, close: 411.00,
            volume: 42000000,
            vix_open: 15.5, vix_close: 15.2,
            events: ['Waiting for Debt Ceiling']
        },
        {
            date: '2023-05-17',
            ticker: 'SPY',
            open: 411, high: 414, low: 410.80, close: 413.50, // Late breakout attempt
            volume: 55000000,
            vix_open: 15.2, vix_close: 16.0,
            events: ['Fed Speaker', 'Late move']
        }
    ];

    try {
        console.log('\n✨ GENERATING REVIEWS FOR 3 NEUTRAL DAYS ✨\n');

        neutralDays.forEach((day, index) => {
            const review = eliteDailyReviewPipeline.generateReview(day);

            console.log(`\n📅 REVIEW ${index + 1}: ${day.date} (${day.events.join(', ')})`);
            console.log('---------------------------------------------------');

            console.log('1️⃣  MARKET CONTEXT');
            console.log(`   • ${review.technical.price_action_summary}`);
            console.log(`   • VIX: ${day.vix_open} -> ${day.vix_close}`);

            console.log('\n🧠  KNOWLEDGE APPLICATION (The Flexible Mind)');
            if (review.knowledge_application.applied_concepts.length > 0) {
                review.knowledge_application.applied_concepts.forEach(insight => {
                    console.log(`   • [${insight.layer}] ${insight.concept}`);
                    console.log(`     - Application: ${insight.application}`);
                    console.log(`     - Advice: ${insight.actionable_advice}`);
                });
                console.log(`   \n📝 Summary Note: "${review.knowledge_application.summary_note}"`);
            } else {
                console.log('   (No specific insights triggers for this context)');
            }

            console.log('\n🏆 RL REWARDS');
            console.log(`   Process: ${review.rl_rewards.process_score} | Knowledge Bonus: ${review.rl_rewards.knowledge_bonus}`);
            console.log('---------------------------------------------------\n');
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runTest();
