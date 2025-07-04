// cleanup-watchlist.js
const admin = require('firebase-admin');
const path = require('path');

// Update this path to your service account JSON file
const serviceAccount = require(path.resolve(__dirname, '../lib/firebase-admin-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function trimWatchlists() {
  const stocksSnapshot = await db.collection('stocks').get();
  const userStocksMap = {};

  // Group stocks by userId
  stocksSnapshot.forEach(doc => {
    const data = doc.data();
    if (!userStocksMap[data.userId]) userStocksMap[data.userId] = [];
    userStocksMap[data.userId].push({ id: doc.id, createdAt: data.createdAt });
  });

  // For each user, trim to 10 stocks
  for (const userId in userStocksMap) {
    const stocks = userStocksMap[userId];
    if (stocks.length > 10) {
      // Sort by createdAt descending (most recent first)
      stocks.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      const toDelete = stocks.slice(10);
      for (const stock of toDelete) {
        await db.collection('stocks').doc(stock.id).delete();
        console.log(`Deleted stock ${stock.id} for user ${userId}`);
      }
    }
  }
  console.log('Watchlist cleanup complete!');
}

trimWatchlists().catch(console.error); 