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
  setDoc,
  DocumentData,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();
const auth = getAuth();

interface Stock {
  id?: string;
  userId: string;
  ticker: string;
  companyName: string;
  createdAt: Date;
}

interface Catalyst {
  id?: string;
  userId: string;
  title: string;
  description: string;
  date: Date;
  stockTickers: string[];
  imageUrl?: string;
  isManual: boolean;
  createdAt: Date;
}

interface AuthResult {
  user: User | null;
  error: string | null;
}

interface SignOutResult {
  success: boolean;
  error: string | null;
}

interface StockResult {
  success: boolean;
  id?: string;
  error?: string;
}

interface CatalystResult {
  success: boolean;
  id?: string;
  error?: string;
}

interface StockAlertSettings {
  ticker: string;
  tolerancePoints: number;
  minimumMove: number;
  userId: string;
  createdAt: Date;
}

// ===== AUTHENTICATION =====
export const signUp = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Add 10 default stocks to the new user's watchlist
    const defaultStocks: Omit<Stock, 'id' | 'userId' | 'createdAt'>[] = [
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
    return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const signOutUser = async (): Promise<SignOutResult> => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: User | null) => void): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};

// ===== STOCK MANAGEMENT =====
export const addStockToWatchlist = async (ticker: string, companyName: string): Promise<StockResult> => {
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
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getUserStocks = async (): Promise<Stock[]> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'stocks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stock));
  } catch (error) {
    console.error('Error getting stocks:', error);
    return [];
  }
};

export const deleteStock = async (stockId: string): Promise<StockResult> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, 'stocks', stockId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ===== CATALYST MANAGEMENT =====
export const addManualCatalyst = async (
  title: string,
  description: string,
  date: string | Date,
  stockTickers: string[]
): Promise<CatalystResult> => {
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
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const addScreenshotCatalyst = async (
  imageUrl: string,
  extractedText: string,
  stockTickers: string[]
): Promise<CatalystResult> => {
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
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getUserCatalysts = async (): Promise<Catalyst[]> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'catalysts'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Catalyst));
  } catch (error) {
    console.error('Error getting catalysts:', error);
    return [];
  }
};

export const deleteCatalyst = async (catalystId: string): Promise<CatalystResult> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, 'catalysts', catalystId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const subscribeToCatalysts = (callback: (catalysts: Catalyst[]) => void): Unsubscribe => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const q = query(
    collection(db, 'catalysts'),
    where('userId', '==', user.uid),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const catalysts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Catalyst));
    callback(catalysts);
  });
};

export const subscribeToStocks = (callback: (stocks: Stock[]) => void): Unsubscribe => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const q = query(
    collection(db, 'stocks'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const stocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stock));
    callback(stocks);
  });
};

export const extractTickersFromText = (text: string): string[] => {
  // Simple regex to find stock tickers (1-5 uppercase letters)
  const tickerRegex = /\b[A-Z]{1,5}\b/g;
  return Array.from(new Set(text.match(tickerRegex) || []));
};

export const getIdToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

export const uploadImageToStorage = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

interface NewsCatalystData {
  headline: string;
  body: string;
  date: string;
  imageUrl?: string;
  priceBefore?: number;
  priceAfter?: number;
  source?: string;
}

export async function saveNewsCatalyst(
  stockSymbol: string,
  catalystData: NewsCatalystData
): Promise<CatalystResult> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = await addDoc(collection(db, 'catalysts'), {
      userId: user.uid,
      stockTickers: [stockSymbol.toUpperCase()],
      title: catalystData.headline,
      description: catalystData.body,
      date: new Date(catalystData.date),
      imageUrl: catalystData.imageUrl || null,
      priceBefore: catalystData.priceBefore || null,
      priceAfter: catalystData.priceAfter || null,
      source: catalystData.source || 'Manual Entry',
      isManual: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function listenForStockCatalysts(
  stockSymbol: string,
  onCatalystsReceived: (catalysts: Catalyst[]) => void
): Unsubscribe {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const q = query(
    collection(db, 'catalysts'),
    where('userId', '==', user.uid),
    where('stockTickers', 'array-contains', stockSymbol.toUpperCase()),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const catalysts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Catalyst));
    onCatalystsReceived(catalysts);
  });
}

export const saveStockAlertSettings = async (
  ticker: string,
  tolerancePoints: number,
  minimumMove: number
): Promise<StockResult> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const alertSettings: StockAlertSettings = {
      ticker: ticker.toUpperCase(),
      tolerancePoints,
      minimumMove,
      userId: user.uid,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'stock_alert_settings'), alertSettings);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 