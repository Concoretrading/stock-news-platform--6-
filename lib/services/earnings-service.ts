import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from '@/lib/firebase-admin';

const db = getFirestore();
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '';

export async function verifyAuthToken(token: string) {
  return getAuth().verifyIdToken(token);
}

export async function getEarningsCalendar(startDate: string, endDate: string | null, stockTicker: string | null) {
  try {
    let query = db.collection('earnings_calendar')
      .where('reportDate', '>=', startDate);

    if (endDate) {
      query = query.where('reportDate', '<=', endDate);
    }

    if (stockTicker) {
      query = query.where('symbol', '==', stockTicker.toUpperCase());
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    throw error;
  }
}

export async function fetchEarningsCalendar(startDate: string, endDate: string | null, stockTicker: string | null) {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('Alpha Vantage API key not configured');
    }

    // Fetch from Alpha Vantage
    const response = await fetch(
      `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${ALPHA_VANTAGE_API_KEY}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    // Check if we got JSON error response
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const jsonData = await response.json();
      if (jsonData['Error Message']) {
        throw new Error(jsonData['Error Message']);
      }
      if (jsonData['Note']) {
        console.warn('Alpha Vantage API limit warning:', jsonData['Note']);
      }
    }

    // Alpha Vantage returns CSV
    const csvText = await response.text();
    const earnings = parseAlphaVantageCSV(csvText);

    // Filter by date range and stock if provided
    return earnings.filter(earning => {
      const earningDate = new Date(earning.reportDate);
      const startDateObj = new Date(startDate);
      const endDateObj = endDate ? new Date(endDate) : null;
      
      const meetsStartDate = earningDate >= startDateObj;
      const meetsEndDate = !endDateObj || earningDate <= endDateObj;
      const meetsStockCriteria = !stockTicker || earning.symbol.toUpperCase() === stockTicker.toUpperCase();
      
      return meetsStartDate && meetsEndDate && meetsStockCriteria;
    });
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    throw error;
  }
}

export async function updateEarningsCalendar(earnings: any[]) {
  try {
    const batch = db.batch();
    
    for (const earning of earnings) {
      const docRef = db.collection('earnings_calendar').doc();
      batch.set(docRef, {
        ...earning,
        updatedAt: new Date().toISOString()
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error updating earnings calendar:', error);
    throw error;
  }
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  values.push(currentValue.trim());
  return values;
}

function parseAlphaVantageCSV(csv: string) {
  const lines = csv.split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const earnings = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    const earning = {
      symbol: '',
      name: '',
      reportDate: '',
      fiscalDateEnding: '',
      estimate: '',
      currency: 'USD',
      earningsType: 'During Market Hours',
      lastEarnings: '',
      conferenceCallTime: '',
      conferenceCallUrl: ''
    };
    
    headers.forEach((header, index) => {
      const value = values[index];
      switch (header.toLowerCase()) {
        case 'symbol':
          earning.symbol = value.toUpperCase();
          break;
        case 'name':
          earning.name = value;
          break;
        case 'reportdate':
          earning.reportDate = value;
          break;
        case 'fiscaldateending':
          earning.fiscalDateEnding = value;
          break;
        case 'estimate':
          earning.estimate = value || 'N/A';
          break;
        case 'currency':
          earning.currency = value || 'USD';
          break;
        case 'time':
          earning.earningsType = value.toLowerCase() === 'bmo' 
            ? 'Before Market Open'
            : value.toLowerCase() === 'amc'
            ? 'After Market Close'
            : 'During Market Hours';
          break;
        case 'surprise':
          earning.lastEarnings = value || '';
          break;
      }
    });

    if (earning.symbol && earning.reportDate) {
      earnings.push(earning);
    }
  }

  return earnings;
} 