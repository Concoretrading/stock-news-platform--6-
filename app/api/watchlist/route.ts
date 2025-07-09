import { NextRequest, NextResponse } from 'next/server'
import { getAuth, getFirestore } from '@/lib/firebase-admin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/watchlist - Get user's watchlist
export async function GET(request: NextRequest) {
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
      console.log('🔧 Development mode - using test user for watchlist GET');
    } else {
      let decodedToken;
      try {
        decodedToken = await (await getAuth()).verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    const stocksSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const stocks = stocksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({ success: true, data: stocks });
  } catch (error) {
    console.error('Error getting watchlist:', error);
    return NextResponse.json({ success: false, error: 'Failed to get watchlist' }, { status: 500 });
  }
}

// POST /api/watchlist - Add stock to watchlist
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
      console.log('🔧 Development mode - using test user for watchlist POST');
    } else {
      let decodedToken;
      try {
        decodedToken = await (await getAuth()).verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    const body = await request.json();
    const { ticker, companyName, cleanup } = body;

    // Special cleanup endpoint to remove duplicates
    if (cleanup === true) {
      console.log('🧹 Running duplicate cleanup for user:', userId);
      
      // Get all stocks for user grouped by ticker
      const allStocksSnap = await db.collection('stocks')
        .where('userId', '==', userId)
        .get();
      
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
      
      // For each ticker with multiple entries, keep the newest and delete the rest
      const tickerEntries = Array.from(stocksByTicker.entries());
      for (let i = 0; i < tickerEntries.length; i++) {
        const [ticker, stocks] = tickerEntries[i];
        if (stocks.length > 1) {
          console.log(`🧹 Found ${stocks.length} duplicate entries for ${ticker}`);
          
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
        message: `Cleanup completed. Removed ${duplicatesRemoved} duplicate entries.`,
        duplicatesRemoved 
      });
    }

    if (!ticker || !companyName) {
      return NextResponse.json({ success: false, error: 'Ticker and company name are required' }, { status: 400 });
    }

    // Check if stock already exists for this user
    const existingStockSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .where('ticker', '==', ticker.toUpperCase())
      .get();
    
    if (!existingStockSnap.empty) {
      return NextResponse.json({ success: false, error: 'Stock already in watchlist' }, { status: 400 });
    }

    const stockData = {
      userId,
      ticker: ticker.toUpperCase(),
      companyName,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('stocks').add(stockData);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: `${ticker.toUpperCase()} added to watchlist` 
    });
  } catch (error) {
    console.error('Error adding stock to watchlist:', error);
    return NextResponse.json({ success: false, error: 'Failed to add stock to watchlist' }, { status: 500 });
  }
}

// DELETE /api/watchlist/{id} - Remove stock from watchlist
export async function DELETE(request: NextRequest) {
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
      console.log('🔧 Development mode - using test user for watchlist DELETE');
    } else {
      let decodedToken;
      try {
        decodedToken = await (await getAuth()).verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
      }
      userId = decodedToken.uid;
    }

    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get('id');

    if (!stockId) {
      return NextResponse.json({ success: false, error: 'Stock ID is required' }, { status: 400 });
    }

    // Verify the stock belongs to the user before deleting
    const stockDoc = await db.collection('stocks').doc(stockId).get();
    if (!stockDoc.exists) {
      return NextResponse.json({ success: false, error: 'Stock not found' }, { status: 404 });
    }

    const stockData = stockDoc.data();
    if (stockData?.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Not authorized to delete this stock' }, { status: 403 });
    }

    await db.collection('stocks').doc(stockId).delete();
    
    return NextResponse.json({ success: true, message: 'Stock removed from watchlist' });
  } catch (error) {
    console.error('Error removing stock from watchlist:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove stock from watchlist' }, { status: 500 });
  }
} 