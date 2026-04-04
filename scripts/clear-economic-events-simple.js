// Function to clear economic events by making API calls
async function clearEconomicEvents() {
  try {
    console.log('🗑️  Checking economic events via API...');
    
    // First, let's get all economic events to see what we have
    const response = await fetch('http://localhost:3000/api/upcoming-events');
    const data = await response.json();
    
    if (data && data.economic_events) {
      console.log(`📊 Found ${data.economic_events.length} total economic events`);
      
      // Filter events for the dates we want to clear
      const datesToClear = ['2025-07-15', '2025-07-18'];
      const eventsToDelete = data.economic_events.filter(event => 
        datesToClear.includes(event.date)
      );
      
      console.log(`🗑️  Found ${eventsToDelete.length} events to delete for dates: ${datesToClear.join(', ')}`);
      
      // Show what we found
      eventsToDelete.forEach(event => {
        console.log(`- ${event.date} ${event.time}: ${event.event}`);
      });
      
      console.log('\n💡 To delete these events, you can:');
      console.log('1. Go to Firebase Console > Firestore Database');
      console.log('2. Find the "economic_events" collection');
      console.log('3. Delete the documents for dates 2025-07-15 and 2025-07-18');
      console.log('4. Or use the Firebase CLI: firebase firestore:delete economic_events');
      
    } else {
      console.log('📊 No economic events found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative: Manually delete from Firebase Console');
    console.log('1. Go to Firebase Console > Firestore Database');
    console.log('2. Find the "economic_events" collection');
    console.log('3. Delete documents for dates 2025-07-15 and 2025-07-18');
  }
}

// Run the script
clearEconomicEvents(); 