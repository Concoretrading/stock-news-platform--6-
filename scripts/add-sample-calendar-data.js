const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'concorenews'
  });
}

const db = admin.firestore();

async function addSampleCalendarData() {
  console.log('🗓️ Adding sample calendar events...');
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  const sampleEvents = [
    // Sample earnings events
    {
      stockTicker: 'AAPL',
      companyName: 'Apple Inc.',
      earningsDate: tomorrow,
      earningsType: 'AMC',
      isConfirmed: true,
      estimatedEPS: 1.95,
      estimatedRevenue: 123000000000,
      source: 'sample_data',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      stockTicker: 'MSFT',
      companyName: 'Microsoft Corporation',
      earningsDate: nextWeek,
      earningsType: 'BMO',
      isConfirmed: true,
      estimatedEPS: 2.45,
      estimatedRevenue: 65000000000,
      source: 'sample_data',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // Sample economic events
    {
      date: formatDate(today),
      ticker: 'CPI',
      company_name: 'Consumer Price Index (CPI)',
      event_type: 'Monthly Inflation Data (8:30 AM ET) - Major Market Mover',
      confirmed: true,
      auto_generated: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      date: formatDate(tomorrow),
      ticker: 'PPI',
      company_name: 'Producer Price Index (PPI)',
      event_type: 'Producer Inflation MoM & YoY (8:30 AM ET) - Inflation Pipeline',
      confirmed: true,
      auto_generated: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  const batch = db.batch();
  
  sampleEvents.forEach((event, index) => {
    const docRef = db.collection('earnings_calendar').doc();
    batch.set(docRef, event);
    console.log(`📅 Adding: ${event.stockTicker || event.ticker} - ${event.companyName || event.company_name}`);
  });
  
  try {
    await batch.commit();
    console.log('✅ Sample calendar events added successfully!');
    console.log('🔍 You should now see events in your calendar Events tab');
  } catch (error) {
    console.error('❌ Error adding sample events:', error);
  }
}

// Run the script
addSampleCalendarData()
  .then(() => {
    console.log('📊 Calendar data ready for testing!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  }); 