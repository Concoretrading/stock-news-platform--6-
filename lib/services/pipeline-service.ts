import { getFirestore } from '@/lib/firebase-admin';

// Helper function to get database safely  
async function getDatabase() {
  return await getFirestore();
}

export async function updatePriceAndCheckAlerts(ticker: string, price: number) {
  try {
    const db = await getDatabase();
    
    // Simple mock pipeline processing
    const result = {
      processed: 1,
      success: 1,
      errors: 0,
      ticker,
      price,
      alertsTriggered: 0
    };
    
    return result;
  } catch (error) {
    console.error('Error in pipeline processing:', error);
    throw error;
  }
} 