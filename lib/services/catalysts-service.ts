import { getFirestore } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

// Helper function to get database safely
async function getDatabase() {
  return await getFirestore();
}

interface Catalyst {
  id: string;
  title: string;
  description?: string;
  stockTickers: string[];
  date: string;
  imageUrl?: string;
  isManual: boolean;
  createdAt: string;
  userId: string;
  priceBefore?: number;
  priceAfter?: number;
  source?: string;
}

export async function getCatalystsForUser(userId: string, ticker?: string): Promise<Catalyst[]> {
  try {
    const db = await getDatabase();
    let query = db.collection('catalysts').where('userId', '==', userId);
    
    if (ticker) {
      query = query.where('stockTickers', 'array-contains', ticker.toUpperCase());
    }
    
    const snapshot = await query.orderBy('date', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Catalyst));
  } catch (error) {
    console.error('Error fetching catalysts:', error);
    throw error;
  }
}

export async function addCatalyst(userId: string, catalystData: Omit<Catalyst, 'id' | 'userId' | 'createdAt'>): Promise<string> {
  try {
    const db = await getDatabase();
    const docRef = await db.collection('catalysts').add({
      ...catalystData,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding catalyst:', error);
    throw error;
  }
}

export async function deleteCatalyst(userId: string, catalystId: string): Promise<void> {
  try {
    const db = await getDatabase();
    const docRef = db.collection('catalysts').doc(catalystId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error('Catalyst not found');
    }
    
    const catalyst = doc.data();
    if (catalyst?.userId !== userId) {
      throw new Error('Unauthorized');
    }
    
    await docRef.delete();
  } catch (error) {
    console.error('Error deleting catalyst:', error);
    throw error;
  }
} 