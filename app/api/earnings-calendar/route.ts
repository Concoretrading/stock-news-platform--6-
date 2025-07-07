import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const db = getFirestore();
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// GET: Fetch earnings calendar data
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await getAuth().verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate');
    const stockTicker = searchParams.get('stockTicker');

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
    const filteredEarnings = earnings.filter(earning => {
      const earningDate = new Date(earning.reportDate);
      const startDateObj = new Date(startDate);
      const endDateObj = endDate ? new Date(endDate) : null;
      
      const meetsStartDate = earningDate >= startDateObj;
      const meetsEndDate = !endDateObj || earningDate <= endDateObj;
      const meetsStockCriteria = !stockTicker || earning.symbol.toUpperCase() === stockTicker.toUpperCase();
      
      return meetsStartDate && meetsEndDate && meetsStockCriteria;
    });

    return NextResponse.json({
      success: true,
      data: filteredEarnings
    });

  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch earnings data'
    }, { status: 500 });
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
        // Handle escaped quotes
        currentValue += '"';
        i++;
      } else {
        // Toggle quotes mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of value
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
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

    // Only add if we have the minimum required data
    if (earning.symbol && earning.reportDate) {
      earnings.push(earning);
    }
  }

  return earnings;
}

// POST: Update earnings calendar (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('401 Unauthorized: Missing or invalid Authorization header:', authHeader);
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (err) {
      console.error('401 Unauthorized: Invalid or expired token:', err);
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }
    const userId = decodedToken.uid;
    console.log('Decoded token for POST:', decodedToken.email, decodedToken.uid);

    // Only allow admin access
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      console.error('403 Forbidden: User is not admin:', decodedToken.email);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, data } = await request.json();

    if (action === 'fetch_and_update') {
      return await fetchAndUpdateEarnings();
    } else if (action === 'add_manual') {
      return await addManualEarnings(data);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating earnings calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function fetchAndUpdateEarnings() {
  try {
    // Fetch earnings data from Alpha Vantage
    const earnings = await fetchEarningsFromAlphaVantage();
    
    let updated = 0;
    let added = 0;
    let errors = 0;

    for (const earning of earnings) {
      try {
        // Check if earnings already exists
        const existingSnap = await db.collection('earnings_calendar')
          .where('stockTicker', '==', earning.stockTicker)
          .where('earningsDate', '==', earning.earningsDate)
          .get();

        if (existingSnap.empty) {
          // Add new earnings
          await db.collection('earnings_calendar').add({
            ...earning,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'alpha_vantage'
          });
          added++;
        } else {
          // Update existing earnings
          const docId = existingSnap.docs[0].id;
          await db.collection('earnings_calendar').doc(docId).update({
            ...earning,
            updatedAt: new Date().toISOString(),
            source: 'alpha_vantage'
          });
          updated++;
        }
      } catch (error) {
        console.error(`Error processing earnings for ${earning.stockTicker}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      message: 'Earnings calendar updated successfully',
      stats: { added, updated, errors, total: earnings.length }
    });
  } catch (error) {
    console.error('Error fetching earnings from Alpha Vantage:', error);
    return NextResponse.json({ error: 'Failed to fetch earnings data' }, { status: 500 });
  }
}

async function addManualEarnings(data: any) {
  try {
    const { stockTicker, earningsDate, earningsType, isConfirmed = true, notes } = data;

    if (!stockTicker || !earningsDate) {
      return NextResponse.json({ 
        error: 'Stock ticker and earnings date are required' 
      }, { status: 400 });
    }

    const earnings = {
      stockTicker: stockTicker.toUpperCase(),
      earningsDate,
      earningsType: earningsType || 'After Close',
      isConfirmed,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'manual'
    };

    const docRef = await db.collection('earnings_calendar').add(earnings);

    return NextResponse.json({
      id: docRef.id,
      ...earnings,
      message: 'Manual earnings added successfully'
    });
  } catch (error) {
    console.error('Error adding manual earnings:', error);
    return NextResponse.json({ error: 'Failed to add manual earnings' }, { status: 500 });
  }
}

async function fetchEarningsFromAlphaVantage() {
  try {
    // Get earnings for next 2 months
    const response = await fetch(
      `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${ALPHA_VANTAGE_API_KEY}`
    )
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from Alpha Vantage:', error);
    throw error;
  }
}

async function storeEarningsInFirebase(earnings: any[]) {
  try {
    const batch = db.batch();
    
    // Create a collection for earnings data
    const earningsRef = db.collection('earnings_calendar');
    
    // Clear existing earnings data
    const existingDocs = await earningsRef.get();
    existingDocs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Store new earnings data
    earnings.forEach(earning => {
      const docRef = earningsRef.doc();
      batch.set(docRef, {
        ...earning,
        timestamp: new Date(),
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error storing in Firebase:', error);
    throw error;
  }
} 