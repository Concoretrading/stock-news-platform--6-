import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Only allow admin access
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const stockTicker = searchParams.get('ticker');
    const sourceType = searchParams.get('type');

    // Get user's AI monitoring subscriptions to know which stocks to show
    const subscriptionsSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const monitoredStocks = subscriptionsSnap.docs.map(doc => doc.data().stockTicker);

    if (monitoredStocks.length === 0) {
      return NextResponse.json({ sources: [] });
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

    const sourcesSnap = await sourcesQuery
      .orderBy('stockTicker', 'asc')
      .orderBy('sourceType', 'asc')
      .get();

    const sources = sourcesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error fetching AI data sources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Only allow admin access
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { stockTicker, sourceType, sourceName, sourceUrl, sourceIdentifier, reliabilityScore } = await request.json();

    if (!stockTicker || !sourceType || !sourceName) {
      return NextResponse.json({ error: 'Stock ticker, source type, and source name are required' }, { status: 400 });
    }

    // Verify the stock is being monitored by this user
    const subscriptionSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('stockTicker', '==', stockTicker.toUpperCase())
      .where('isActive', '==', true)
      .get();

    if (subscriptionSnap.empty) {
      return NextResponse.json({ error: 'Stock must be in your AI monitoring list' }, { status: 400 });
    }

    // Check if source already exists
    const existingSourceSnap = await db.collection('ai_data_sources')
      .where('stockTicker', '==', stockTicker.toUpperCase())
      .where('sourceType', '==', sourceType)
      .where('sourceIdentifier', '==', sourceIdentifier)
      .get();

    if (!existingSourceSnap.empty) {
      return NextResponse.json({ error: 'This data source already exists' }, { status: 409 });
    }

    // Add new data source
    const sourceDoc = await db.collection('ai_data_sources').add({
      stockTicker: stockTicker.toUpperCase(),
      sourceType,
      sourceName,
      sourceUrl: sourceUrl || null,
      sourceIdentifier: sourceIdentifier || null,
      reliabilityScore: reliabilityScore || 0.8,
      isActive: true,
      checkFrequencyMinutes: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const newSource = await sourceDoc.get();

    return NextResponse.json({ 
      source: { id: newSource.id, ...newSource.data() },
      message: 'Data source added successfully' 
    });
  } catch (error) {
    console.error('Error adding AI data source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Only allow admin access
    if (decodedToken.email !== 'handrigannick@gmail.com') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('id');

    if (!sourceId) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }

    // Find and soft delete the data source
    const sourceRef = db.collection('ai_data_sources').doc(sourceId);
    const sourceDoc = await sourceRef.get();

    if (!sourceDoc.exists) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    const sourceData = sourceDoc.data();
    
    // Verify the stock is being monitored by this user
    const subscriptionSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('stockTicker', '==', sourceData?.stockTicker)
      .where('isActive', '==', true)
      .get();

    if (subscriptionSnap.empty) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete by setting isActive to false
    await sourceRef.update({
      isActive: false,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      message: 'Data source removed successfully' 
    });
  } catch (error) {
    console.error('Error removing AI data source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 