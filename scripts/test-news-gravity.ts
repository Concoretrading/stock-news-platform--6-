
import { newsGravityAnalyzer } from '../lib/services/news-gravity-analyzer';

async function testNewsGravity() {
    console.log('🌌 Testing NewsGravity Analyzer...');

    // 1. Record some "Muscle Memory"
    console.log('\n📝 Recording Historical Events...');
    newsGravityAnalyzer.recordNewsEvent('SPY', 'CPI Beat (Oct 23)', 435.50, 420.00, 'Bearish');
    newsGravityAnalyzer.recordNewsEvent('SPY', 'FOMC Pivot (Dec 23)', 470.00, 460.00, 'Bullish');

    // 2. Analyze "Live" Gravity
    console.log('\n🧠 Analyzing Current Gravity...');
    const analysis = await newsGravityAnalyzer.analyzeGravity('SPY', 'Upcoming CPI');

    console.log('\n📊 GRAVITY REPORT:');
    console.log(`Matched Levels: ${analysis.gravity_levels.length}`);
    analysis.gravity_levels.forEach(l => {
        console.log(`   - ${l.type} @ $${l.price} (${l.event_context})`);
    });

    console.log('\n🔮 SCENARIOS:');
    analysis.active_scenarios.forEach(s => {
        console.log(`   - ${s.name} (${s.probability}%): ${s.description}`);
    });

    console.log('\n⚠️ TRAP DETECTION:');
    if (analysis.trap_detection.active) {
        console.log(`   🚨 ${analysis.trap_detection.type}! ${analysis.trap_detection.description}`);
    } else {
        console.log('   ✅ No immediate trap detected.');
    }

    console.log(`\n📢 RECOMMENDATION: ${analysis.recommendation}`);
}

testNewsGravity();
