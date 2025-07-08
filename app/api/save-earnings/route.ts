import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getFirestore } from '@/lib/firebase-admin';

function generateConferenceCallUrl(ticker: string, earningsDate: Date): string | null {
  // Generate investor relations URLs for major companies
  const irUrls: Record<string, string> = {
    'AAPL': 'https://investor.apple.com/investor-relations/default.aspx',
    'MSFT': 'https://www.microsoft.com/en-us/Investor',
    'GOOGL': 'https://abc.xyz/investor/',
    'AMZN': 'https://ir.aboutamazon.com/',
    'TSLA': 'https://ir.tesla.com/',
    'META': 'https://investor.fb.com/',
    'NVDA': 'https://investor.nvidia.com/',
    'JPM': 'https://www.jpmorganchase.com/ir',
    'V': 'https://investor.visa.com/',
    'JNJ': 'https://www.investor.jnj.com/',
    'WMT': 'https://corporate.walmart.com/investors',
    'PG': 'https://www.pginvestor.com/',
    'HD': 'https://ir.homedepot.com/',
    'CVX': 'https://www.chevron.com/investors',
    'KO': 'https://investors.coca-colacompany.com/',
    'MRK': 'https://investors.merck.com/',
    'PFE': 'https://investors.pfizer.com/',
    'DIS': 'https://thewaltdisneycompany.com/investors/',
    'NFLX': 'https://ir.netflix.net/',
    'CRM': 'https://investor.salesforce.com/'
  };
  
  return irUrls[ticker] || null;
}

function generateLogoUrl(ticker: string): string {
  // Use a logo service or return a default company logo URL
  // For now, use a placeholder service that generates company logos
  return `https://logo.clearbit.com/${getCompanyDomain(ticker)}`;
}

function getCompanyDomain(ticker: string): string {
  const domains: Record<string, string> = {
    'AAPL': 'apple.com',
    'MSFT': 'microsoft.com',
    'GOOGL': 'google.com',
    'AMZN': 'amazon.com',
    'TSLA': 'tesla.com',
    'META': 'meta.com',
    'NVDA': 'nvidia.com',
    'JPM': 'jpmorganchase.com',
    'V': 'visa.com',
    'JNJ': 'jnj.com',
    'WMT': 'walmart.com',
    'PG': 'pg.com',
    'HD': 'homedepot.com',
    'CVX': 'chevron.com',
    'KO': 'coca-cola.com',
    'MRK': 'merck.com',
    'PFE': 'pfizer.com',
    'DIS': 'disney.com',
    'NFLX': 'netflix.com',
    'CRM': 'salesforce.com'
  };
  
  return domains[ticker] || `${ticker.toLowerCase()}.com`;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (admin only)
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await (await getAuth()).verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Only allow admin user
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { events } = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    const db = await getFirestore();
    const batch = db.batch();

    // Save each earnings event to Firestore
    for (const event of events) {
      const earningsRef = db.collection('earnings_calendar').doc();
      
      // Convert string date to Firestore timestamp for proper querying
      const earningsDate = new Date(event.earningsDate);
      
      batch.set(earningsRef, {
        stockTicker: event.stockTicker,
        companyName: event.companyName,
        earningsDate: earningsDate, // Save as Date object for Firestore queries
        earningsType: event.earningsType || 'BMO',
        isConfirmed: true,
        estimatedEPS: event.estimatedEPS || null,
        estimatedRevenue: event.estimatedRevenue || null,
        actualEPS: null,
        actualRevenue: null,
        conferenceCallUrl: generateConferenceCallUrl(event.stockTicker, earningsDate), // Auto-generate call URL
        logoUrl: generateLogoUrl(event.stockTicker), // Generate logo URL
        source: event.source,
        uploadedBy: decodedToken.email,
        uploadedAt: new Date(),
        isPublic: true, // Make visible to all users
        createdAt: new Date(),
        updatedAt: new Date(),
        // Debug info
        detectedLogoName: event.detectedLogoName,
        detectedFromText: event.detectedFromText
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${events.length} earnings events`,
      eventsCount: events.length
    });

  } catch (error) {
    console.error('Error saving earnings events:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save earnings events'
    }, { status: 500 });
  }
} 