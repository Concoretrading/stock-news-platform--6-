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

    // Get user's AI monitoring subscriptions
    const subscriptionsSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const subscriptions = subscriptionsSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching AI monitoring subscriptions:', error);
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

    const { stockTicker } = await request.json();

    if (!stockTicker) {
      return NextResponse.json({ error: 'Stock ticker is required' }, { status: 400 });
    }

    // Check if user already has 3 active subscriptions
    const existingSubsSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    if (existingSubsSnap.docs.length >= 3) {
      return NextResponse.json({ 
        error: 'You can only monitor 3 stocks with AI. Please remove one before adding another.' 
      }, { status: 400 });
    }

    // Check if user already has this stock in their watchlist
    const watchlistStockSnap = await db.collection('stocks')
      .where('userId', '==', userId)
      .where('ticker', '==', stockTicker.toUpperCase())
      .get();

    if (watchlistStockSnap.empty) {
      return NextResponse.json({ 
        error: 'Stock must be in your watchlist before adding to AI monitoring' 
      }, { status: 400 });
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
      return NextResponse.json({ 
        subscription: { id: updatedDoc.id, ...updatedDoc.data() },
        message: 'Stock reactivated for AI monitoring' 
      });
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

    return NextResponse.json({ 
      subscription: { id: newSubscription.id, ...newSubscription.data() },
      message: 'Stock added to AI monitoring successfully' 
    });
  } catch (error) {
    console.error('Error adding AI monitoring subscription:', error);
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

    const { searchParams } = new URL(request.url);
    const stockTicker = searchParams.get('ticker');

    if (!stockTicker) {
      return NextResponse.json({ error: 'Stock ticker is required' }, { status: 400 });
    }

    // Find and soft delete the subscription
    const subscriptionSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('stockTicker', '==', stockTicker.toUpperCase())
      .get();

    if (subscriptionSnap.empty) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    const docRef = subscriptionSnap.docs[0].ref;
    await docRef.update({
      isActive: false,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      message: 'Stock removed from AI monitoring successfully' 
    });
  } catch (error) {
    console.error('Error removing AI monitoring subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 