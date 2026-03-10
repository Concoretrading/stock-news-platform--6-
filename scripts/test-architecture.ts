import { systemBus, SystemEvent } from '../lib/central-command/communication-hub';
import { realTimeManager } from '../lib/managers/real-time-manager';
import { executionManager } from '../lib/managers/execution-manager';
import { reviewManager } from '../lib/managers/review-manager';
import { historicalManager } from '../lib/managers/historical-manager';

// Function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runSimulation() {
    console.log('🚀 STARTING ARCHITECTURE MOCK SIMULATION\n');

    // 1. Simulate Market Data Stream (Trigger Real-Time Manager)
    console.log('--- STEP 1: INJECTING MARKET DATA ---');
    systemBus.emitEvent(SystemEvent.MARKET_DATA_UPDATE, {
        ticker: 'AAPL',
        price: 150.25,
        timestamp: new Date().toISOString(),
        source: 'POLYGON'
    });

    await wait(1000);

    // 2. Simulate Trade Closing (Trigger Review Manager)
    // In a real app, ExecutionManager would track open trades and eventually emit TRADE_CLOSED
    // For this test, we manually emit it to verify ReviewManager picking it up
    console.log('\n--- STEP 2: SIMULATING CLOSED TRADE ---');
    const tradeId = `TRD-${Date.now()}`;

    systemBus.emitEvent(SystemEvent.TRADE_CLOSED, {
        tradeId,
        ticker: 'AAPL',
        entryPrice: 150.25,
        exitPrice: 155.00,
        pnl: 475.00,
        duration: 3600
    });

    await wait(1000);

    // 3. Print Logs
    console.log('\n--- STEP 3: VERIFICATION LOGS ---');
    const logs = systemBus.getRecentLogs(10);
    logs.forEach(log => {
        console.log(`[${log.timestamp.split('T')[1].split('.')[0]}] ${log.event}`);
    });

    console.log('\n✅ SIMULATION COMPLETE');
}

runSimulation().catch(console.error);
