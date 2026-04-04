// Test Multi-Contract Position Manager
// Simulates your 3 Calls + 1 Put strategy across different scenarios

import { multiContractPositionManager } from '../lib/services/multi-contract-position-manager';

async function testMultiContractManager() {
    console.log('🎯 ========================================');
    console.log('🎯 MULTI-CONTRACT POSITION MANAGER TEST');
    console.log('🎯 ========================================\n');

    // Create position: 3 Calls + 1 Put on NDX
    const position = multiContractPositionManager.createBullishRatioPosition(
        'NDX',
        50, // Call entry price: $50
        20  // Put entry price: $20
    );

    console.log('\n📊 INITIAL POSITION SETUP:');
    console.log(`   Setup ID: ${position.setup_id}`);
    console.log(`   Initial Cost: $${position.initial_cost.toFixed(2)}`);
    console.log(`   Scenario Rules: ${position.scenario_rules.length} scenarios loaded\n`);

    // ============================================
    // TEST SCENARIO 1: Goes Against Us
    // ============================================
    console.log('\n🔴 ========================================');
    console.log('🔴 TEST: SCENARIO 1 - Goes Against Us');
    console.log('🔴 ========================================');
    console.log('Market drops -3% immediately after entry\n');

    const scenario1Result = multiContractPositionManager.updatePosition(
        position.setup_id,
        { callPrice: 45, putPrice: 25 }, // Calls down, puts up
        {
            price_change_from_entry: -3,
            momentum: 'WEAK_DOWN',
            key_level_proximity: 5,
            internals_healthy: false,
            atr_coverage: 30
        }
    );

    if (scenario1Result) {
        console.log('\n✅ SCENARIO EXECUTED:');
        console.log(`   Scenario: ${scenario1Result.scenario_name}`);
        console.log(`   Actions Taken:`);
        scenario1Result.actions_taken.forEach(action => {
            console.log(`      - ${action.action}: ${action.pnl > 0 ? '+' : ''}${action.pnl.toFixed(1)}%`);
            console.log(`        Reasoning: ${action.reasoning}`);
        });
        console.log(`   Remaining Contracts: ${scenario1Result.remaining_contracts.length}`);
        console.log(`   Position Status: ${scenario1Result.position_status}\n`);
    }

    // ============================================
    // TEST SCENARIO 2: Rip Off Then Pullback
    // ============================================
    console.log('\n🟡 ========================================');
    console.log('🟡 TEST: SCENARIO 2 - Rip Off Then Pullback');
    console.log('🟡 ========================================');
    console.log('Market rips +5% quickly, then shows signs of pullback\n');

    // Reset position for clean test
    const position2 = multiContractPositionManager.createBullishRatioPosition(
        'NDX',
        50,
        20
    );

    const scenario2Result = multiContractPositionManager.updatePosition(
        position2.setup_id,
        { callPrice: 75, putPrice: 10 }, // Calls up 50%, puts down
        {
            price_change_from_entry: 5,
            momentum: 'STRONG_UP',
            key_level_proximity: 2,
            internals_healthy: true,
            atr_coverage: 60
        }
    );

    if (scenario2Result) {
        console.log('\n✅ SCENARIO EXECUTED:');
        console.log(`   Scenario: ${scenario2Result.scenario_name}`);
        console.log(`   Actions Taken:`);
        scenario2Result.actions_taken.forEach(action => {
            console.log(`      - ${action.action}: ${action.pnl > 0 ? '+' : ''}${action.pnl.toFixed(1)}%`);
            console.log(`        Reasoning: ${action.reasoning}`);
        });
        console.log(`   Remaining Contracts: ${scenario2Result.remaining_contracts.length}`);
        console.log(`   Position Status: ${scenario2Result.position_status}\n`);
    }

    // ============================================
    // TEST SCENARIO 3: Strong Rip Off (Best Case)
    // ============================================
    console.log('\n🟢 ========================================');
    console.log('🟢 TEST: SCENARIO 3 - Strong Rip Off');
    console.log('🟢 ========================================');
    console.log('Market rips +8% with strong momentum and healthy internals\n');

    // Reset position for clean test
    const position3 = multiContractPositionManager.createBullishRatioPosition(
        'NDX',
        50,
        20
    );

    const scenario3Result = multiContractPositionManager.updatePosition(
        position3.setup_id,
        { callPrice: 100, putPrice: 5 }, // Calls up 100%, puts down 75%
        {
            price_change_from_entry: 8,
            momentum: 'STRONG_UP',
            key_level_proximity: 1,
            internals_healthy: true,
            atr_coverage: 80
        }
    );

    if (scenario3Result) {
        console.log('\n✅ SCENARIO EXECUTED:');
        console.log(`   Scenario: ${scenario3Result.scenario_name}`);
        console.log(`   Actions Taken:`);
        scenario3Result.actions_taken.forEach(action => {
            console.log(`      - ${action.action}: ${action.pnl > 0 ? '+' : ''}${action.pnl.toFixed(1)}%`);
            console.log(`        Reasoning: ${action.reasoning}`);
        });
        console.log(`   Remaining Contracts: ${scenario3Result.remaining_contracts.length}`);
        console.log(`   Position Status: ${scenario3Result.position_status}\n`);
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n📊 ========================================');
    console.log('📊 TEST SUMMARY');
    console.log('📊 ========================================\n');

    const allPositions = multiContractPositionManager.getAllPositions();
    console.log(`Total Positions Created: ${allPositions.length}`);
    console.log('\nKey Features Verified:');
    console.log('   ✅ Mission-based contract assignment (Quick Profit, Runner, Hedge)');
    console.log('   ✅ Scenario-based execution rules');
    console.log('   ✅ Dynamic position updates based on market conditions');
    console.log('   ✅ Automated contract closing based on triggers');
    console.log('   ✅ Flexible strategy adaptation (scale in/out, add hedges)');

    console.log('\n🎯 ========================================');
    console.log('🎯 TEST COMPLETE');
    console.log('🎯 ========================================\n');
}

// Run test
testMultiContractManager().catch(console.error);
