import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { NewsImage } from "./stock-news-history"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

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
    async function fetchCatalysts() {
      try {
        let url = '/api/catalysts'
        if (ticker) {
          url += `?ticker=${ticker.toUpperCase()}`
        }
        
        const response = await fetchWithAuth(url)
        const result = await response.json()
        
        if (result.success) {
          setAllEntries(result.data || [])
        } else {
          console.error('Failed to fetch catalysts:', result.error)
          setAllEntries([])
        }
      } catch (error) {
        console.error('Error fetching catalysts:', error)
        toast({ title: "Error", description: "Failed to fetch news" })
        setAllEntries([])
      }
    }

    fetchCatalysts()
  }, [ticker, toast])

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