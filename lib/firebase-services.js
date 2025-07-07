import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();
const auth = getAuth();

// ===== AUTHENTICATION =====
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Add 10 default stocks to the new user's watchlist
    const defaultStocks = [
      { ticker: 'AAPL', companyName: 'Apple Inc.' },
      { ticker: 'MSFT', companyName: 'Microsoft Corporation' },
      { ticker: 'GOOGL', companyName: 'Alphabet Inc.' },
      { ticker: 'AMZN', companyName: 'Amazon.com, Inc.' },
      { ticker: 'TSLA', companyName: 'Tesla, Inc.' },
      { ticker: 'NVDA', companyName: 'NVIDIA Corporation' },
      { ticker: 'META', companyName: 'Meta Platforms, Inc.' },
      { ticker: 'NFLX', companyName: 'Netflix, Inc.' },
      { ticker: 'AMD', companyName: 'Advanced Micro Devices, Inc.' },
      { ticker: 'INTC', companyName: 'Intel Corporation' },
    ];
    for (const stock of defaultStocks) {
      await addDoc(collection(db, 'stocks'), {
        userId: user.uid,
        ticker: stock.ticker,
        companyName: stock.companyName,
        createdAt: new Date()
      });
    }
    return { user, error: null };
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

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
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

export const deleteStock = async (stockId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, 'stocks', stockId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
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

export const deleteCatalyst = async (catalystId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, 'catalysts', catalystId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
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

// Real-time listener for stocks
export const subscribeToStocks = (callback) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  const q = query(
    collection(db, 'stocks'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const stocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(stocks);
  });
};

// Helper function to extract stock tickers from text
export const extractTickersFromText = (text) => {
  // Simple regex to find stock tickers (words in all caps, 1-5 letters)
  const tickerRegex = /\b[A-Z]{1,5}\b/g;
  const matches = text.match(tickerRegex) || [];
  
  // Filter out common words that aren't tickers
  const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE'];
  
  return matches.filter(ticker => !commonWords.includes(ticker));
};

// Get current user's Firebase ID token
export const getIdToken = async () => {
  const user = auth.currentUser;
  console.log('[getIdToken] auth.currentUser:', user, 'type:', typeof user);
  if (!user) return null;
  if (typeof user.getIdToken !== 'function') {
    console.error('[getIdToken] user.getIdToken is not a function:', user);
    return null;
  }
  // Always force refresh to get a new token
  return await user.getIdToken(true);
};

// ===== IMAGE UPLOAD =====
export const uploadImageToStorage = async (file, path) => {
  if (!file) throw new Error('No file provided');
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

/**
 * Saves a new news catalyst entry for a specific stock under the current user.
 * @param stockSymbol The ticker symbol of the stock (e.g., "AAPL", "GOOG").
 * @param catalystData An object containing the catalyst details.
 * @returns The ID of the newly created catalyst document, or null if an error occurred.
 */
export async function saveNewsCatalyst(stockSymbol, catalystData) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No user is signed in. Cannot save news catalyst.");
    return null;
  }
  const catalystsCollectionRef = collection(db, "catalysts");
  try {
    // Ensure date is saved as YYYY-MM-DD string
    let dateString = catalystData.date;
    if (dateString instanceof Date) {
      dateString = dateString.toISOString().split('T')[0];
    } else if (typeof dateString === 'string' && dateString.length > 10) {
      // If it's a stringified Date, convert to YYYY-MM-DD
      dateString = new Date(dateString).toISOString().split('T')[0];
    }
    // Ensure stockTickers is an array of uppercase strings
    let stockTickers = catalystData.stockTickers || [stockSymbol];
    if (!Array.isArray(stockTickers)) stockTickers = [stockTickers];
    stockTickers = stockTickers.map(t => t.toUpperCase());
    const docRef = await addDoc(catalystsCollectionRef, {
      ...catalystData,
      date: dateString,
      stockTickers,
      userId: user.uid,
      createdAt: new Date(),
    });
    console.log("News catalyst added with ID: ", docRef.id, " for stock:", stockSymbol);
    return docRef.id;
  } catch (e) {
    console.error("Error adding news catalyst:", e);
    return null;
  }
}

/**
 * Sets up a real-time listener for news catalysts of a specific stock,
 * filtered by the current user.
 *
 * @param stockSymbol The ticker symbol of the stock (e.g., "AAPL").
 * @param onCatalystsReceived A callback function that receives the list of catalysts.
 * @returns A function to unsubscribe from the listener.
 */
export function listenForStockCatalysts(
  stockSymbol,
  onCatalystsReceived
) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No user is signed in. Cannot retrieve news catalysts.");
    onCatalystsReceived([]);
    return () => {};
  }
  const q = query(
    collection(db, "catalysts"),
    where("userId", "==", user.uid),
    where("stockTickers", "array-contains", stockSymbol.toUpperCase()),
    orderBy("date", "desc")
  );
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const catalysts = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      catalysts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
      });
    });
    onCatalystsReceived(catalysts);
  }, (error) => {
    console.error("Error listening for stock catalysts:", error);
  });
  return unsubscribe;
}

/**
 * Create or update alert settings for a user and stock.
 * @param {string} ticker - Stock symbol (e.g., 'MSFT')
 * @param {number} tolerancePoints - How close to the start price to trigger an alert
 * @param {number} minimumMove - Only consider catalysts with this minimum move
 */
export const saveStockAlertSettings = async (ticker, tolerancePoints, minimumMove) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const docId = `${user.uid}_${ticker.toUpperCase()}`;
  const ref = doc(db, 'stock_alert_settings', docId);
  await setDoc(ref, {
    userId: user.uid,
    ticker: ticker.toUpperCase(),
    tolerancePoints,
    minimumMove,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  return { success: true };
}; 