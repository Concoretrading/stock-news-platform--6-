import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

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

export async function checkAlerts(userId: string, ticker: string, currentPrice: number): Promise<TriggeredAlert[]> {
  // Price-based alerts are currently disabled
  console.log('Price alerts are currently disabled - live price functionality removed');
  return [];
} 