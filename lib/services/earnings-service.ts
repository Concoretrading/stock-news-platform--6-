import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export async function getEarningsCalendar() {
  try {
    const earningsSnap = await db.collection('earnings_calendar')
      .orderBy('date', 'asc')
      .get();

    return earningsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    throw error;
  }
}

export async function addEarningsEvent(data: {
  ticker: string;
  date: string;
  time?: string;
  source?: string;
}) {
  try {
    const docRef = await db.collection('earnings_calendar').add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return {
      id: docRef.id,
      ...data
    };
  } catch (error) {
    console.error('Error adding earnings event:', error);
    throw error;
  }
}

export async function updateEarningsEvent(id: string, data: {
  ticker?: string;
  date?: string;
  time?: string;
  source?: string;
}) {
  try {
    await db.collection('earnings_calendar').doc(id).update({
      ...data,
      updatedAt: new Date().toISOString()
    });

    return {
      id,
      ...data
    };
  } catch (error) {
    console.error('Error updating earnings event:', error);
    throw error;
  }
}

export async function deleteEarningsEvent(id: string) {
  try {
    await db.collection('earnings_calendar').doc(id).delete();
    return { id };
  } catch (error) {
    console.error('Error deleting earnings event:', error);
    throw error;
  }
} 