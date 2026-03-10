// Test Profit Compounding Manager
// Simulates a series of trades to demonstrate profit compounding

import { ProfitCompoundingManager } from '../lib/services/profit-compounding-manager';

async function testProfitCompounding() {
    console.log('💰 ========================================');
    console.log('💰 PROFIT COMPOUNDING MANAGER TEST');
    console.log('💰 Playing with House Money Strategy');
    console.log('💰 ========================================\n');

    const manager = new ProfitCompoundingManager(50000);

    console.log('\n📊 INITIAL STATE:');
    console.log(manager.getPerformanceSummary());

    // ============================================
    // TRADE 1: First Winner (+$1,500)
    // ============================================
    console.log('\n\n🎯 ========================================');
    console.log('🎯 TRADE 1: First Setup (Winner)');
    console.log('🎯 ========================================');

    const nextRisk1 = manager.calculateNextTradeRisk();
    console.log(`\n💵 Risk for this trade: $${nextRisk1.total_risk_allowed.toFixed(2)}`);
    console.log(`   ${nextRisk1.reasoning}`);

    manager.recordTrade({
        trade_id: 'TRADE_001',
        ticker: 'NDX',
        entry_date: '2026-02-10',
        exit_date: '2026-02-10',
        position_cost: 1000,
        exit_value: 2500,
        profit_loss: 1500,
        profit_loss_percentage: 150,
        was_winner: true
    });

    // ============================================
    // TRADE 2: Second Winner (+$2,000) - Using House Money
    // ============================================
    console.log('\n\n🎯 ========================================');
    console.log('🎯 TRADE 2: Second Setup (Winner)');
    console.log('🎯 ========================================');

    const nextRisk2 = manager.calculateNextTradeRisk();
    console.log(`\n💵 Risk for this trade: $${nextRisk2.total_risk_allowed.toFixed(2)}`);
    console.log(`   Base Risk: $${nextRisk2.base_risk.toFixed(2)}`);
    console.log(`   House Money Bonus: $${nextRisk2.house_money_bonus.toFixed(2)}`);
    console.log(`   ${nextRisk2.reasoning}`);

    manager.recordTrade({
        trade_id: 'TRADE_002',
        ticker: 'SPX',
        entry_date: '2026-02-11',
        exit_date: '2026-02-11',
        position_cost: 1750, // Using base risk + house money
        exit_value: 3750,
        profit_loss: 2000,
        profit_loss_percentage: 114,
        was_winner: true
    });

    // ============================================
    // TRADE 3: Loser (-$800) - Covered by House Money
    // ============================================
    console.log('\n\n🎯 ========================================');
    console.log('🎯 TRADE 3: Third Setup (Loser)');
    console.log('🎯 ========================================');

    const nextRisk3 = manager.calculateNextTradeRisk();
    console.log(`\n💵 Risk for this trade: $${nextRisk3.total_risk_allowed.toFixed(2)}`);
    console.log(`   Base Risk: $${nextRisk3.base_risk.toFixed(2)}`);
    console.log(`   House Money Bonus: $${nextRisk3.house_money_bonus.toFixed(2)}`);
    console.log(`   ${nextRisk3.reasoning}`);

    manager.recordTrade({
        trade_id: 'TRADE_003',
        ticker: 'QQQ',
        entry_date: '2026-02-11',
        exit_date: '2026-02-11',
        position_cost: 800,
        exit_value: 0,
        profit_loss: -800,
        profit_loss_percentage: -100,
        was_winner: false
    });

    // ============================================
    // TRADE 4: Winner (+$1,200)
    // ============================================
    console.log('\n\n🎯 ========================================');
    console.log('🎯 TRADE 4: Fourth Setup (Winner)');
    console.log('🎯 ========================================');

    const nextRisk4 = manager.calculateNextTradeRisk();
    console.log(`\n💵 Risk for this trade: $${nextRisk4.total_risk_allowed.toFixed(2)}`);
    console.log(`   ${nextRisk4.reasoning}`);

    manager.recordTrade({
        trade_id: 'TRADE_004',
        ticker: 'NDX',
        entry_date: '2026-02-12',
        exit_date: '2026-02-12',
        position_cost: 1000,
        exit_value: 2200,
        profit_loss: 1200,
        profit_loss_percentage: 120,
        was_winner: true
    });

    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log('\n\n📊 ========================================');
    console.log('📊 FINAL PERFORMANCE SUMMARY');
    console.log('📊 ========================================');
    console.log(manager.getPerformanceSummary());

    // ============================================
    // DEMONSTRATE WITHDRAWAL
    // ============================================
    console.log('\n\n💸 ========================================');
    console.log('💸 TAKING PROFITS OFF THE TABLE');
    console.log('💸 ========================================');

    const state = manager.getState();
    const withdrawAmount = state.total_profit_banked * 0.5; // Withdraw 50% of banked profits

    console.log(`\nWithdrawing 50% of banked profits: $${withdrawAmount.toFixed(2)}`);
    manager.withdrawBankedProfits(withdrawAmount);

    console.log('\n📊 AFTER WITHDRAWAL:');
    console.log(manager.getPerformanceSummary());

    // ============================================
    // KEY INSIGHTS
    // ============================================
    console.log('\n\n💡 ========================================');
    console.log('💡 KEY INSIGHTS');
    console.log('💡 ========================================\n');

    console.log('✅ Strategy Benefits:');
    console.log('   1. Protects initial capital by banking half of each win');
    console.log('   2. Compounds earnings by using house money for next trade');
    console.log('   3. Losses are covered by house money first (playing with their money)');
    console.log('   4. Maintains consistency by always risking 2% base + house money bonus');
    console.log('   5. Allows withdrawals of banked profits without affecting trading capital\n');

    console.log('📊 Example from this test:');
    console.log('   - Trade 1 Win: $1,500 → $750 banked, $750 house money');
    console.log('   - Trade 2 Win: $2,000 → $1,000 banked, $1,000 house money');
    console.log('   - Trade 3 Loss: -$800 → Covered by house money (no capital loss!)');
    console.log('   - Trade 4 Win: $1,200 → $600 banked, $600 house money');
    console.log('   - Total Banked: $2,350 (protected profits)');
    console.log('   - House Money: $1,550 (available for next trade)');

    console.log('\n💰 ========================================');
    console.log('💰 TEST COMPLETE');
    console.log('💰 ========================================\n');
}

// Run test
testProfitCompounding().catch(console.error);
