import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

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