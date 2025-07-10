const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, '../concorenews-firebase-adminsdk.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'concorenews'
  });
} catch (error) {
  console.log('Firebase already initialized');
}

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
    console.log('\n💡 Alternative: Manually delete from Firebase Console');
    console.log('1. Go to Firebase Console > Firestore Database');
    console.log('2. Find the "economic_events" collection');
    console.log('3. Select ALL documents and delete them');
  } finally {
    process.exit(0);
  }
}

clearAllEconomicEvents(); 