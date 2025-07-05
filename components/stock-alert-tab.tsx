"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase" // adjust if needed

// Types
interface Catalyst {
  id: string;
  title?: string;
  description?: string;
  priceBefore?: number;
  [key: string]: any;
}

interface Alert {
  id: string;
  userId: string;
  ticker: string;
  catalystId: string;
  minMove: number;
  direction: string;
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
  [key: string]: any;
}

// Function to get current price using your existing Alpaca API endpoint
async function getCurrentPrice(ticker: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/stock-prices?tickers=${ticker}`)
    if (!response.ok) {
      console.error(`Failed to fetch price for ${ticker}:`, response.status)
      return null
    }
    
    const data = await response.json()
    const priceData = data.prices?.[ticker]
    
    if (priceData && typeof priceData.price === 'number' && priceData.price > 0) {
      return priceData.price
    }
    
    console.warn(`No valid price data for ${ticker}:`, priceData)
    return null
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error)
    return null
  }
}

export function StockAlertTab({ ticker }: { ticker: string }) {
  const { user, loading } = useAuth();
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [alerts, setAlerts] = useState<Record<string, Alert>>({}); // Map of catalystId to alert
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!ticker) return;
    
    // Fetch current price
    setPriceLoading(true);
    getCurrentPrice(ticker).then((price) => {
      setCurrentPrice(price);
      setPriceLoading(false);
    }).catch((error) => {
      console.error('Error fetching current price:', error);
      setPriceLoading(false);
    });
    
    // Fetch catalysts
    async function fetchCatalysts() {
      const q = query(
        collection(db, "catalysts"),
        where("userId", "==", user!.uid),
        where("ticker", "==", ticker)
      );
      const snapshot = await getDocs(q);
      const entries: Catalyst[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCatalysts(entries);
    }
    fetchCatalysts();
    
    // Fetch alerts
    async function fetchAlerts() {
      const q = query(
        collection(db, "alerts"),
        where("userId", "==", user!.uid),
        where("ticker", "==", ticker)
      );
      const snapshot = await getDocs(q);
      const alertMap: Record<string, Alert> = {};
      snapshot.docs.forEach(doc => { alertMap[doc.data().catalystId] = { id: doc.id, ...doc.data() } as Alert; });
      setAlerts(alertMap);
    }
    fetchAlerts();
  }, [user, ticker]);

  // Sort and take 3 closest catalysts
  const closestCatalysts: Catalyst[] = (currentPrice !== null && catalysts.length > 0)
    ? [...catalysts]
        .filter(c => typeof c.priceBefore === 'number')
        .sort((a, b) => Math.abs((a.priceBefore ?? 0) - currentPrice) - Math.abs((b.priceBefore ?? 0) - currentPrice))
        .slice(0, 3)
    : [];

  const toggleAlert = async (catalyst: Catalyst, isActive: boolean) => {
    if (!user) return;
    const existing = alerts[catalyst.id];
    if (existing) {
      await updateDoc(doc(db, "alerts", existing.id), { isActive });
      setAlerts(a => ({ ...a, [catalyst.id]: { ...existing, isActive } }));
    } else {
      // Default minMove and direction; you can let user customize in UI
      const newAlert: Omit<Alert, "id"> = {
        userId: user.uid,
        ticker,
        catalystId: catalyst.id,
        minMove: 5,
        direction: "both",
        targetPrice: catalyst.priceBefore ?? 0,
        isActive,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "alerts"), newAlert);
      // Ensure the new alert is a valid Alert type
      setAlerts(a => ({ ...a, [catalyst.id]: { ...newAlert, id: docRef.id } as Alert }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Price Alerts for {ticker}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {priceLoading ? (
          <div>Loading current price...</div>
        ) : currentPrice === null ? (
          <div>Unable to fetch current price</div>
        ) : closestCatalysts.length === 0 ? (
          <div>No catalyst entries found for this stock.</div>
        ) : (
          <ul className="space-y-4">
            {closestCatalysts.map(c => (
              <li key={c.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="font-semibold">{c.description || c.title || "Catalyst"}</div>
                  <div className="text-sm text-muted-foreground">Price Before: {typeof c.priceBefore === 'number' ? c.priceBefore : 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">Current: {currentPrice.toFixed(2)} (Δ {typeof c.priceBefore === 'number' ? (currentPrice - c.priceBefore).toFixed(2) : 'N/A'})</div>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={alerts[c.id]?.isActive || false}
                    onChange={e => toggleAlert(c, e.target.checked)}
                  />
                  <span>{alerts[c.id]?.isActive ? "On" : "Off"}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
