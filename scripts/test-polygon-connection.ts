import polygonClient from '../lib/services/polygon-client';

async function testPolygonConnection() {
  try {
    console.log('🧪 TESTING POLYGON.IO CONNECTION');
    console.log('================================');

    // 1. Test real-time data
    console.log('\n📊 Testing real-time data...');
    const realTimeData = await polygonClient.getRealtimeData('AAPL');
    console.log(`✅ Real-time data points retrieved: ${realTimeData.length}`);

    // 2. Test delayed quote
    console.log('\n📝 Testing stock details/delayed quote...');
    const stockDetails = await polygonClient.getDelayedQuote('AAPL');
    console.log(`✅ Stock details success: AAPL is at $${stockDetails.price}`);

    // 3. Test historical data
    console.log('\n📚 Testing historical data...');
    const historicalData = await polygonClient.getHistoricalData('AAPL', 5);
    console.log(`✅ Historical data points retrieved: ${historicalData.length}`);

    // 4. Test market status
    console.log('\n🏛️ Testing market status...');
    const marketStatus = await polygonClient.getMarketStatus();
    console.log(`✅ Market status: ${marketStatus ? marketStatus.market : 'Unknown'}`);

    // 5. Build advanced premium stubs
    console.log('\n🎯 Testing advanced option patterns...');
    const advOpts = await polygonClient.analyzeAdvancedPremiumDynamics('AAPL', 200);
    console.log(`✅ Advanced Premium Dynamics: ${advOpts.premiumFlowPrediction}`);

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Your $79 Polygon.io Advanced Connection is working perfectly!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

testPolygonConnection();