import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export async function fetchNews(userId: string, params?: {
  ticker?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const { ticker, fromDate, toDate } = params || {};

  let catalystsQuery = db.collection('catalysts').where('userId', '==', userId);
  if (ticker) {
    catalystsQuery = catalystsQuery.where('stockTickers', 'array-contains', ticker.toUpperCase());
  }
  if (fromDate) {
    catalystsQuery = catalystsQuery.where('date', '>=', fromDate);
  }
  if (toDate) {
    catalystsQuery = catalystsQuery.where('date', '<=', toDate);
  }

  // Firestore does not support multiple orderBy on different fields unless they are indexed
  const catalystsSnap = await catalystsQuery.orderBy('date', 'desc').get();
  return catalystsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getManualNews(userId: string, params?: {
  ticker?: string;
  query?: string;
}) {
  const { ticker, query } = params || {};

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

export async function addManualNews(userId: string, data: {
  stockSymbol: string;
  headline: string;
  body: string;
  date: string;
  imageUrl?: string;
  priceBefore?: number;
  priceAfter?: number;
  source?: string;
}) {
  const { stockSymbol, headline, body: newsBody, date, imageUrl, priceBefore, priceAfter, source } = data;

  if (!stockSymbol || !headline || !newsBody || !date) {
    throw new Error('Missing required fields');
  }

  const normalizedDate = new Date(date);
  if (isNaN(normalizedDate.getTime())) {
    throw new Error('Invalid date format');
  }

  const catalystDoc = await db.collection('catalysts').add({
    userId,
    stockTickers: [stockSymbol.toUpperCase()],
    title: headline,
    description: newsBody,
    date: normalizedDate.toISOString(),
    imageUrl: imageUrl || null,
    priceBefore: priceBefore || null,
    priceAfter: priceAfter || null,
    source: source || 'Manual Entry',
    isManual: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return catalystDoc.id;
} 