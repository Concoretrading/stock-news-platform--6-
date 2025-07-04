"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Calendar, Plus, Trash2, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { getDownloadURL, ref as storageRef } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { getFirestore, collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import AddCatalystForm from "./add-catalyst-form"
import { deleteCatalyst, getUserStocks } from "@/lib/firebase-services"
import { doc, updateDoc } from "firebase/firestore"

interface Catalyst {
  id: string
  date: string
  title: string
  description?: string
  imageUrl?: string
  isManual?: boolean
  createdAt?: string
  stockTickers?: string[]
}

interface NewsItem {
  id: string
  date: string
  headline: string
  notes?: string
  isManual?: boolean
  imageUrl?: string
  stockTickers?: string[]
}

interface MonthData {
  month: string
  year: number
  weeks: { [key: number]: NewsItem[] }
  isOpen: boolean
}

function getWeekOfMonth(date: Date) {
  const day = date.getDate()
  return Math.ceil(day / 7)
}

export function NewsImage({ imagePath }: { imagePath: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let isMounted = true
    if (imagePath) {
      getDownloadURL(storageRef(storage, imagePath))
        .then((downloadUrl) => { if (isMounted) setUrl(downloadUrl) })
        .catch(() => { if (isMounted) setUrl(null) })
    }
    return () => { isMounted = false }
  }, [imagePath])
  if (!url) return null
  return <img src={url} alt="Screenshot" className="mt-2 max-h-32 rounded" />
}

export function StockNewsHistory({ ticker }: { ticker?: string }) {
  const [monthsData, setMonthsData] = useState<MonthData[]>([])
  const [showAddForm, setShowAddForm] = useState<{ monthIdx: number, week: number } | null>(null)
  const [editEntry, setEditEntry] = useState<{ entry: NewsItem, monthIdx: number, week: number } | null>(null)
  const [userWatchlist, setUserWatchlist] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    let q = query(
      collection(db, "catalysts"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    if (ticker) {
      q = query(
        collection(db, "catalysts"),
        where("userId", "==", user.uid),
        where("stockTickers", "array-contains", ticker.toUpperCase()),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const catalysts: Catalyst[] = [];
      querySnapshot.forEach((doc) => {
        catalysts.push({ id: doc.id, ...doc.data() } as Catalyst);
      });

      // Always generate last 6 months
      const months: MonthData[] = [];
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleString("default", { month: "long" });
        months.push({
          month: monthName,
          year: date.getFullYear(),
          weeks: { 1: [], 2: [], 3: [], 4: [] },
          isOpen: false,
        });
      }
      catalysts.forEach((cat) => {
        let dateString = cat.date;
        if (!dateString && cat.createdAt) {
          // Fallback to createdAt if date missing
          if (typeof cat.createdAt === 'string') {
            dateString = cat.createdAt.split('T')[0];
          } else if (typeof cat.createdAt === 'object' && typeof (cat.createdAt as any).toDate === 'function') {
            dateString = (cat.createdAt as any).toDate().toISOString().split('T')[0];
          }
        }
        if (!dateString) {
          console.warn('Skipping catalyst with missing date:', cat);
          return;
        }
        const d = new Date(dateString);
        if (isNaN(d.getTime())) {
          console.warn('Skipping catalyst with invalid date:', cat, dateString);
          return;
        }
        const monthIndex = months.findIndex(
          (m) => m.year === d.getFullYear() && m.month === d.toLocaleString("default", { month: "long" })
        );
        if (monthIndex !== -1) {
          const week = getWeekOfMonth(d);
          months[monthIndex].weeks[week] = months[monthIndex].weeks[week] || [];
          months[monthIndex].weeks[week].push({
            id: cat.id,
            date: dateString,
            headline: cat.title,
            notes: cat.description,
            isManual: cat.isManual,
            imageUrl: cat.imageUrl,
            stockTickers: cat.stockTickers,
          });
        } else {
          console.warn('Could not assign catalyst to any month:', { id: cat.id, title: cat.title, dateString, parsedDate: d });
        }
      });
      setMonthsData(months);
    }, (error) => {
      toast({ title: "Error", description: error.message || "Failed to fetch news" });
    });
    return () => unsubscribe();
  }, [ticker, toast]);

  useEffect(() => {
    async function fetchWatchlist() {
      const stocks = await getUserStocks();
      const tickers = stocks.map((s: any) => (s.ticker || s.id).toUpperCase());
      setUserWatchlist(tickers);
    }
    fetchWatchlist();
  }, []);

  return (
    <div>
      <div className="space-y-4">
        {monthsData.map((month, monthIdx) => {
          // Calculate total entries for the month
          const monthTotal = Object.values(month.weeks).reduce((acc, newsItems) => acc + newsItems.length, 0);
          return (
            <Collapsible key={monthIdx} open={month.isOpen} onOpenChange={() => {
              const newMonthsData = [...monthsData]
              newMonthsData[monthIdx].isOpen = !newMonthsData[monthIdx].isOpen
              setMonthsData(newMonthsData)
            }}>
              <div className="flex items-center justify-between space-x-4 px-4">
                <h4 className="text-sm font-semibold">
                  {month.month} {month.year} <span className="text-xs text-muted-foreground">({monthTotal})</span>
                </h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <div className="space-y-2">
                {Object.entries(month.weeks).map(([week, newsItems]) => (
                  <div key={week}>
                    <h5 className="text-xs font-medium text-muted-foreground">
                      Week {week} <span className="text-xs">({newsItems.length})</span>
                    </h5>
                    <div className="space-y-1">
                      {newsItems.map((item) => (
                        <Card key={item.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>{item.headline}</CardTitle>
                              <Badge>{item.date}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-2 text-sm text-muted-foreground">
                              {item.stockTickers && item.stockTickers.join(", ")}
                            </div>
                            <div>{item.notes}</div>
                            {item.imageUrl && <NewsImage imagePath={item.imageUrl} />}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  )
}
