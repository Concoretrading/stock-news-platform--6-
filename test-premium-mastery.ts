
import { premiumMasteryEngine } from './lib/services/premium-mastery-engine';

function generateBars(count: number, volatility: number, trend: number = 0) {
    const bars = [];
    let price = 100;
    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.5 + trend) * volatility * price;
        const open = price;
        const close = price + change;
        bars.push({
            o: open,
            h: Math.max(open, close) + Math.random(),
            l: Math.min(open, close) - Math.random(),
            c: close
        });
        price = close;
    }
    return bars;
}

console.log('🧪 TESTING PREMIUM MASTERY ENGINE...\n');

// 1. Test Expansion (Increasing Volatility)
console.log('📡 Scenario 1: Volatility Expansion (Takeoff)');
const stableBars = generateBars(30, 0.001); // 30 stable bars
const expansionBars = generateBars(5, 0.05);  // 5 expansion bars
const takeoffResult = premiumMasteryEngine.analyzePremium([...stableBars, ...expansionBars]);
console.log('Result:', takeoffResult);
// Note: takeoffResult should have positive vol_change. 
// And if price trend is positive, it might have bullish bias.

// 2. Test Decay (Decreasing Volatility)
console.log('\n📡 Scenario 2: Volatility Decay (Breakdown)');
const highVolBars = generateBars(30, 0.05); // 30 high vol bars
const decayBars = generateBars(5, 0.001);   // 5 decay bars
const breakdownResult = premiumMasteryEngine.analyzePremium([...highVolBars, ...decayBars]);
console.log('Result:', breakdownResult);

// 3. Test Asymmetry (Bullish)
console.log('\n📡 Scenario 3: Bullish Asymmetry');
const bullishBars = [];
let p = 100;
for (let i = 0; i < 50; i++) {
    // Up moves have more variance than down moves
    const upMove = 1.0 + Math.random() * 2.0;
    const downMove = -0.5 - Math.random() * 0.1;
    const change = i % 2 === 0 ? upMove : downMove;
    bullishBars.push({ o: p, h: p + 3.5, l: p - 1, c: p + change });
    p += change;
}
const bullishResult = premiumMasteryEngine.analyzePremium(bullishBars);
console.log('Result:', bullishResult);

console.log('\n✅ VERIFICATION COMPLETE');
