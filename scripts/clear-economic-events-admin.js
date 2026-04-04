const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../lib/firebase-admin.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearEconomicEvents() {
  try {
    console.log('🗑️  Clearing economic events using Admin SDK...');
    
    // Dates to clear (from your terminal output)
    const datesToClear = ['2025-07-15', '2025-07-18'];
    
    for (const date of datesToClear) {
      console.log(`📅 Clearing events for date: ${date}`);
      
      // Query for economic events on this date
      const eventsRef = db.collection('economic_events');
      const querySnapshot = await eventsRef.where('date', '==', date).get();
      
      console.log(`📊 Found ${querySnapshot.size} events for ${date}`);
      
      // Delete each event
      const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
        await docSnapshot.ref.delete();
        console.log(`✅ Deleted event: ${docSnapshot.data().event} at ${docSnapshot.data().time}`);
      });
      
      await Promise.all(deletePromises);
      console.log(`✅ Cleared all events for ${date}`);
    }
    
    console.log('🎉 All economic events cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing economic events:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
clearEconomicEvents(); 