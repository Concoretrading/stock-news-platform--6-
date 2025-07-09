import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getFirestore, collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { NewsImage } from "./stock-news-history"

interface Catalyst {
  id: string
  title: string
  description?: string
  priceBefore?: number
  priceAfter?: number
  source?: string
  imageUrl?: string
  date: string
  createdAt: string
  stockTickers?: string[]
  isManual?: boolean
}

export function StockNewsSearch({ ticker }: { ticker?: string }) {
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
              {entry.imageUrl && <NewsImage imagePath={entry.imageUrl} source={entry.source} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 