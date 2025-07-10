// Function to clear all economic events via API
async function clearAllEconomicEvents() {
  try {
    console.log('🗑️  Checking all economic events via API...');
    
    // First, let's get all economic events to see what we have
    const response = await fetch('http://localhost:3000/api/upcoming-events');
    const data = await response.json();
    
    if (data && data.economic_events) {
      console.log(`📊 Found ${data.economic_events.length} total economic events`);
      
      // Show all events that will be deleted
      data.economic_events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.date} ${event.time}: ${event.event}`);
      });
      
      console.log('\n💡 To delete ALL these events, you can:');
      console.log('1. Go to Firebase Console > Firestore Database');
      console.log('2. Find the "economic_events" collection');
      console.log('3. Select ALL documents and delete them');
      console.log('4. Or use the Firebase CLI: firebase firestore:delete economic_events --recursive');
      console.log('\n⚠️  This will delete ALL economic events from your database!');
      
    } else {
      console.log('📊 No economic events found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative: Manually delete from Firebase Console');
    console.log('1. Go to Firebase Console > Firestore Database');
    console.log('2. Find the "economic_events" collection');
    console.log('3. Select ALL documents and delete them');
  }
}

// Run the script
clearAllEconomicEvents(); 