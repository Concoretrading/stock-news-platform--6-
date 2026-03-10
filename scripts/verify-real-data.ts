import { polygonDataProvider } from '../lib/services/polygon-data-provider';
import { SystematicTrainingEngine } from '../lib/services/systematic-training-engine';

async function verify() {
    console.log('🧪 VERIFYING REAL DATA INTEGRATION');

    // 1. Test Polygon Connection directly
    console.log('\n--- STEP 1: Testing Polygon Connection ---');
    const isConnected = await polygonDataProvider.testConnection();
    if (!isConnected) {
        console.error('❌ Polygon Connection FAILED');
        process.exit(1);
    }
    console.log('✅ Polygon Connection SUCCESS');

    // 2. Test Systematic Training Engine Initiation
    console.log('\n--- STEP 2: Testing Training Engine Initiation ---');
    const engine = SystematicTrainingEngine.getInstance();

    try {
        const session = await engine.startTraining('SPY', 1); // 1 month for speed
        console.log(`✅ Training Session Created: ${session.session_id}`);
        console.log(`   Status: ${session.current_status}`);
        console.log(`   Pillars: ${session.pillars_to_train.join(', ')}`);
    } catch (error) {
        console.error('❌ Training Engine Failed:', error);
        process.exit(1);
    }

    console.log('\n🎉 REAL DATA INTEGRATION VERIFIED');
}

verify();
