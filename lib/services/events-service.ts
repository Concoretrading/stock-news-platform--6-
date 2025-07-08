import { getFirestore } from 'firebase-admin/firestore';
import { getQuarterFromDate, getCategoryFromEventType, getImpactFromConfidence } from '@/lib/utils';

const db = getFirestore();

export async function getUpcomingEvents(stockTicker: string | null, startDate: string, endDate: string) {
  try {
    const [earnings, aiEvents, companyEvents, regulatoryEvents] = await Promise.all([
      getUpcomingEarnings(stockTicker, startDate, endDate),
      getAIDetectedEvents(stockTicker, startDate, endDate),
      getCompanyEvents(stockTicker, startDate, endDate),
      getRegulatoryEvents(stockTicker, startDate, endDate)
    ]);

    // Combine and sort all events
    return [...earnings, ...aiEvents, ...companyEvents, ...regulatoryEvents]
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

async function getUpcomingEarnings(stockTicker: string | null, startDate: string, endDate: string) {
  try {
    let query = db.collection('earnings_calendar')
      .where('earningsDate', '>=', startDate)
      .where('earningsDate', '<=', endDate);

    if (stockTicker) {
      query = query.where('stockTicker', '==', stockTicker.toUpperCase()) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        eventType: 'earnings',
        eventDate: data.earningsDate,
        title: `${data.stockTicker} Q${getQuarterFromDate(data.earningsDate)} Earnings`,
        description: `${data.companyName} ${data.earningsType} earnings call`,
        stockTicker: data.stockTicker,
        companyName: data.companyName,
        earningsType: data.earningsType,
        isConfirmed: data.isConfirmed,
        estimatedEPS: data.estimatedEPS,
        estimatedRevenue: data.estimatedRevenue,
        conferenceCallUrl: data.conferenceCallUrl,
        confidence: data.isConfirmed ? 0.95 : 0.70,
        source: 'earnings_calendar',
        category: 'Earnings',
        impact: 'high',
        daysUntil: Math.ceil((new Date(data.earningsDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      };
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return [];
  }
}

async function getAIDetectedEvents(stockTicker: string | null, startDate: string, endDate: string) {
  try {
    let query = db.collection('ai_detected_events')
      .where('eventDate', '>=', startDate)
      .where('eventDate', '<=', endDate);

    if (stockTicker) {
      query = query.where('stockTicker', '==', stockTicker.toUpperCase()) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        eventType: data.eventType,
        eventDate: data.eventDate,
        title: data.title,
        description: data.description,
        stockTicker: data.stockTicker,
        confidence: data.confidenceScore,
        source: data.sourceType,
        category: getCategoryFromEventType(data.eventType),
        impact: getImpactFromConfidence(data.confidenceScore),
        daysUntil: Math.ceil((new Date(data.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      };
    });
  } catch (error) {
    console.error('Error fetching AI events:', error);
    return [];
  }
}

async function getCompanyEvents(stockTicker: string | null, startDate: string, endDate: string) {
  // Mock company events - in production, this would come from company calendars, press releases, etc.
  const mockCompanyEvents = [
    {
      eventType: 'product_launch',
      eventDate: '2024-09-10T14:00:00Z',
      title: 'Apple iPhone 16 Launch Event',
      description: 'Expected iPhone 16 series launch with new AI features',
      stockTicker: 'AAPL',
      confidence: 0.85,
      source: 'company_calendar',
      category: 'Product Launch',
      impact: 'high',
      daysUntil: Math.ceil((new Date('2024-09-10T14:00:00Z').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }
  ];

  if (stockTicker) {
    return mockCompanyEvents.filter(event => event.stockTicker === stockTicker.toUpperCase());
  }
  return mockCompanyEvents;
}

async function getRegulatoryEvents(stockTicker: string | null, startDate: string, endDate: string) {
  // Mock regulatory events - in production, this would come from SEC filings, regulatory calendars, etc.
  const mockRegulatoryEvents = [
    {
      eventType: 'regulatory',
      eventDate: '2024-08-15T10:00:00Z',
      title: 'AAPL Antitrust Hearing',
      description: 'Congressional hearing on Apple App Store practices',
      stockTicker: 'AAPL',
      confidence: 0.75,
      source: 'regulatory_calendar',
      category: 'Regulatory',
      impact: 'medium',
      daysUntil: Math.ceil((new Date('2024-08-15T10:00:00Z').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }
  ];

  if (stockTicker) {
    return mockRegulatoryEvents.filter(event => event.stockTicker === stockTicker.toUpperCase());
  }
  return mockRegulatoryEvents;
} 