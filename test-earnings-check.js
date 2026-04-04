const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDrIGsjp8g4F21nGQFEagul8mbSa8QAVK0",
  authDomain: "concorenews.firebaseapp.com",
  projectId: "concorenews",
  storageBucket: "concorenews.appspot.com",
  messagingSenderId: "218212797722",
  appId: "1:218212797722:web:4cf9e869f92ccd07edb0a3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkEarnings() {
  try {
    console.log('🔍 Checking earnings in database...');
    
    const eventsRef = collection(db, 'earnings_calendar');
    
    // Get all earnings
    const querySnapshot = await getDocs(eventsRef);
    console.log(`📊 Found ${querySnapshot.size} total earnings events`);
    
    if (querySnapshot.empty) {
      console.log('❌ No earnings found in database');
      return;
    }
    
    // Group by month
    const earningsByMonth = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📅 Event: ${data.stockTicker} - ${data.earningsDate}`);
      
      let eventDate;
      if (typeof data.earningsDate === 'string') {
        eventDate = new Date(data.earningsDate);
      } else if (data.earningsDate instanceof Date) {
        eventDate = data.earningsDate;
      } else if (data.earningsDate?.toDate) {
        eventDate = data.earningsDate.toDate();
      } else {
        console.log(`⚠️ Unknown date format for ${data.stockTicker}:`, data.earningsDate);
        return;
      }
      
      const monthKey = eventDate.toISOString().slice(0, 7); // YYYY-MM
      if (!earningsByMonth[monthKey]) {
        earningsByMonth[monthKey] = [];
      }
      earningsByMonth[monthKey].push({
        ticker: data.stockTicker,
        date: eventDate.toISOString().slice(0, 10),
        company: data.companyName
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
    
  } catch (error) {
    console.error('❌ Error checking earnings:', error);
  }
}

checkEarnings(); 