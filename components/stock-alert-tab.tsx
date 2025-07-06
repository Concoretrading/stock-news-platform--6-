"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Bell, Settings, Save, TrendingUp, TrendingDown } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

// Types
interface Catalyst {
  id: string;
  title?: string;
  description?: string;
  priceBefore?: number;
  priceAfter?: number;
  date?: string;
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

interface AlertPreferences {
  minimumMovement: number;
  proximityPoints: number;
  relevanceCriteria: {
    earnings: boolean;
    productLaunches: boolean;
    partnerships: boolean;
    regulatory: boolean;
    financial: boolean;
    other: boolean;
  };
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
  const { toast } = useToast();
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [alerts, setAlerts] = useState<Record<string, Alert>>({});
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [preferences, setPreferences] = useState<AlertPreferences>({
    minimumMovement: 5.0,
    proximityPoints: 2.0,
    relevanceCriteria: {
      earnings: true,
      productLaunches: true,
      partnerships: true,
      regulatory: true,
      financial: true,
      other: true,
    },
  });
  const [savedPreferences, setSavedPreferences] = useState<AlertPreferences | null>(null);

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

  // Filter and sort catalysts based on saved preferences (only after user clicks save)
  const filteredCatalysts: Catalyst[] = (currentPrice !== null && catalysts.length > 0 && savedPreferences)
    ? [...catalysts]
        .filter(c => {
          // Check if catalyst meets minimum movement requirement
          if (c.priceBefore && c.priceAfter) {
            const movement = Math.abs(c.priceAfter - c.priceBefore);
            if (movement < savedPreferences.minimumMovement) return false;
          }
          
          // Check if catalyst type is selected in relevance criteria
          const catalystType = c.title?.toLowerCase() || c.description?.toLowerCase() || '';
          const hasEarnings = catalystType.includes('earnings') || catalystType.includes('quarterly') || catalystType.includes('q1') || catalystType.includes('q2') || catalystType.includes('q3') || catalystType.includes('q4');
          const hasProductLaunch = catalystType.includes('launch') || catalystType.includes('product') || catalystType.includes('release');
          const hasPartnership = catalystType.includes('partnership') || catalystType.includes('deal') || catalystType.includes('agreement') || catalystType.includes('acquisition');
          const hasRegulatory = catalystType.includes('fda') || catalystType.includes('approval') || catalystType.includes('regulation') || catalystType.includes('legal');
          const hasFinancial = catalystType.includes('revenue') || catalystType.includes('profit') || catalystType.includes('financial') || catalystType.includes('guidance');
          
          if (hasEarnings && !savedPreferences.relevanceCriteria.earnings) return false;
          if (hasProductLaunch && !savedPreferences.relevanceCriteria.productLaunches) return false;
          if (hasPartnership && !savedPreferences.relevanceCriteria.partnerships) return false;
          if (hasRegulatory && !savedPreferences.relevanceCriteria.regulatory) return false;
          if (hasFinancial && !savedPreferences.relevanceCriteria.financial) return false;
          if (!hasEarnings && !hasProductLaunch && !hasPartnership && !hasRegulatory && !hasFinancial && !savedPreferences.relevanceCriteria.other) return false;
          
          return true;
        })
        .sort((a, b) => {
          // Sort by proximity to current price
          const aDistance = Math.abs((a.priceBefore ?? 0) - currentPrice);
          const bDistance = Math.abs((b.priceBefore ?? 0) - currentPrice);
          return aDistance - bDistance;
        })
        .slice(0, 3)
    : [];

  const toggleAlert = async (catalyst: Catalyst, isActive: boolean) => {
    if (!user) return;
    const existing = alerts[catalyst.id];
    if (existing) {
      await updateDoc(doc(db, "alerts", existing.id), { isActive });
      setAlerts(a => ({ ...a, [catalyst.id]: { ...existing, isActive } }));
    } else {
      const newAlert: Omit<Alert, "id"> = {
        userId: user.uid,
        ticker,
        catalystId: catalyst.id,
        minMove: preferences.minimumMovement,
        direction: "both",
        targetPrice: catalyst.priceBefore ?? 0,
        isActive,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "alerts"), newAlert);
      setAlerts(a => ({ ...a, [catalyst.id]: { ...newAlert, id: docRef.id } as Alert }));
    }
  };

  const handlePreferenceChange = (key: keyof AlertPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleRelevanceChange = (key: keyof AlertPreferences['relevanceCriteria'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      relevanceCriteria: { ...prev.relevanceCriteria, [key]: value }
    }));
  };

  const savePreferences = () => {
    setSavedPreferences(preferences);
    toast({
      title: "Preferences Updated",
      description: "Finding catalysts that match your criteria...",
    });
  };

  return (
    <div className="space-y-6">
      {/* Customization Panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Settings className="h-5 w-5" />
            <span>Customize Your Alerts</span>
          </CardTitle>
          <p className="text-sm text-blue-700">
            Set your preferences to see the most relevant catalysts for {ticker}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Movement and Proximity Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minMovement" className="text-blue-900 font-medium">
                Minimum Movement (Points)
              </Label>
              <Input
                id="minMovement"
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={preferences.minimumMovement}
                onChange={(e) => handlePreferenceChange("minimumMovement", parseFloat(e.target.value) || 0)}
                className="border-blue-300 focus:border-blue-600"
              />
              <p className="text-xs text-blue-600">
                Only show catalysts that moved {ticker} by {preferences.minimumMovement}+ points
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proximity" className="text-blue-900 font-medium">
                Proximity Alert (Points)
              </Label>
              <Input
                id="proximity"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={preferences.proximityPoints}
                onChange={(e) => handlePreferenceChange("proximityPoints", parseFloat(e.target.value) || 0)}
                className="border-blue-300 focus:border-blue-600"
              />
              <p className="text-xs text-blue-600">
                Alert when {ticker} is within ±{preferences.proximityPoints} points of catalyst price
              </p>
            </div>
          </div>

          {/* Relevance Criteria */}
          <div>
            <Label className="text-blue-900 font-medium mb-3 block">Relevance Criteria</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                <Switch
                  checked={preferences.relevanceCriteria.earnings}
                  onCheckedChange={(value) => handleRelevanceChange("earnings", value)}
                />
                <span className="text-sm font-medium">Earnings</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                <Switch
                  checked={preferences.relevanceCriteria.productLaunches}
                  onCheckedChange={(value) => handleRelevanceChange("productLaunches", value)}
                />
                <span className="text-sm font-medium">Product Launches</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                <Switch
                  checked={preferences.relevanceCriteria.partnerships}
                  onCheckedChange={(value) => handleRelevanceChange("partnerships", value)}
                />
                <span className="text-sm font-medium">Partnerships</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                <Switch
                  checked={preferences.relevanceCriteria.regulatory}
                  onCheckedChange={(value) => handleRelevanceChange("regulatory", value)}
                />
                <span className="text-sm font-medium">Regulatory</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                <Switch
                  checked={preferences.relevanceCriteria.financial}
                  onCheckedChange={(value) => handleRelevanceChange("financial", value)}
                />
                <span className="text-sm font-medium">Financial</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                <Switch
                  checked={preferences.relevanceCriteria.other}
                  onCheckedChange={(value) => handleRelevanceChange("other", value)}
                />
                <span className="text-sm font-medium">Other</span>
              </div>
            </div>
          </div>

          <Button onClick={savePreferences} className="bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 h-4 w-4" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Filtered Catalysts */}
      <Card>
                  <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Top 3 Relevant Catalysts for {ticker}</span>
              {savedPreferences && <Badge variant="secondary">{filteredCatalysts.length} found</Badge>}
            </CardTitle>
            {savedPreferences ? (
              <p className="text-sm text-muted-foreground">
                Based on your preferences: {savedPreferences.minimumMovement}+ point moves, within ±{savedPreferences.proximityPoints} points of current price
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click "Save Preferences" above to see matching catalysts
              </p>
            )}
          </CardHeader>
        <CardContent>
          {priceLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading current price...</p>
            </div>
          ) : currentPrice === null ? (
            <div className="text-center py-8 text-red-600">
              Unable to fetch current price
            </div>
          ) : !savedPreferences ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Set your preferences first</p>
              <p className="text-sm text-gray-500">
                Configure your criteria above and click "Save Preferences" to see matching catalysts
              </p>
            </div>
          ) : filteredCatalysts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No catalysts match your criteria</p>
              <p className="text-sm text-gray-500">
                Try adjusting your minimum movement or relevance criteria above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCatalysts.map((catalyst, index) => {
                const priceBefore = catalyst.priceBefore || 0;
                const priceAfter = catalyst.priceAfter || 0;
                const movement = priceAfter - priceBefore;
                                 const distance = Math.abs(priceBefore - currentPrice);
                 const isInRange = distance <= savedPreferences.proximityPoints;
                
                return (
                  <Card key={catalyst.id} className={`border-2 ${isInRange ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                            <Badge variant={isInRange ? "default" : "secondary"} className="text-xs">
                              {isInRange ? "In Range" : `${distance.toFixed(1)} pts away`}
                            </Badge>
                            <Badge
                              variant={movement > 0 ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {movement > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                              {movement > 0 ? "+" : ""}{movement.toFixed(1)} pts
                            </Badge>
                          </div>
                          
                          <h4 className="font-semibold text-lg mb-1">
                            {catalyst.description || catalyst.title || "Catalyst"}
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                            <div>
                              <span className="font-medium">Target Price:</span> ${priceBefore.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-medium">Current Price:</span> ${currentPrice.toFixed(2)}
                            </div>
                          </div>
                          
                          {catalyst.date && (
                            <p className="text-xs text-gray-500">
                              Date: {new Date(catalyst.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={alerts[catalyst.id]?.isActive || false}
                            onCheckedChange={(checked) => toggleAlert(catalyst, checked)}
                            className="scale-125"
                          />
                          <span className="text-sm font-medium text-white">
                            {alerts[catalyst.id]?.isActive ? "ON" : "OFF"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
