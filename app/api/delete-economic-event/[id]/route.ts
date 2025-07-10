import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }
    const db = await getFirestore();
    await db.collection('economic_events').doc(id).delete();
    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting economic event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
} 