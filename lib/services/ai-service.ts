import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

interface AIMonitoringSubscription {
  id: string;
  userId: string;
  stockTicker: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AIEvent {
  type: 'earnings_call' | 'product_announcement' | 'conference';
  title: string;
  description: string;
  date: string;
  time: string;
  confidence: number;
  source: string;
}

interface ProcessContentRequest {
  content: string;
  stockTicker: string;
  contentType: string;
  metadata?: Record<string, string>;
}

interface ProcessContentResponse {
  processedContent: ProcessContentRequest;
  monitoredStocks: string[];
}

export async function getAIMonitoringSubscriptions(userId: string): Promise<AIMonitoringSubscription[]> {
  try {
    const subscriptionsSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    return subscriptionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AIMonitoringSubscription));
  } catch (error) {
    console.error('Error fetching AI monitoring subscriptions:', error);
    throw error;
  }
}

export async function addAIMonitoringSubscription(userId: string, stockTicker: string): Promise<{ subscription: AIMonitoringSubscription; message: string }> {
  try {
    // Check if user already has 3 active subscriptions
    const existingSubsSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    if (existingSubsSnap.docs.length >= 3) {
      throw new Error('You can only monitor 3 stocks with AI. Please remove one before adding another.');
    }

    // Check if user already has this stock in their watchlist
    const watchlistStockSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .where('ticker', '==', stockTicker.toUpperCase())
      .get();

    if (watchlistStockSnap.empty) {
      throw new Error('Stock must be in your watchlist before adding to AI monitoring');
    }

    // Check if subscription already exists
    const existingSubscriptionSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('stockTicker', '==', stockTicker.toUpperCase())
      .get();

    if (!existingSubscriptionSnap.empty) {
      // Update existing subscription to active
      const docRef = existingSubscriptionSnap.docs[0].ref;
      await docRef.update({
        isActive: true,
        updatedAt: new Date().toISOString()
      });
      
      const updatedDoc = await docRef.get();
      return {
        subscription: { id: updatedDoc.id, ...updatedDoc.data() } as AIMonitoringSubscription,
        message: 'Stock reactivated for AI monitoring'
      };
    }

    // Add new AI monitoring subscription
    const subscriptionDoc = await db.collection('ai_monitoring_subscriptions').add({
      userId,
      stockTicker: stockTicker.toUpperCase(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const newSubscription = await subscriptionDoc.get();

    return {
      subscription: { id: newSubscription.id, ...newSubscription.data() } as AIMonitoringSubscription,
      message: 'Stock added to AI monitoring successfully'
    };
  } catch (error) {
    console.error('Error adding AI monitoring subscription:', error);
    throw error;
  }
}

export async function removeAIMonitoringSubscription(userId: string, stockTicker: string): Promise<{ message: string }> {
  try {
    // Find and soft delete the subscription
    const subscriptionSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('stockTicker', '==', stockTicker.toUpperCase())
      .get();

    if (subscriptionSnap.empty) {
      throw new Error('Subscription not found');
    }

    // Soft delete by setting isActive to false
    const docRef = subscriptionSnap.docs[0].ref;
    await docRef.update({
      isActive: false,
      updatedAt: new Date().toISOString()
    });

    return {
      message: 'Stock removed from AI monitoring successfully'
    };
  } catch (error) {
    console.error('Error removing AI monitoring subscription:', error);
    throw error;
  }
}

export async function processContent(userId: string, data: ProcessContentRequest): Promise<ProcessContentResponse> {
  try {
    // Get user's monitored stocks
    const subscriptionsSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const monitoredStocks = subscriptionsSnap.docs.map(doc => doc.data().stockTicker);

    if (monitoredStocks.length === 0) {
      return { processedContent: data, monitoredStocks: [] };
    }

    // Process content and return results
    return {
      processedContent: data,
      monitoredStocks
    };
  } catch (error) {
    console.error('Error processing content:', error);
    throw error;
  }
}

export async function getAIDataSources(userId: string, stockTicker?: string, sourceType?: string) {
  try {
    // Get user's monitored stocks
    const subscriptionsSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const monitoredStocks = subscriptionsSnap.docs.map(doc => doc.data().stockTicker);

    if (monitoredStocks.length === 0) {
      return [];
    }

    // Build query for data sources
    let sourcesQuery = db.collection('ai_data_sources')
      .where('stockTicker', 'in', monitoredStocks)
      .where('isActive', '==', true);

    if (stockTicker) {
      sourcesQuery = sourcesQuery.where('stockTicker', '==', stockTicker.toUpperCase());
    }

    if (sourceType) {
      sourcesQuery = sourcesQuery.where('sourceType', '==', sourceType);
    }

    const sourcesSnap = await sourcesQuery.get();
    return sourcesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching AI data sources:', error);
    throw error;
  }
}

async function simulateAIProcessing(content: string, stockTicker: string, contentType: string): Promise<{ events: AIEvent[]; confidenceScore: number }> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const events: AIEvent[] = [];
  let confidenceScore = 0.5;

  // Enhanced keyword detection for UPCOMING events
  const lowerContent = content.toLowerCase();
  
  // FUTURE EARNINGS DATES - Look for specific dates mentioned
  if (lowerContent.includes('earnings') || lowerContent.includes('quarterly results')) {
    const dateMatch = content.match(/([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/);
    if (dateMatch) {
      const eventDate = parseDate(dateMatch[1]);
      if (eventDate && eventDate > new Date()) {
        events.push({
          type: 'earnings_call',
          title: `${stockTicker} Q${getCurrentQuarter()} 2024 Earnings Call`,
          description: 'Scheduled earnings call and quarterly results announcement',
          date: eventDate.toISOString().split('T')[0],
          time: '16:30:00',
          confidence: 0.90,
          source: 'date_extraction'
        });
      }
    }
  }

  return { events, confidenceScore };
}

function parseDate(dateStr: string): Date | null {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function getCurrentQuarter(): number {
  const month = new Date().getMonth();
  return Math.floor(month / 3) + 1;
} 