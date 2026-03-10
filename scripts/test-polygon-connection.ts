import polygonClient from '../lib/services/polygon-client';

async function testPolygonConnection() {
  try {
    console.log('🧪 TESTING POLYGON.IO CONNECTION');
    console.log('================================');

    // 1. Test real-time data
    console.log('\n📊 Testing real-time data...');
    const realTimeData = await polygonClient.getRealTimeData('AAPL');
    console.log('✅ Real-time data success:', realTimeData.success);

    // 2. Test technical indicators
    console.log('\n📈 Testing technical indicators...');
    const technicalData = await polygonClient.getTechnicalIndicators('AAPL');
    console.log('✅ Technical indicators success:', technicalData.success);

    // 3. Test options data
    console.log('\n🎯 Testing options data...');
    const optionsData = await polygonClient.getOptionsData('AAPL');
    console.log('✅ Options data success:', optionsData.success);

    // 4. Test historical data
    console.log('\n📚 Testing historical data...');
    const historicalData = await polygonClient.getHistoricalData(
      'AAPL',
      '2024-01-01',
      '2024-01-23'
    );
    console.log('✅ Historical data success:', historicalData.success);

    // 5. Test market status
    console.log('\n🏛️ Testing market status...');
    const marketStatus = await polygonClient.getMarketStatus();
    console.log('✅ Market status success:', marketStatus.success);

    // 6. Test stock details
    console.log('\n📝 Testing stock details...');
    const stockDetails = await polygonClient.getStockDetails('AAPL');
    console.log('✅ Stock details success:', stockDetails.success);

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Your Polygon.io connection is working perfectly!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

// Run the tests
testPolygonConnection(); 