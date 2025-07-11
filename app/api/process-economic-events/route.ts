import { NextRequest, NextResponse } from 'next/server';
import { parseMarketWatchData, validateMarketWatchData, EconomicEvent } from '@/lib/services/economic-events-parser';
import { getFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { rawData } = await request.json();

    if (!rawData || typeof rawData !== 'string') {
      return NextResponse.json(
        { error: 'Raw data is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate the data first
    const validation = validateMarketWatchData(rawData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid data format', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Parse the data
    const events = parseMarketWatchData(rawData);
    
    if (events.length === 0) {
      return NextResponse.json(
        { error: 'No valid events found in the data' },
        { status: 400 }
      );
    }

    // Store events in Firestore (no deduplication)
    const db = await getFirestore();
    const batch = db.batch();
    const newEvents = [];
    
    for (const event of events) {
      // Create unique ID for new event
      const uniqueId = `economic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const eventRef = db.collection('economic_events').doc(uniqueId);
      
      // Filter out undefined and null values before saving to Firestore
      const cleanEvent = Object.fromEntries(
        Object.entries(event).filter(([_, value]) => value !== undefined && value !== null)
      );
      
      // Ensure no undefined values remain and handle specific fields
      Object.keys(cleanEvent).forEach(key => {
        if (cleanEvent[key] === undefined || cleanEvent[key] === null) {
          delete cleanEvent[key];
        }
      });
      
      // Explicitly handle optional fields that might be undefined
      if (cleanEvent.actual === undefined || cleanEvent.actual === null) {
        delete cleanEvent.actual;
      }
      if (cleanEvent.forecast === undefined || cleanEvent.forecast === null) {
        delete cleanEvent.forecast;
      }
      if (cleanEvent.previous === undefined || cleanEvent.previous === null) {
        delete cleanEvent.previous;
      }
      if (cleanEvent.iconUrl === undefined || cleanEvent.iconUrl === null) {
        delete cleanEvent.iconUrl;
      }
      
      // Update event with unique ID
      cleanEvent.id = uniqueId;
      
      batch.set(eventRef, {
        ...cleanEvent,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      newEvents.push(event);
    }

    await batch.commit();

    const totalProcessed = newEvents.length;
    const message = newEvents.length > 0 
      ? `Successfully added ${newEvents.length} new economic events.`
      : `No new events added.`;
    
    return NextResponse.json({
      success: true,
      message,
      events: newEvents.map(event => ({
        id: event.id,
        date: event.date,
        time: event.time,
        event: event.event,
        iconUrl: event.iconUrl
      })),
      stats: {
        total: totalProcessed,
        added: newEvents.length,
        skipped: 0
      }
    });

  } catch (error) {
    console.error('Error processing economic events:', error);
    return NextResponse.json(
      { error: 'Failed to process economic events' },
      { status: 500 }
    );
  }
} 