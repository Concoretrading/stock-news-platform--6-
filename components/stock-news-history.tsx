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
  const [allEntries, setAllEntries] = useState<Catalyst[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEntries, setFilteredEntries] = useState<Catalyst[]>([])
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
      setAllEntries(catalysts);
    }, (error) => {
      toast({ title: "Error", description: error.message || "Failed to fetch news" });
    });
    return () => unsubscribe();
  }, [ticker, toast]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredEntries(allEntries)
    } else {
      const q = searchQuery.toLowerCase()
      setFilteredEntries(
        allEntries.filter(entry =>
          (entry.title && entry.title.toLowerCase().includes(q)) ||
          (entry.description && entry.description.toLowerCase().includes(q)) ||
          (entry.stockTickers && entry.stockTickers.some(t => t.toLowerCase().includes(q)))
        )
      )
    }
  }, [searchQuery, allEntries])

  return (
    <div>
      <input
        type="text"
        className="w-full border rounded px-3 py-2 mb-4"
        placeholder="Type keywords to search..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <div className="space-y-4">
        {filteredEntries.length === 0 && (
          <div className="text-muted-foreground text-center">No entries found.</div>
        )}
        {filteredEntries.map(entry => (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{entry.title}</CardTitle>
                <Badge>{entry.date}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-sm text-muted-foreground">
                {entry.stockTickers && entry.stockTickers.join(", ")}
              </div>
              <div>{entry.description}</div>
              {entry.imageUrl && <NewsImage imagePath={entry.imageUrl} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
