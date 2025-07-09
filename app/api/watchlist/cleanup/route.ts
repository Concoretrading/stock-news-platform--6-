import { NextRequest, NextResponse } from 'next/server'
import { getAuth, getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/watchlist/cleanup - Remove duplicate stocks from watchlist
export async function POST(request: NextRequest) {
  try {
    const db = await getFirestore();
    
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    
    let userId: string;
    
    // Development bypass for localhost
    if (idToken === 'dev-token-localhost') {
      userId = 'test-user-localhost';
      console.log('🔧 Development mode - running cleanup for test user');
    } else {
      let decodedToken;
      try {
        decodedToken = await (await getAuth()).verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    console.log('🧹 Running duplicate cleanup for user:', userId);
    
    // Get all stocks for user
    const allStocksSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .get();
    
    // Group stocks by ticker
    const stocksByTicker = new Map();
    allStocksSnap.docs.forEach(doc => {
      const data = doc.data();
      const ticker = data.ticker;
      if (!stocksByTicker.has(ticker)) {
        stocksByTicker.set(ticker, []);
      }
      stocksByTicker.set(ticker, [...stocksByTicker.get(ticker), { id: doc.id, ...data }]);
    });
    
    let duplicatesRemoved = 0;
    let duplicateTickers = [];
    
    // For each ticker with multiple entries, keep the newest and delete the rest
    for (const [ticker, stocks] of stocksByTicker.entries()) {
      if (stocks.length > 1) {
        console.log(`🧹 Found ${stocks.length} duplicate entries for ${ticker}`);
        duplicateTickers.push(ticker);
        
        // Sort by createdAt (newest first) and keep the first one
        stocks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const stocksToDelete = stocks.slice(1); // All except the newest
        
        for (const stock of stocksToDelete) {
          try {
            await db.collection('stocks').doc(stock.id).delete();
            duplicatesRemoved++;
            console.log(`🗑️ Deleted duplicate ${ticker} entry:`, stock.id);
          } catch (error) {
            console.error(`❌ Failed to delete duplicate ${ticker}:`, error);
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleanup completed. Removed ${duplicatesRemoved} duplicate entries for: ${duplicateTickers.join(', ')}`,
      duplicatesRemoved,
      duplicateTickers
    });
    
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    return NextResponse.json({ success: false, error: 'Failed to cleanup duplicates' }, { status: 500 });
  }
} 