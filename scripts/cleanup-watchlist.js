// Simple script to clean up duplicate GOOG entries
// Run with: node scripts/cleanup-watchlist.js

async function cleanup() {
  console.log('🧹 Starting manual cleanup...');
  
  const response = await fetch('http://localhost:3002/api/watchlist', {
    headers: {
      'Authorization': 'Bearer dev-token-localhost'
    }
  });
  
  const result = await response.json();
  if (!result.success) {
    console.error('❌ Failed to get watchlist:', result.error);
    return;
  }
  
  console.log(`📊 Current watchlist has ${result.data.length} entries`);
  
  // Group by ticker
  const byTicker = {};
  result.data.forEach(stock => {
    if (!byTicker[stock.ticker]) {
      byTicker[stock.ticker] = [];
    }
    byTicker[stock.ticker].push(stock);
  });
  
  // Find duplicates
  let duplicatesRemoved = 0;
  for (const [ticker, stocks] of Object.entries(byTicker)) {
    if (stocks.length > 1) {
      console.log(`🔍 Found ${stocks.length} duplicate ${ticker} entries`);
      
      // Keep the newest, remove the rest
      stocks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const toDelete = stocks.slice(1);
      
      for (const stock of toDelete) {
        console.log(`🗑️ Deleting ${ticker}: ${stock.id}`);
        
        const deleteResponse = await fetch(`http://localhost:3002/api/watchlist?id=${stock.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer dev-token-localhost'
          }
        });
        
        const deleteResult = await deleteResponse.json();
        if (deleteResult.success) {
          duplicatesRemoved++;
          console.log(`✅ Deleted ${ticker} duplicate`);
        } else {
          console.error(`❌ Failed to delete ${ticker}:`, deleteResult.error);
        }
      }
    }
  }
  
  console.log(`🎉 Cleanup complete! Removed ${duplicatesRemoved} duplicates`);
}

cleanup().catch(console.error); 