const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearEconomicEvents() {
  try {
    console.log('🗑️  Clearing economic events...');
    
    // Dates to clear (from your terminal output)
    const datesToClear = ['2025-07-15', '2025-07-18'];
    
    for (const date of datesToClear) {
      console.log(`📅 Clearing events for date: ${date}`);
      
      // Query for economic events on this date
      const eventsRef = collection(db, 'economic_events');
      const q = query(eventsRef, where('date', '==', date));
      const querySnapshot = await getDocs(q);
      
      console.log(`📊 Found ${querySnapshot.size} events for ${date}`);
      
      // Delete each event
      const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
        await deleteDoc(doc(db, 'economic_events', docSnapshot.id));
        console.log(`✅ Deleted event: ${docSnapshot.data().event} at ${docSnapshot.data().time}`);
      });
      
      await Promise.all(deletePromises);
      console.log(`✅ Cleared all events for ${date}`);
    }
    
    console.log('🎉 All economic events cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing economic events:', error);
  }
}

// Run the script
clearEconomicEvents(); 