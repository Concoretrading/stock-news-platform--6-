import React, { useState, useEffect } from "react"
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

// ErrorBoundary for bulletproof error handling
class SearchErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('StockNewsSearch error boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-6">
          <div>
            <Input type="text" placeholder="Search catalysts by description..." className="w-full" disabled />
          </div>
          <div className="text-center py-8">
            <div className="text-red-600 font-semibold">Unexpected error: {String(this.state.error)}</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function StockNewsSearch({ ticker }: { ticker?: string }) {
  const [allEntries, setAllEntries] = useState<Catalyst[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEntries, setFilteredEntries] = useState<Catalyst[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast()

  useEffect(() => {
    async function fetchCatalysts() {
      try {
        setLoading(true)
        setError(null)
        let url = '/api/catalysts'
        if (ticker) {
          url += `?ticker=${ticker.toUpperCase()}`
        }
        
        const response = await fetchWithAuth(url)
        let result: any = null;
        try {
          result = await response.json()
        } catch (jsonErr) {
          setAllEntries([])
          setError('Failed to parse news data')
          console.error('Failed to parse catalysts JSON:', jsonErr)
          return;
        }
        console.log('Full API response:', result)
        if (result && result.success === true && Array.isArray(result.data)) {
          setAllEntries(result.data)
          console.log('Fetched catalysts:', result.data)
        } else if (result && result.error) {
          setAllEntries([])
          setError(result.error)
          console.error('Failed to fetch catalysts:', result.error)
        } else {
          setAllEntries([])
          setError('Unexpected API response')
          console.error('Unexpected API response:', result)
        }
      } catch (error) {
        setAllEntries([])
        setError('Failed to fetch news')
        console.error('Error fetching catalysts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCatalysts()
  }, [ticker, toast])

  useEffect(() => {
    // Only include user-entered entries with a non-empty description
    const userEntries = Array.isArray(allEntries)
      ? allEntries.filter(entry => entry.isManual && typeof entry.description === 'string' && entry.description.trim().length > 0)
      : [];
    if (!searchQuery.trim()) {
      setFilteredEntries(userEntries)
    } else {
      const q = searchQuery.toLowerCase().trim()
      const filtered = userEntries.filter(entry => {
        return (entry.description as string).toLowerCase().includes(q)
      })
      setFilteredEntries(filtered)
    }
    console.log('allEntries:', allEntries)
    console.log('filteredEntries:', userEntries)
  }, [searchQuery, allEntries])

  // Extra defensive highlightMatch
  const highlightMatch = (text: string | undefined | null, query: string) => {
    if (typeof text !== 'string' || !text) return "";
    if (!query || typeof query !== 'string' || !query.trim()) return text;
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) => {
        if (regex.test(part)) {
          return <mark key={i} className="bg-yellow-200 px-1 rounded font-medium">{part}</mark>;
        }
        return part;
      });
    } catch (e) {
      console.error('Highlight match error:', e);
      return text;
    }
  };

  // Fallback error boundary
  return (
    <SearchErrorBoundary>
      <div className="space-y-6">
        <div>
          <Input
            type="text"
            placeholder="Search catalysts by description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full"
          />
          {searchQuery && Array.isArray(filteredEntries) && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>
        {loading ? (
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
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 font-semibold">{error}</div>
          </div>
        ) : !Array.isArray(filteredEntries) || filteredEntries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">No results found.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Log all ids before rendering */}
            {(() => { console.log('Rendering catalyst entry ids:', filteredEntries.map(e => e && typeof e.id === 'string' ? e.id : '[INVALID]'), 'Types:', filteredEntries.map(e => typeof e.id)); return null; })()}
            {filteredEntries.map((entry) => {
              // Only render entries with a valid id (string or convertible)
              let safeId = typeof entry.id === 'string' ? entry.id : ((entry as any).id && typeof (entry as any).id === 'object' && typeof (entry as any).id.toString === 'function' ? (entry as any).id.toString() : String((entry as any).id));
              if (!entry || !safeId || typeof safeId !== 'string' || !safeId.trim()) {
                console.warn('Skipping entry with invalid id:', entry);
                return null;
              }
              return (
                <Card key={safeId} className="hover:shadow-md transition-shadow bg-gray-50 dark:bg-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {searchQuery && entry.description 
                          ? highlightMatch(entry.description, searchQuery) 
                          : (entry.description || "No description")}
                      </CardTitle>
                      <Badge variant="secondary">{entry.date || "No date"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {entry.stockTickers && Array.isArray(entry.stockTickers) && entry.stockTickers.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {entry.stockTickers.map((ticker, tickerIndex) => (
                            <Badge key={tickerIndex} variant="outline" className="text-xs">
                              {ticker || ""}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.source && (
                      <div className="text-xs text-muted-foreground mb-3">
                        Source: {entry.source}
                      </div>
                    )}
                    {/* NewsImage fallback */}
                    {entry.imageUrl ? (
                      <NewsImage imagePath={entry.imageUrl} source={entry.source} />
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SearchErrorBoundary>
  );
} 