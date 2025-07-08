/// <reference types="node" />
import { getFirestore } from 'firebase-admin/firestore';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { getStorage } from '@/lib/firebase-admin';

const db = getFirestore();
const vision = new ImageAnnotatorClient();
const storage = getStorage();
const bucket = storage.bucket();

interface CalendarEvent {
  stockTicker: string;
  companyName: string;
  eventDate: Date;
  eventType: 'earnings';
  logoUrl?: string;
  source: 'screenshot';
}

interface AnalysisResult {
  events: CalendarEvent[];
  extractedText: string;
  imageStoragePath: string;
}

// Map of common company names to their stock tickers
const companyToTicker: Record<string, string> = {
  'JPMorgan': 'JPM',
  'BlackRock': 'BLK',
  'Citi': 'C',
  'ASML': 'ASML',
  'Goldman Sachs': 'GS',
  'Netflix': 'NFLX',
  'Abbott': 'ABT',
  'American Express': 'AXP',
  '3M': 'MMM',
  'Unilever': 'UL',
  'Tesla': 'TSLA',
  'IBM': 'IBM',
  'Intel': 'INTC',
  'Visa': 'V',
  'Coca-Cola': 'KO',
  'Microsoft': 'MSFT',
  'Apple': 'AAPL',
  'AMD': 'AMD',
  'PayPal': 'PYPL',
  'Meta': 'META',
  // Add more as needed
};

export async function analyzeCalendarScreenshot(
  userId: string,
  imageBuffer: Buffer,
  imageType: string
): Promise<AnalysisResult> {
  try {
    // Upload image to Firebase Storage
    const filename = `calendar-screenshots/${userId}/${Date.now()}.${imageType}`;
    const file = bucket.file(filename);
    await file.save(imageBuffer);

    // Get text from image using Vision API
    const [result] = await vision.textDetection(imageBuffer);
    const detectedText = result.fullTextAnnotation?.text || '';
    
    // Get logos from image
    const [logoResult] = await vision.logoDetection(imageBuffer);
    const logos = logoResult.logoAnnotations || [];

    // Extract dates and companies
    const events: CalendarEvent[] = [];
    const dateRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/g;
    const dates = detectedText.match(dateRegex) || [];

    // Process each detected logo
    for (const logo of logos) {
      const companyName = logo.description || '';
      // Find the closest date to this logo in the text
      // This would need to be enhanced based on the actual layout
      const nearestDate = findNearestDate(dates, detectedText, logo.boundingPoly?.vertices);
      
      if (nearestDate) {
        const eventDate = parseDate(nearestDate);
        events.push({
          stockTicker: companyToTicker[companyName] || companyName,
          companyName,
          eventDate,
          eventType: 'earnings',
          source: 'screenshot'
        });
      }
    }

    // Store events in Firestore
    const batch = db.batch();
    for (const event of events) {
      const eventRef = db.collection('users').doc(userId)
        .collection('calendar_events').doc();
      batch.set(eventRef, {
        ...event,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await batch.commit();

    return {
      events,
      extractedText: detectedText,
      imageStoragePath: filename
    };
  } catch (error) {
    console.error('Error analyzing calendar screenshot:', error);
    throw error;
  }
}

function parseDate(dateStr: string): Date {
  const currentYear = new Date().getFullYear();
  return new Date(`${dateStr} ${currentYear}`);
}

function findNearestDate(dates: string[], text: string, vertices: any): string | null {
  if (!vertices || !dates.length) return null;

  // Calculate the center point of the logo
  const logoX = vertices.reduce((sum: number, v: any) => sum + v.x, 0) / vertices.length;
  const logoY = vertices.reduce((sum: number, v: any) => sum + v.y, 0) / vertices.length;

  // Find all date positions in the text
  const datePositions = dates.map(date => {
    const dateIndex = text.indexOf(date);
    // Estimate the position based on character index
    // This is a rough approximation - we'd need actual coordinates from the Vision API
    const lineNumber = text.substring(0, dateIndex).split('\n').length;
    const lineStart = text.substring(0, dateIndex).lastIndexOf('\n') + 1;
    const xPos = dateIndex - lineStart;
    return {
      date,
      x: xPos * 10, // Rough pixel estimation
      y: lineNumber * 20 // Rough pixel estimation
    };
  });

  // Find the closest date by Euclidean distance
  let closestDate = null;
  let minDistance = Infinity;

  for (const pos of datePositions) {
    const distance = Math.sqrt(
      Math.pow(pos.x - logoX, 2) + 
      Math.pow(pos.y - logoY, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestDate = pos.date;
    }
  }

  return closestDate;
}

// Add more helper functions as needed

export async function getCalendarEvents(userId: string, params: {
  startDate?: string;
  endDate?: string;
  stockTicker?: string;
}) {
  const { startDate, endDate, stockTicker } = params;

  // Get user's AI monitoring subscriptions
  const subscriptionsSnap = await db.collection('ai_monitoring_subscriptions')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .get();

  const monitoredStocks = subscriptionsSnap.docs.map(doc => doc.data().stockTicker);

  if (monitoredStocks.length === 0) {
    return [];
  }

  // Build query for AI detected events
  let eventsQuery = db.collection('ai_detected_events')
    .where('stockTicker', 'in', monitoredStocks);

  if (startDate && endDate) {
    eventsQuery = eventsQuery
      .where('eventDate', '>=', startDate)
      .where('eventDate', '<=', endDate);
  }

  if (stockTicker) {
    eventsQuery = eventsQuery.where('stockTicker', '==', stockTicker.toUpperCase());
  }

  const eventsSnap = await eventsQuery
    .orderBy('eventDate', 'asc')
    .orderBy('eventTime', 'asc')
    .get();

  const events = eventsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Get user's calendar events (user-specific events)
  let userEventsQuery = db.collection('user_calendar_events')
    .where('userId', '==', userId);

  if (startDate && endDate) {
    userEventsQuery = userEventsQuery
      .where('eventDate', '>=', startDate)
      .where('eventDate', '<=', endDate);
  }

  if (stockTicker) {
    userEventsQuery = userEventsQuery.where('stockTicker', '==', stockTicker.toUpperCase());
  }

  const userEventsSnap = await userEventsQuery
    .orderBy('eventDate', 'asc')
    .orderBy('eventTime', 'asc')
    .get();

  const userEvents = userEventsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return [...events, ...userEvents];
}

export async function updateCalendarEvent(userId: string, eventId: string, updates: {
  isConfirmed?: boolean;
  userNotes?: string;
}) {
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  const eventRef = db.collection('user_calendar_events').doc(eventId);
  const eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    throw new Error('Event not found');
  }

  const eventData = eventDoc.data();
  if (eventData?.userId !== userId) {
    throw new Error('Unauthorized');
  }

  const updateData: any = {
    updatedAt: new Date().toISOString()
  };

  if (typeof updates.isConfirmed === 'boolean') {
    updateData.isConfirmed = updates.isConfirmed;
  }

  if (updates.userNotes !== undefined) {
    updateData.userNotes = updates.userNotes;
  }

  await eventRef.update(updateData);

  const updatedDoc = await eventRef.get();
  return {
    id: updatedDoc.id,
    ...updatedDoc.data()
  };
} 