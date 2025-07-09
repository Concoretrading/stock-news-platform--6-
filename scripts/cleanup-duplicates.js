// Quick script to clean up duplicate stock entries
// Run with: node scripts/cleanup-duplicates.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function cleanupDuplicates() {
  try {
    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert(require('../concorenews-firebase-adminsdk.json'))
    });
    
    const db = getFirestore(app);
    console.log('🔧 Connected to Firestore');
    
    // Get all stocks for test user
    const userId = 'test-user-localhost';
    const stocksSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .get();
    
    console.log(`📊 Found ${stocksSnap.docs.length} total stocks for user ${userId}`);
    
    // Group stocks by ticker
    const stocksByTicker = new Map();
    stocksSnap.docs.forEach(doc => {
      const data = doc.data();
      const ticker = data.ticker;
      if (!stocksByTicker.has(ticker)) {
        stocksByTicker.set(ticker, []);
      }
      stocksByTicker.set(ticker, [...stocksByTicker.get(ticker), { id: doc.id, ...data }]);
    });
    
    console.log(`📈 Found stocks for ${stocksByTicker.size} unique tickers`);
    
    let duplicatesRemoved = 0;
    let duplicateTickers = [];
    
    // For each ticker with multiple entries, keep the newest and delete the rest
    for (const [ticker, stocks] of stocksByTicker.entries()) {
      if (stocks.length > 1) {
        console.log(`🔍 Found ${stocks.length} duplicate entries for ${ticker}`);
        duplicateTickers.push(ticker);
        
        // Sort by createdAt (newest first) and keep the first one
        stocks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const stocksToDelete = stocks.slice(1); // All except the newest
        
        console.log(`  ✅ Keeping: ${stocks[0].id} (${stocks[0].createdAt})`);
        
        for (const stock of stocksToDelete) {
          try {
            await db.collection('stocks').doc(stock.id).delete();
            duplicatesRemoved++;
            console.log(`  🗑️ Deleted: ${stock.id} (${stock.createdAt})`);
          } catch (error) {
            console.error(`  ❌ Failed to delete ${stock.id}:`, error);
          }
        }
      }
    }
    
    console.log('\n🎉 Cleanup completed!');
    console.log(`📊 Removed ${duplicatesRemoved} duplicate entries`);
    console.log(`📈 Affected tickers: ${duplicateTickers.join(', ')}`);
    
    // Verify cleanup
    const finalSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .get();
    
    console.log(`✅ Final count: ${finalSnap.docs.length} stocks remaining`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDuplicates(); 