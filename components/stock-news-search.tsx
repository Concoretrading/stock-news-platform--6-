import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchCatalysts() {
      try {
        setLoading(true)
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
          toast({ title: "Error", description: "Failed to fetch news data", variant: "destructive" })
        }
      } catch (error) {
        console.error('Error fetching catalysts:', error)
        toast({ title: "Error", description: "Failed to fetch news", variant: "destructive" })
        setAllEntries([])
      } finally {
        setLoading(false)
      }
    }

    fetchCatalysts()
  }, [ticker, toast])

  useEffect(() => {
    // Only include user-entered entries
    const userEntries = allEntries.filter(entry => entry.isManual)
    if (!searchQuery.trim()) {
      setFilteredEntries(userEntries)
    } else {
      const q = searchQuery.toLowerCase().trim()
      const filtered = userEntries.filter(entry => {
        const descriptionMatch = entry.description && entry.description.toLowerCase().includes(q)
        return descriptionMatch
      })
      setFilteredEntries(filtered)
    }
  }, [searchQuery, allEntries])

  const highlightMatch = (text: string | undefined | null, query: string) => {
    if (!text) return "";
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 px-1 rounded font-medium">{part}</mark> : part
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-4"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Input
          type="text"
          placeholder="Search catalysts by title, description, ticker, or source..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full"
        />
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        )}
      </div>
      
      <div className="space-y-4">
        {filteredEntries.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              {searchQuery ? `No catalysts found matching "${searchQuery}"` : "No catalysts found."}
            </div>
          </div>
        )}
        
        {filteredEntries.map(entry => (
          <Card key={entry.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {searchQuery ? highlightMatch(entry.title ?? "", searchQuery) : (entry.title ?? "")}
                </CardTitle>
                <Badge variant="secondary">{entry.date ?? "No date"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {entry.stockTickers && entry.stockTickers.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {entry.stockTickers.map((ticker, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {searchQuery ? highlightMatch(ticker ?? "", searchQuery) : (ticker ?? "")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {entry.description && (
                <div className="mb-3 text-sm text-muted-foreground">
                  {searchQuery ? highlightMatch(entry.description ?? "", searchQuery) : (entry.description ?? "")}
                </div>
              )}
              
              {entry.source && (
                <div className="text-xs text-muted-foreground mb-3">
                  Source: {searchQuery ? highlightMatch(entry.source ?? "", searchQuery) : (entry.source ?? "")}
                </div>
              )}
              
              {entry.imageUrl && <NewsImage imagePath={entry.imageUrl} source={entry.source} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 