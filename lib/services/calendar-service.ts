/// <reference types="node" />
import { getFirestore, Query, DocumentData } from 'firebase-admin/firestore';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { getStorage } from '@/lib/firebase-admin';

const db = getFirestore();
const vision = new ImageAnnotatorClient();
const storage = getStorage();
const bucket = storage.bucket();

type CloudVisionVertex = protos.google.cloud.vision.v1.IVertex;

interface IVertex {
  x: number;
  y: number;
}

interface IBoundingPoly {
  vertices: IVertex[] | null;
}

interface ILogoAnnotation {
  description: string;
  boundingPoly?: IBoundingPoly;
}

interface CalendarEvent {
  stockTicker: string;
  companyName: string;
  eventDate: Date;
  eventType: 'earnings';
  logoUrl?: string;
  source: 'screenshot';
  earningsType?: 'BMO' | 'AMC';
  estimatedEPS?: number;
  actualEPS?: number;
  estimatedRevenue?: number;
  actualRevenue?: number;
  conferenceCallUrl?: string;
  lastEarningsDate?: Date;
  lastEarningsEPS?: number;
  lastEarningsRevenue?: number;
}

interface AnalysisResult {
  events: CalendarEvent[];
  extractedText: string;
  imageStoragePath: string;
}

interface DatePosition {
  x: number;
  y: number;
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

function convertToIVertex(vertex: CloudVisionVertex): IVertex {
  return {
    x: vertex.x || 0,
    y: vertex.y || 0
  };
}

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

    // Extract dates from the calendar grid
    const events: CalendarEvent[] = [];
    const monthRegex = /Dec\s+\d{1,2}/g; // Update this based on current month
    const dates = detectedText.match(monthRegex) || [];
    
    // Process each detected logo
    for (const logo of logos) {
      const companyName = logo.description || '';
      // Find the closest date to this logo in the text
      const vertices = (logo.boundingPoly?.vertices || []).map(convertToIVertex);
      const nearestDate = findNearestDateInGrid(dates, detectedText, vertices);
      
      if (nearestDate) {
        const eventDate = parseDate(nearestDate);
        
        // Try to detect if it's Before Market Open or After Market Close
        // For this calendar format, we'll need to look for timing indicators near the logo
        const textAroundLogo = getTextAroundBoundingBox(detectedText, vertices, 150);
        const earningsType = detectEarningsType(textAroundLogo);

        events.push({
          stockTicker: getStockTickerFromLogo(companyName),
          companyName: getFullCompanyName(companyName),
          eventDate,
          eventType: 'earnings',
          source: 'screenshot',
          earningsType,
          logoUrl: await getLogoUrl(companyName)
        });
      }
    }

    // Store events in Firestore
    const batch = db.batch();
    for (const event of events) {
      const eventRef = db.collection('earnings_calendar').doc();
      batch.set(eventRef, {
        stockTicker: event.stockTicker,
        companyName: event.companyName,
        earningsDate: event.eventDate,
        earningsType: event.earningsType || 'BMO',
        isConfirmed: true,
        estimatedEPS: null,
        actualEPS: null,
        estimatedRevenue: null,
        actualRevenue: null,
        conferenceCallUrl: null,
        lastEarningsDate: null,
        lastEarningsEPS: null,
        lastEarningsRevenue: null,
        logoUrl: event.logoUrl,
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

// Updated to handle grid-based layout
function findNearestDateInGrid(dates: string[], text: string, vertices: IVertex[]): string | null {
  if (!vertices || vertices.length === 0) return null;

  // Calculate the center point of the logo
  const centerX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const centerY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;

  // Find column and row headers
  const columnHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const datePositions = new Map<string, DatePosition>();

  // Map dates to their positions in the grid
  dates.forEach(date => {
    const dateIndex = text.indexOf(date);
    if (dateIndex !== -1) {
      // Find the nearest column header
      let columnX = 0;
      let minColumnDist = Infinity;
      columnHeaders.forEach((header, index) => {
        const headerIndex = text.indexOf(header);
        if (headerIndex !== -1) {
          const headerX = headerIndex * 10; // Rough estimation
          const dist = Math.abs(dateIndex - headerIndex);
          if (dist < minColumnDist) {
            minColumnDist = dist;
            columnX = headerX;
          }
        }
      });

      datePositions.set(date, {
        x: columnX,
        y: Math.floor(dateIndex / text.length * 1000) // Rough vertical position
      });
    }
  });

  // Find the closest date by grid position
  let closestDate = null;
  let minDistance = Infinity;

  datePositions.forEach((pos, date) => {
    const distance = Math.sqrt(
      Math.pow(pos.x - centerX, 2) + 
      Math.pow(pos.y - centerY, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestDate = date;
    }
  });

  return closestDate;
}

function detectEarningsType(text: string): 'BMO' | 'AMC' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('before market') || lowerText.includes('pre-market') || lowerText.includes('bmo')) {
    return 'BMO';
  }
  if (lowerText.includes('after market') || lowerText.includes('post-market') || lowerText.includes('amc')) {
    return 'AMC';
  }
  return 'BMO'; // Default to BMO if no clear indicator
}

function getTextAroundBoundingBox(fullText: string, vertices: IVertex[], charRadius: number = 150): string {
  if (!vertices || vertices.length === 0) return '';

  // Calculate the center point of the bounding box
  const centerX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const centerY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;

  // For simplicity, we'll just take a substring around the center point
  // This is a rough approximation - in a real implementation, you'd want to
  // consider the actual 2D layout of the text
  const textCenter = Math.floor((fullText.length * centerY) / 1000);
  const start = Math.max(0, textCenter - charRadius);
  const end = Math.min(fullText.length, textCenter + charRadius);

  return fullText.substring(start, end);
}

function getStockTickerFromLogo(logoName: string): string {
  // First check our mapping
  const ticker = companyToTicker[logoName];
  if (ticker) return ticker;

  // If not in our mapping, try some basic transformations
  // Remove common words and spaces, take first word
  const simplifiedName = logoName
    .replace(/\binc\b|\bcorp\b|\bltd\b|\bplc\b/gi, '')
    .trim()
    .split(' ')[0]
    .toUpperCase();

  return simplifiedName;
}

function getFullCompanyName(logoName: string): string {
  // Add common suffixes if missing
  if (!/\b(inc|corp|ltd|plc)\b/i.test(logoName)) {
    return `${logoName} Inc`;
  }
  return logoName;
}

async function getLogoUrl(companyName: string): Promise<string | undefined> {
  try {
    // First check if we already have this logo stored
    const logoDoc = await db.collection('company_logos')
      .where('companyName', '==', companyName)
      .limit(1)
      .get();

    if (!logoDoc.empty) {
      return logoDoc.docs[0].data().url;
    }

    // If not found, return undefined - logo fetching would be handled separately
    return undefined;
  } catch (error) {
    console.error('Error fetching logo URL:', error);
    return undefined;
  }
}

interface CalendarEventParams {
  startDate?: string;
  endDate?: string;
  stockTicker?: string;
}

interface CalendarEventUpdate {
  isConfirmed?: boolean;
  userNotes?: string;
}

export async function getCalendarEvents(userId: string, params: CalendarEventParams) {
  try {
    let query: Query<DocumentData> = db.collection('earnings_calendar');

    if (params.stockTicker) {
      query = query.where('stockTicker', '==', params.stockTicker.toUpperCase());
    }

    if (params.startDate) {
      query = query.where('earningsDate', '>=', new Date(params.startDate));
    }

    if (params.endDate) {
      query = query.where('earningsDate', '<=', new Date(params.endDate));
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

export async function updateCalendarEvent(userId: string, eventId: string, updates: CalendarEventUpdate) {
  try {
    const eventRef = db.collection('earnings_calendar').doc(eventId);
    await eventRef.update({
      ...updates,
      updatedAt: new Date()
    });

    const updatedDoc = await eventRef.get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
} 