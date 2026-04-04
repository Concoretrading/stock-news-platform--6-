# Simple Stock News Platform with Firebase

## What You Get:
- Users sign up/login
- Add stocks to their watchlist
- Upload screenshots (analyzed by Google Vision)
- Manually enter news catalysts
- View all their catalysts organized by stock

## Setup Steps:

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable Authentication (Email/Password)
4. Create Firestore Database

### 2. Install Firebase in Your App
```bash
npm install firebase
```

### 3. Firebase Configuration
Create `lib/firebase.js`:
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 4. Database Structure (Firestore Collections)

**users** (auto-created by Firebase Auth)
- `uid` (auto-generated)
- `email`
- `displayName`

**stocks** (user's watchlist)
- `id` (auto-generated)
- `userId` (user's uid)
- `ticker` (e.g., "AAPL")
- `companyName` (e.g., "Apple Inc.")
- `createdAt`

**catalysts** (news entries)
- `id` (auto-generated)
- `userId` (user's uid)
- `stockTickers` (array of tickers this affects)
- `title` (headline)
- `description` (optional notes)
- `date` (when the news happened)
- `imageUrl` (if from screenshot)
- `isManual` (true if manually entered)
- `createdAt`

### 5. Key Functions You Need

**Add Stock to Watchlist:**
```javascript
import { collection, addDoc } from 'firebase/firestore';

const addStock = async (ticker, companyName) => {
  const user = auth.currentUser;
  await addDoc(collection(db, 'stocks'), {
    userId: user.uid,
    ticker: ticker.toUpperCase(),
    companyName,
    createdAt: new Date()
  });
};
```

**Add Manual Catalyst:**
```javascript
const addManualCatalyst = async (title, description, date, stockTickers) => {
  const user = auth.currentUser;
  await addDoc(collection(db, 'catalysts'), {
    userId: user.uid,
    title,
    description,
    date: new Date(date),
    stockTickers: stockTickers.map(t => t.toUpperCase()),
    isManual: true,
    createdAt: new Date()
  });
};
```

**Add Screenshot Catalyst:**
```javascript
const addScreenshotCatalyst = async (imageUrl, extractedText, stockTickers) => {
  const user = auth.currentUser;
  await addDoc(collection(db, 'catalysts'), {
    userId: user.uid,
    title: extractedText.substring(0, 100) + '...',
    description: extractedText,
    date: new Date(),
    stockTickers: stockTickers.map(t => t.toUpperCase()),
    imageUrl,
    isManual: false,
    createdAt: new Date()
  });
};
```

**Get User's Catalysts:**
```javascript
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const getUserCatalysts = async () => {
  const user = auth.currentUser;
  const q = query(
    collection(db, 'catalysts'),
    where('userId', '==', user.uid),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

### 6. Google Vision Integration
Keep your existing Google Vision API setup - it works perfectly with Firebase!

### 7. Security Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /stocks/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /catalysts/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Benefits of This Approach:
- ✅ Simple setup
- ✅ Built-in authentication
- ✅ Real-time updates
- ✅ Automatic user data isolation
- ✅ No complex database setup
- ✅ Works with your existing Google Vision
- ✅ Scales automatically

## Migration from Supabase:
1. Replace Supabase client with Firebase
2. Update auth calls
3. Replace database queries
4. Keep your existing UI components

This gives you exactly what you want: users can upload screenshots (analyzed by Google Vision), manually enter news, and see everything organized by their watchlist stocks! 