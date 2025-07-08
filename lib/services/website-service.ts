import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export async function getWebsiteMonitoring(stockTicker?: string) {
  let query = db.collection('website_monitoring');

  if (stockTicker) {
    query = query.where('stockTicker', '==', stockTicker.toUpperCase()) as any;
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function addWebsiteMonitoring(userId: string, data: {
  stockTicker: string;
  companyName: string;
  websiteUrl: string;
  scanFrequencyHours?: number;
}) {
  const { stockTicker, companyName, websiteUrl, scanFrequencyHours = 24 } = data;

  if (!stockTicker || !companyName || !websiteUrl) {
    throw new Error('Stock ticker, company name, and website URL are required');
  }

  // Check if website monitoring already exists for this stock
  const existingSnap = await db.collection('website_monitoring')
    .where('stockTicker', '==', stockTicker.toUpperCase())
    .get();

  if (!existingSnap.empty) {
    throw new Error('Website monitoring already exists for this stock');
  }

  // Create new website monitoring entry
  const websiteMonitoring = {
    stockTicker: stockTicker.toUpperCase(),
    companyName,
    websiteUrl,
    isActive: true,
    lastScanAt: null,
    lastContentHash: null,
    scanFrequencyHours,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdByUserId: userId
  };

  const docRef = await db.collection('website_monitoring').add(websiteMonitoring);
  return {
    id: docRef.id,
    ...websiteMonitoring
  };
}

export async function updateWebsiteMonitoring(id: string, updates: any) {
  if (!id) {
    throw new Error('Website monitoring ID is required');
  }

  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await db.collection('website_monitoring').doc(id).update(updateData);
}

export async function deleteWebsiteMonitoring(id: string) {
  if (!id) {
    throw new Error('Website monitoring ID is required');
  }

  await db.collection('website_monitoring').doc(id).delete();
} 