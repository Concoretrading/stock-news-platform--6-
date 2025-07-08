import { getFirestore } from '@/lib/firebase-admin';

// Helper function to get database safely
async function getDatabase() {
  return await getFirestore();
}

interface StockPrice {
  price: number;
  timestamp: string;
}

interface StockPriceResponse {
  prices: Record<string, StockPrice>;
}

interface Alert {
  userId: string;
  ticker: string;
  type: 'price_above' | 'price_below';
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  triggerPrice?: number;
}

interface Notification {
  userId: string;
  type: 'alert_triggered';
  ticker: string;
  alertType: 'price_above' | 'price_below';
  targetPrice: number;
  triggerPrice: number;
  createdAt: string;
  isRead: boolean;
}

interface TriggeredAlert extends Alert {
  alertId: string;
  notificationId: string;
  triggerPrice: number;
}

// NOTE: Live price functionality has been removed
// Alert checking functionality is disabled until alternative price source is implemented

export async function checkAlerts(userId: string, ticker: string, currentPrice: number) {
  try {
    const db = await getDatabase();
    
    // Simple mock alert checking
    const triggeredAlerts: any[] = [];
    
    return triggeredAlerts;
  } catch (error) {
    console.error('Error checking alerts:', error);
    throw error;
  }
}

export async function createAlert(userId: string, alertData: any) {
  try {
    const db = await getDatabase();
    
    const docRef = await db.collection('alerts').add({
      ...alertData,
      userId,
      createdAt: new Date().toISOString()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
} 