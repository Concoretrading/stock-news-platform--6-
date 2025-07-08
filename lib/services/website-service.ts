import { getFirestore } from '@/lib/firebase-admin';

// Helper function to get database safely
async function getDatabase() {
  return await getFirestore();
}

export async function scanWebsite(userId: string, stockTicker: string, websiteUrl: string) {
  try {
    const db = await getDatabase();
    
    // Simple mock website scanning
    const result = {
      success: true,
      contentFound: 0,
      message: 'Website scanning not implemented yet'
    };
    
    return result;
  } catch (error) {
    console.error('Error scanning website:', error);
    throw error;
  }
}

export async function getWebsiteMonitoring(userId: string) {
  try {
    const db = await getDatabase();
    
    const monitoringSnap = await db.collection('website_monitoring')
      .where('userId', '==', userId)
      .get();
    
    return monitoringSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching website monitoring:', error);
    throw error;
  }
}

interface WebsiteMonitoring {
  id?: string;
  stockTicker: string;
  companyName: string;
  websiteUrl: string;
  isActive: boolean;
  lastScanAt: string | null;
  lastContentHash: string | null;
  scanFrequencyHours: number;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
}

interface WebsiteMonitoringUpdate {
  isActive?: boolean;
  lastScanAt?: string | null;
  lastContentHash?: string | null;
  scanFrequencyHours?: number;
  websiteUrl?: string;
}

export async function addWebsiteMonitoring(userId: string, data: {
  stockTicker: string;
  companyName: string;
  websiteUrl: string;
  scanFrequencyHours?: number;
}): Promise<WebsiteMonitoring> {
  const { stockTicker, companyName, websiteUrl, scanFrequencyHours = 24 } = data;

  if (!stockTicker || !companyName || !websiteUrl) {
    throw new Error('Stock ticker, company name, and website URL are required');
  }

  // Check if website monitoring already exists for this stock
  const db = await getDatabase();
  const existingSnap = await db.collection('website_monitoring')
    .where('stockTicker', '==', stockTicker.toUpperCase())
    .get();

  if (!existingSnap.empty) {
    throw new Error('Website monitoring already exists for this stock');
  }

  // Create new website monitoring entry
  const websiteMonitoring: Omit<WebsiteMonitoring, 'id'> = {
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

export async function updateWebsiteMonitoring(id: string, updates: WebsiteMonitoringUpdate): Promise<void> {
  if (!id) {
    throw new Error('Website monitoring ID is required');
  }

  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const db = await getDatabase();
  await db.collection('website_monitoring').doc(id).update(updateData);
}

export async function deleteWebsiteMonitoring(id: string): Promise<void> {
  if (!id) {
    throw new Error('Website monitoring ID is required');
  }

  const db = await getDatabase();
  await db.collection('website_monitoring').doc(id).delete();
} 