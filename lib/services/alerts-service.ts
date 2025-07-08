import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Helper to fetch current price for a ticker
async function getCurrentPrice(ticker: string): Promise<number | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stock-prices?tickers=${ticker}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.prices?.[ticker]?.price ?? null;
  } catch {
    return null;
  }
}

export async function checkAlerts(userId: string, ticker: string, currentPrice: number) {
  // Get all active alerts for this user and ticker
  const alertsSnap = await db.collection('alerts')
    .where('userId', '==', userId)
    .where('ticker', '==', ticker)
    .where('isActive', '==', true)
    .get();

  const triggeredAlerts = [];

  for (const doc of alertsSnap.docs) {
    const alert = doc.data();
    const alertId = doc.id;

    // Check if alert conditions are met
    let isTriggered = false;
    if (alert.type === 'price_above' && currentPrice >= alert.targetPrice) {
      isTriggered = true;
    } else if (alert.type === 'price_below' && currentPrice <= alert.targetPrice) {
      isTriggered = true;
    }

    if (isTriggered) {
      // Update alert status
      await db.collection('alerts').doc(alertId).update({
        isActive: false,
        triggeredAt: new Date().toISOString(),
        triggerPrice: currentPrice
      });

      // Add to notifications
      const notificationRef = await db.collection('notifications').add({
        userId,
        type: 'alert_triggered',
        ticker,
        alertType: alert.type,
        targetPrice: alert.targetPrice,
        triggerPrice: currentPrice,
        createdAt: new Date().toISOString(),
        isRead: false
      });

      triggeredAlerts.push({
        alertId,
        notificationId: notificationRef.id,
        ...alert,
        triggerPrice: currentPrice
      });
    }
  }

  return triggeredAlerts;
} 