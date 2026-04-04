const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../lib/firebase-admin.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearAllEconomicEvents() {
  try {
    console.log('🗑️  Clearing ALL economic events from Firestore...');
    
    // Get all economic events
    const eventsRef = db.collection('economic_events');
    const querySnapshot = await eventsRef.get();
    
    console.log(`📊 Found ${querySnapshot.size} total economic events to delete`);
    
    if (querySnapshot.size === 0) {
      console.log('✅ No economic events found to delete');
      return;
    }
    
    // Delete each event
    const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
      await docSnapshot.ref.delete();
      const data = docSnapshot.data();
      console.log(`✅ Deleted: ${data.event} on ${data.date}`);
    });
    
    await Promise.all(deletePromises);
    console.log('🎉 All economic events cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing economic events:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
clearAllEconomicEvents(); 