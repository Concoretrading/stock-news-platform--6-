import { getFirestore } from '@/lib/firebase-admin';

// Helper function to get database safely
async function getDatabase() {
  return await getFirestore();
}

export async function getEarningsCalendar() {
  try {
    const db = await getDatabase();
    
    // Simple mock earnings data
    const earnings = [
      {
        id: '1',
        stockTicker: 'AAPL',
        companyName: 'Apple Inc.',
        earningsDate: '2024-01-25',
        isConfirmed: true
      },
      {
        id: '2',
        stockTicker: 'MSFT', 
        companyName: 'Microsoft Corporation',
        earningsDate: '2024-01-24',
        isConfirmed: true
      }
    ];
    
    return earnings;
  } catch (error) {
    console.error('Error fetching earnings calendar:', error);
    throw error;
  }
}

export async function addEarningsEvent(eventData: any) {
  try {
    const db = await getDatabase();
    
    const docRef = await db.collection('earnings_calendar').add({
      ...eventData,
      createdAt: new Date().toISOString()
    });
    
    return docRef.id;
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
    const db = await getDatabase();
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
    const db = await getDatabase();
    await db.collection('earnings_calendar').doc(id).delete();
    return { id };
  } catch (error) {
    console.error('Error deleting earnings event:', error);
    throw error;
  }
} 