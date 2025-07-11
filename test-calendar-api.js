const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./concorenews-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'concorenews'
});

const db = admin.firestore();

async function testCalendarAPI() {
  try {
    console.log('🔍 Testing calendar API for August 2025...');
    
    // Simulate what the calendar component does
    const startDate = '2025-08-01';
    const endDate = '2025-08-31';
    
    console.log(`📅 Fetching earnings for date range: ${startDate} to ${endDate}`);
    
    const earningsRef = db.collection('earnings_calendar');
    const earningsQuery = earningsRef
      .where('earningsDate', '>=', startDate)
      .where('earningsDate', '<=', endDate);
    
    const earningsSnapshot = await earningsQuery.get();
    
    console.log(`📊 Found ${earningsSnapshot.size} earnings events for August 2025`);
    
    if (earningsSnapshot.empty) {
      console.log('❌ No August 2025 earnings found');
      return;
    }
    
    const events = {};
    
    earningsSnapshot.forEach((doc) => {
      const eventData = doc.data();
      console.log(`📅 Event: ${eventData.stockTicker || eventData.ticker} - ${eventData.earningsDate} (${eventData.companyName || eventData.company_name})`);
      
      const event = {
        id: doc.id,
        date: eventData.earningsDate,
        ticker: eventData.stockTicker || eventData.ticker || 'STOCK',
        company_name: eventData.companyName || eventData.company_name || 'Company',
        event_type: eventData.earningsType || 'Earnings',
        confirmed: eventData.isConfirmed || false,
        auto_generated: eventData.auto_generated || false,
        created_at: eventData.created_at,
        logoUrl: eventData.logoUrl,
        type: 'earnings'
      };
      
      if (!events[event.date]) {
        events[event.date] = [];
      }
      events[event.date].push(event);
    });
    
    console.log('\n📅 Events by date:');
    Object.keys(events).sort().forEach(date => {
      console.log(`\n${date}: ${events[date].length} events`);
      events[date].forEach(event => {
        console.log(`  - ${event.ticker}: ${event.company_name} (${event.event_type})`);
      });
    });
    
    console.log(`\n✅ Calendar API test successful! Found ${earningsSnapshot.size} August 2025 earnings events.`);
    
  } catch (error) {
    console.error('❌ Error testing calendar API:', error);
  } finally {
    process.exit(0);
  }
}

testCalendarAPI(); 