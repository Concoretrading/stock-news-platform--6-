import { adminDb } from '@/lib/firebase-admin';

// Helper function to get database safely
async function getDatabase() {
  return adminDb;
}

/**
 * Fetches catalysts for a specific user and optional filters.
 * Replaces the old 'fetchNews' function.
 */
export async function fetchCatalysts(userId: string, filters?: { ticker?: string; fromDate?: string; toDate?: string }) {
  try {
    const db = await getDatabase();

    let query = db.collection('catalysts').where('userId', '==', userId);

    if (filters?.ticker) {
      query = query.where('stockTickers', 'array-contains', filters.ticker.toUpperCase());
    }

    const snapshot = await query.orderBy('date', 'desc').limit(300).get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching catalysts:', error);
    throw error;
  }
}

/**
 * Retrieves manually entered catalysts.
 * Replaces 'getManualNews'.
 */
export async function getManualCatalysts(userId: string, params?: {
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

  const catalystsSnap = await catalystsQuery.orderBy('createdAt', 'desc').get();
  return catalystsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Adds a new catalyst to the system.
 * Replaces 'addManualNews'.
 */
export async function addCatalyst(userId: string, catalystData: any) {
  try {
    const db = await getDatabase();

    const catalystDoc = await db.collection('catalysts').add({
      userId,
      stockTickers: [catalystData.stockSymbol.toUpperCase()],
      title: catalystData.headline || catalystData.title,
      description: catalystData.body || catalystData.description || null,
      date: new Date(catalystData.date).toISOString().split('T')[0],
      imageUrl: catalystData.imagePath || catalystData.imageUrl || null,
      isManual: true,
      createdAt: new Date().toISOString(),
      priceBefore: catalystData.priceBefore ? Number(catalystData.priceBefore) : null,
      priceAfter: catalystData.priceAfter ? Number(catalystData.priceAfter) : null,
      source: catalystData.source || null,
      processedBy: 'PredatorCatalystProcessor'
    });

    return catalystDoc.id;
  } catch (error) {
    console.error('Error adding catalyst:', error);
    throw error;
  }
}