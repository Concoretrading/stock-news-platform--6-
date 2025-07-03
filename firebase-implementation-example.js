// Example implementation for your stock news platform with Firebase

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';

// Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== AUTHENTICATION =====
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// ===== STOCK MANAGEMENT =====
export const addStockToWatchlist = async (ticker, companyName) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = await addDoc(collection(db, 'stocks'), {
      userId: user.uid,
      ticker: ticker.toUpperCase(),
      companyName,
      createdAt: new Date()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserStocks = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'stocks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting stocks:', error);
    return [];
  }
};

// ===== CATALYST MANAGEMENT =====
export const addManualCatalyst = async (title, description, date, stockTickers) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = await addDoc(collection(db, 'catalysts'), {
      userId: user.uid,
      title,
      description,
      date: new Date(date),
      stockTickers: stockTickers.map(t => t.toUpperCase()),
      isManual: true,
      createdAt: new Date()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addScreenshotCatalyst = async (imageUrl, extractedText, stockTickers) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = await addDoc(collection(db, 'catalysts'), {
      userId: user.uid,
      title: extractedText.substring(0, 100) + '...',
      description: extractedText,
      date: new Date(),
      stockTickers: stockTickers.map(t => t.toUpperCase()),
      imageUrl,
      isManual: false,
      createdAt: new Date()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserCatalysts = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'catalysts'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting catalysts:', error);
    return [];
  }
};

// Real-time listener for catalysts
export const subscribeToCatalysts = (callback) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  const q = query(
    collection(db, 'catalysts'),
    where('userId', '==', user.uid),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const catalysts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(catalysts);
  });
};

// ===== GOOGLE VISION INTEGRATION =====
// Keep your existing Google Vision API call
export const analyzeScreenshot = async (imageFile) => {
  try {
    // Your existing Google Vision API implementation
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch('/api/analyze-screenshot', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      // Extract tickers from the OCR result
      const tickers = extractTickersFromText(result.text);
      
      // Save the catalyst
      const catalystResult = await addScreenshotCatalyst(
        result.imageUrl, // URL where you stored the image
        result.text,
        tickers
      );

      return { success: true, tickers, catalystId: catalystResult.id };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper function to extract stock tickers from text
const extractTickersFromText = (text) => {
  // Simple regex to find stock tickers (words in all caps, 1-5 letters)
  const tickerRegex = /\b[A-Z]{1,5}\b/g;
  const matches = text.match(tickerRegex) || [];
  
  // Filter out common words that aren't tickers
  const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE'];
  
  return matches.filter(ticker => !commonWords.includes(ticker));
};

// ===== USAGE EXAMPLES =====

// Example: User signs up and adds a stock
const exampleUsage = async () => {
  // 1. Sign up
  const { user, error } = await signUp('user@example.com', 'password123');
  if (error) console.error('Sign up error:', error);

  // 2. Add stock to watchlist
  const stockResult = await addStockToWatchlist('AAPL', 'Apple Inc.');
  if (stockResult.success) {
    console.log('Stock added:', stockResult.id);
  }

  // 3. Add manual catalyst
  const catalystResult = await addManualCatalyst(
    'Apple Reports Strong Q4 Earnings',
    'Apple beat expectations with strong iPhone sales',
    '2024-01-15',
    ['AAPL']
  );
  if (catalystResult.success) {
    console.log('Catalyst added:', catalystResult.id);
  }

  // 4. Get all user's catalysts
  const catalysts = await getUserCatalysts();
  console.log('User catalysts:', catalysts);
};

export default {
  signUp,
  signIn,
  addStockToWatchlist,
  getUserStocks,
  addManualCatalyst,
  addScreenshotCatalyst,
  getUserCatalysts,
  subscribeToCatalysts,
  analyzeScreenshot
}; 