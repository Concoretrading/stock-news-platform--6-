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

    // Store events in Firestore
    const db = await getFirestore();
    const batch = db.batch();
    
    for (const event of events) {
      const eventRef = db.collection('economic_events').doc(event.id);
      // Filter out undefined and null values before saving to Firestore
      const cleanEvent = Object.fromEntries(
        Object.entries(event).filter(([_, value]) => value !== undefined && value !== null)
      );
      
      // Ensure no undefined values remain
      Object.keys(cleanEvent).forEach(key => {
        if (cleanEvent[key] === undefined) {
          delete cleanEvent[key];
        }
      });
      
      batch.set(eventRef, {
        ...cleanEvent,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${events.length} economic events`,
      events: events.map(event => ({
        id: event.id,
        date: event.date,
        time: event.time,
        event: event.event,
        importance: event.importance,
        iconUrl: event.iconUrl
      }))
    });

  } catch (error) {
    console.error('Error processing economic events:', error);
    return NextResponse.json(
      { error: 'Failed to process economic events' },
      { status: 500 }
    );
  }
} 