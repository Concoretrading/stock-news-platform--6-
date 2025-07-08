import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // For now, simulate AI processing and return mock earnings data
    // In a real implementation, you would:
    // 1. Process the image with AI/OCR
    // 2. Extract earnings information
    // 3. Parse dates, company names, tickers, etc.

    const mockEvents = [
      {
        companyName: 'Apple Inc.',
        stockTicker: 'AAPL',
        earningsDate: '2024-01-25',
        earningsType: 'AMC',
        isConfirmed: true,
        estimatedEPS: 2.05,
        estimatedRevenue: 117500000000,
        source: 'admin_upload'
      },
      {
        companyName: 'Microsoft Corporation',
        stockTicker: 'MSFT',
        earningsDate: '2024-01-24',
        earningsType: 'AMC',
        isConfirmed: true,
        estimatedEPS: 2.78,
        estimatedRevenue: 61000000000,
        source: 'admin_upload'
      }
    ];

    return NextResponse.json({
      success: true,
      events: mockEvents,
      message: 'Earnings screenshot processed successfully'
    });

  } catch (error) {
    console.error('Error processing earnings screenshot:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process earnings screenshot'
    }, { status: 500 });
  }
} 