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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const stockTicker = searchParams.get('ticker');

    // Get user's AI monitoring subscriptions
    const subscriptionsSnap = await db.collection('ai_monitoring_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const monitoredStocks = subscriptionsSnap.docs.map(doc => doc.data().stockTicker);

    if (monitoredStocks.length === 0) {
      return NextResponse.json({ events: [] });
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
      ...doc.data(),
      isUserEvent: true
    }));

    // Combine and sort all events
    const allEvents = [...events, ...userEvents].sort((a: any, b: any) => {
      const dateA = new Date(`${a.eventDate} ${a.eventTime || '00:00:00'}`);
      const dateB = new Date(`${b.eventDate} ${b.eventTime || '00:00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json({ events: allEvents });
  } catch (error) {
    console.error('Error fetching AI calendar events:', error);
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

    const { eventId, isConfirmed, userNotes } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Update user calendar event
    const eventRef = db.collection('user_calendar_events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventDoc.data();
    if (eventData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (typeof isConfirmed === 'boolean') {
      updateData.isConfirmed = isConfirmed;
    }

    if (userNotes !== undefined) {
      updateData.userNotes = userNotes;
    }

    await eventRef.update(updateData);

    const updatedDoc = await eventRef.get();

    return NextResponse.json({ 
      event: { id: updatedDoc.id, ...updatedDoc.data() },
      message: 'Event updated successfully' 
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 