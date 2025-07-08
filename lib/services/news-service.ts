import { getFirestore } from '@/lib/firebase-admin';

// Helper function to get database safely
async function getDatabase() {
  return await getFirestore();
}

export async function fetchNews(userId: string, filters?: { ticker?: string; fromDate?: string; toDate?: string }) {
  try {
    const db = await getDatabase();
    
    let query = db.collection('catalysts').where('userId', '==', userId);
    
    if (filters?.ticker) {
      query = query.where('stockTickers', 'array-contains', filters.ticker.toUpperCase());
    }
    
    const snapshot = await query.orderBy('date', 'desc').limit(50).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}

export async function getManualNews(userId: string, params?: {
  ticker?: string;
  query?: string;
}) {
  const { ticker, query } = params || {};

     const db = await getDatabase();
   let catalystsQuery = db.collection('catalysts')
     .where('userId', '==', userId)
     .where('isManual', '==', true);

  if (ticker) {
    catalystsQuery = catalystsQuery.where('stockTickers', 'array-contains', ticker.toUpperCase());
  }

  // Firestore does not support full text search natively, so 'query' is ignored unless you use a 3rd party search
  const catalystsSnap = await catalystsQuery.orderBy('createdAt', 'desc').get();
  return catalystsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addManualNews(userId: string, newsData: any) {
  try {
    const db = await getDatabase();
    
    const catalystDoc = await db.collection('catalysts').add({
      userId,
      stockTickers: [newsData.stockSymbol.toUpperCase()],
      title: newsData.headline,
      description: newsData.body || null,
      date: new Date(newsData.date).toISOString().split('T')[0],
      imageUrl: newsData.imagePath || null,
      isManual: true,
      createdAt: new Date().toISOString(),
      priceBefore: newsData.priceBefore ? Number(newsData.priceBefore) : null,
      priceAfter: newsData.priceAfter ? Number(newsData.priceAfter) : null,
      source: newsData.source || null,
    });
    
    return catalystDoc.id;
  } catch (error) {
    console.error('Error adding manual news:', error);
    throw error;
  }
} 