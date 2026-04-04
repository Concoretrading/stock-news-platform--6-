const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./concorenews-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'concorenews'
});

const db = admin.firestore();

async function checkEarnings() {
  try {
    console.log('🔍 Checking earnings in database using Admin SDK...');
    
    const earningsRef = db.collection('earnings_calendar');
    const snapshot = await earningsRef.get();
    
    console.log(`📊 Found ${snapshot.size} total earnings events`);
    
    if (snapshot.empty) {
      console.log('❌ No earnings found in database');
      return;
    }
    
    // Group by month
    const earningsByMonth = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📅 Event: ${data.stockTicker || data.ticker} - ${data.earningsDate} (${data.companyName || data.company_name})`);
      
      let eventDate;
      if (typeof data.earningsDate === 'string') {
        eventDate = new Date(data.earningsDate);
      } else if (data.earningsDate instanceof Date) {
        eventDate = data.earningsDate;
      } else if (data.earningsDate?.toDate) {
        eventDate = data.earningsDate.toDate();
      } else {
        console.log(`⚠️ Unknown date format for ${data.stockTicker || data.ticker}:`, data.earningsDate);
        return;
      }
      
      const monthKey = eventDate.toISOString().slice(0, 7); // YYYY-MM
      if (!earningsByMonth[monthKey]) {
        earningsByMonth[monthKey] = [];
      }
      earningsByMonth[monthKey].push({
        ticker: data.stockTicker || data.ticker,
        date: eventDate.toISOString().slice(0, 10),
        company: data.companyName || data.company_name
      });
    });
    
    console.log('\n📅 Earnings by month:');
    Object.keys(earningsByMonth).sort().forEach(month => {
      console.log(`\n${month}: ${earningsByMonth[month].length} events`);
      earningsByMonth[month].forEach(event => {
        console.log(`  - ${event.ticker}: ${event.date} (${event.company})`);
      });
    });
    
    // Check specifically for August 2025
    const august2025 = earningsByMonth['2025-08'] || [];
    console.log(`\n🎯 August 2025 earnings: ${august2025.length} events`);
    august2025.forEach(event => {
      console.log(`  - ${event.ticker}: ${event.date} (${event.company})`);
    });
    
    // Check for any 2025 earnings
    const all2025 = Object.keys(earningsByMonth).filter(month => month.startsWith('2025-'));
    console.log(`\n📈 Total 2025 earnings: ${all2025.reduce((sum, month) => sum + earningsByMonth[month].length, 0)} events`);
    all2025.forEach(month => {
      console.log(`  ${month}: ${earningsByMonth[month].length} events`);
    });
    
  } catch (error) {
    console.error('❌ Error checking earnings:', error);
  } finally {
    process.exit(0);
  }
}

checkEarnings(); 