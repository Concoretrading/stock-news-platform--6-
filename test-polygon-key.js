
const { PolygonDataProvider } = require('./lib/services/polygon-data-provider');
require('dotenv').config({ path: './env.local' });

async function test() {
    console.log('🧪 Testing Polygon API Connection...');
    const provider = PolygonDataProvider.getInstance();
    const success = await provider.testConnection();

    if (success) {
        console.log('✅ Connection Successful!');

        // Try to get some real data
        console.log('📊 Fetching AAPL daily bars for the last 2 days...');
        const data = await provider.getMultiDayData('AAPL', 'day', '2024-02-20', '2024-02-21');

        if (data && data.length > 0) {
            console.log(`📈 Received ${data.length} bars.`);
            console.log('Sample bar:', data[0]);
        } else {
            console.log('⚠️ No bars returned (might be a weekend or holiday, but connection works).');
        }
    } else {
        console.log('❌ Connection Failed. Check your API key and plan limits.');
    }
}

test();
