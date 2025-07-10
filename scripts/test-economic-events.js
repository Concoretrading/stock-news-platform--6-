const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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

async function addSampleEconomicEvents() {
  try {
    const sampleEvents = [
      {
        date: '2025-01-15',
        time: '08:30',
        event: 'Consumer Price Index',
        country: 'United States',
        currency: 'USD',
        importance: 'HIGH',
        actual: '0.3%',
        forecast: '0.2%',
        previous: '0.1%',
        iconUrl: '/images/econ/cpi.png',
        type: 'economic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        date: '2025-01-16',
        time: '10:00',
        event: 'Retail Sales',
        country: 'United States',
        currency: 'USD',
        importance: 'HIGH',
        actual: '0.4%',
        forecast: '0.3%',
        previous: '0.2%',
        iconUrl: '/images/econ/retail-sales.png',
        type: 'economic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        date: '2025-01-17',
        time: '08:30',
        event: 'Initial Jobless Claims',
        country: 'United States',
        currency: 'USD',
        importance: 'MEDIUM',
        actual: '210K',
        forecast: '215K',
        previous: '218K',
        iconUrl: '/images/econ/jobless-claims.png',
        type: 'economic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        date: '2025-01-20',
        time: '14:00',
        event: 'Fed Beige Book',
        country: 'United States',
        currency: 'USD',
        importance: 'HIGH',
        actual: null,
        forecast: null,
        previous: null,
        iconUrl: '/images/econ/beige-book.png',
        type: 'economic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        date: '2025-01-22',
        time: '08:30',
        event: 'Housing Starts',
        country: 'United States',
        currency: 'USD',
        importance: 'MEDIUM',
        actual: '1.35M',
        forecast: '1.32M',
        previous: '1.30M',
        iconUrl: '/images/econ/housing-starts.png',
        type: 'economic',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('Adding sample economic events...');
    
    for (const event of sampleEvents) {
      const docRef = await addDoc(collection(db, 'economic_events'), event);
      console.log(`✅ Added event: ${event.event} on ${event.date} (ID: ${docRef.id})`);
    }
    
    console.log('✅ All sample economic events added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample events:', error);
  }
}

// Run the function
addSampleEconomicEvents(); 