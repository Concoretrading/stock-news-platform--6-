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

function NewsImage({ imagePath }: { imagePath: string }) {
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
      console.log('StockNewsHistory loaded watchlist:', tickers, stocks);
      setUserWatchlist(tickers);
    }
    fetchWatchlist();
  }, []);

  const toggleMonth = (index: number) => {
    setMonthsData((prev) => prev.map((month, i) => (i === index ? { ...month, isOpen: !month.isOpen } : month)))
  }

  const addMonth = () => {
    const newDate = new Date()
    newDate.setMonth(newDate.getMonth() - monthsData.length)
    const newMonth: MonthData = {
      month: newDate.toLocaleString("default", { month: "long" }),
      year: newDate.getFullYear(),
      weeks: { 1: [], 2: [], 3: [], 4: [] },
      isOpen: false,
    }
    setMonthsData((prev) => [...prev, newMonth])
    toast({
      title: "Month Added",
      description: `${newMonth.month} ${newMonth.year} has been added to the history.`,
    })
  }

  const deleteMonth = (index: number) => {
    const monthToDelete = monthsData[index]
    setMonthsData((prev) => prev.filter((_, i) => i !== index))
    toast({
      title: "Month Deleted",
      description: `${monthToDelete.month} ${monthToDelete.year} has been removed.`,
    })
  }

  const addNewsToWeek = (monthIndex: number, week: number) => {
    toast({
      title: "Add News Catalyst",
      description: `Add news catalyst for Week ${week} of ${monthsData[monthIndex].month}`,
    })
  }

  const editNews = (newsId: string) => {
    toast({
      title: "Edit News Catalyst",
      description: "Edit functionality coming soon...",
    })
  }

  const deleteNews = (monthIndex: number, week: number, newsId: string) => {
    setMonthsData((prev) =>
      prev.map((month, i) =>
        i === monthIndex
          ? {
              ...month,
              weeks: {
                ...month.weeks,
                [week]: month.weeks[week].filter((news) => news.id !== newsId),
              },
            }
          : month,
      ),
    )
    toast({
      title: "News Catalyst Deleted",
      description: "The news catalyst has been removed.",
    })
  }

  // Add or Edit form submit handler
  const handleFormSuccess = () => {
    setShowAddForm(null)
    setEditEntry(null)
  }

  // Delete news entry
  const handleDeleteNews = async (newsId: string) => {
    try {
      await deleteCatalyst(newsId)
      toast({ title: "News Catalyst Deleted", description: "The news catalyst has been removed." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete news catalyst." })
    }
  }

  // Edit news entry
  const handleEditNews = (entry: NewsItem, monthIdx: number, week: number) => {
    setEditEntry({ entry, monthIdx, week })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{ticker ? `${ticker} News Catalyst History` : "All News Catalysts"}</span>
          </CardTitle>
          <Button onClick={addMonth} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Month
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {monthsData.map((month: MonthData, monthIdx: number) => (
          <div key={month.month + month.year} className="border rounded-lg p-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleMonth(monthIdx)}>
              <div className="flex items-center space-x-2">
                {month.isOpen ? <ChevronDown /> : <ChevronRight />}
                <span className="font-semibold text-lg">{month.month} {month.year}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); deleteMonth(monthIdx); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {month.isOpen && (
              <div className="mt-4 space-y-2">
                {[1,2,3,4].map((week: number) => (
                  <div key={week} className="border rounded p-2 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Week {week}</span>
                    </div>
                    {month.weeks[week] && month.weeks[week].length > 0 && (
                      <ul className="mt-2 space-y-2">
                        {month.weeks[week].map((news: NewsItem) => (
                          <li key={news.id} className="border rounded p-2 flex flex-col">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-semibold">{news.headline}</span>
                                <span className="text-xs text-gray-500 ml-2">{news.date}</span>
                                {news.notes && <span className="text-sm mt-1 block">{news.notes}</span>}
                                {news.imageUrl && <NewsImage imagePath={news.imageUrl} />}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditNews(news, monthIdx, week)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteNews(news.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* Add News Button or Form */}
                    {showAddForm && showAddForm.monthIdx === monthIdx && showAddForm.week === week ? (
                      <AddCatalystForm
                        selectedStockSymbol={ticker || ""}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setShowAddForm(null)}
                        userWatchlist={userWatchlist}
                      />
                    ) : editEntry && editEntry.monthIdx === monthIdx && editEntry.week === week ? (
                      <AddCatalystForm
                        selectedStockSymbol={ticker || ""}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setEditEntry(null)}
                        userWatchlist={userWatchlist}
                        // You may need to add props to pre-fill the form with editEntry.entry
                        // e.g., initialValues={editEntry.entry}
                      />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setShowAddForm({ monthIdx, week })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add News
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
