"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Calendar, Plus, Trash2, Edit, Download, Undo2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { getDownloadURL, ref as storageRef } from "firebase/storage"
import { storage } from "@/lib/firebase"
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import AddCatalystForm from "./add-catalyst-form"
import { deleteCatalyst, getUserStocks } from "@/lib/firebase-services"
import { updateDoc } from "firebase/firestore"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TrashIcon,
  CalendarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline"
import { ToastAction } from "@/components/ui/toast"
import { DateDebugPanel } from "./date-debug-panel"

// Utility function for date debugging
const debugDateInfo = (dateString: string, context: string) => {
  const date = new Date(dateString + 'T00:00:00.000Z');
  console.log(`Date debug [${context}]:`, {
    original: dateString,
    parsed: date.toISOString(),
    local: date.toLocaleDateString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  return date;
};

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

export function StockNewsHistory({ ticker = "all", searchQuery, refreshKey }: { ticker?: string, searchQuery?: string, refreshKey?: number }) {
  const [catalysts, setCatalysts] = useState<Catalyst[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set())
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState<string | null>(null)
  const [showAddMonthForm, setShowAddMonthForm] = useState(false)
  const [deletedMonths, setDeletedMonths] = useState<Set<string>>(new Set())
  const [customMonths, setCustomMonths] = useState<Date[]>([])
  const { toast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{title: string, description?: string, source?: string}>({title: ""})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [undoData, setUndoData] = useState<Catalyst | null>(null)
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null)

  // Generate the default 6 months
  const generateDefault6Months = () => {
    const months = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(monthDate)
    }
    return months
  }

  // Get all visible months (default - deleted + custom)
  const getAllVisibleMonths = () => {
    const defaultMonths = generateDefault6Months()
    const visibleDefaultMonths = defaultMonths.filter((month) => {
      const monthKey = format(month, "yyyy-MM")
      return !deletedMonths.has(monthKey)
    })
    const allMonths = [...visibleDefaultMonths, ...customMonths]
    const uniqueMonths = allMonths.filter(
      (month, index, arr) => arr.findIndex((m) => format(m, "yyyy-MM") === format(month, "yyyy-MM")) === index,
    )
    return uniqueMonths.sort((a, b) => b.getTime() - a.getTime())
  }

  // Generate exactly 4 weeks per month
  const generateWeeksForMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const weeks = []
    weeks.push({ start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1), end: new Date(monthStart.getFullYear(), monthStart.getMonth(), 7) })
    weeks.push({ start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 8), end: new Date(monthStart.getFullYear(), monthStart.getMonth(), 14) })
    weeks.push({ start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 15), end: new Date(monthStart.getFullYear(), monthStart.getMonth(), 21) })
    weeks.push({ start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 22), end: monthEnd })
    return weeks
  }

  // Auto-open current month
  useEffect(() => {
    const currentMonth = format(new Date(), "yyyy-MM")
    setOpenMonths(new Set([currentMonth]))
  }, [])

  useEffect(() => {
    async function fetchTimelinePrefs() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const db = getFirestore();
      const prefsRef = doc(db, "users", user.uid, "timelinePrefs", "prefs");
      const prefsSnap = await getDoc(prefsRef);
      if (prefsSnap.exists()) {
        const data = prefsSnap.data();
        setCustomMonths((data.customMonths || []).map((m: string) => new Date(m + "-01")));
        setDeletedMonths(new Set(data.deletedMonths || []));
      }
    }
    fetchTimelinePrefs();
  }, []);

  async function saveTimelinePrefs(newCustomMonths: Date[], newDeletedMonths: Set<string>) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const db = getFirestore();
    const prefsRef = doc(db, "users", user.uid, "timelinePrefs", "prefs");
    await setDoc(prefsRef, {
      customMonths: newCustomMonths.map(m => `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`),
      deletedMonths: Array.from(newDeletedMonths),
    });
  }

  const loadCatalysts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchWithAuth(`/api/catalysts${ticker ? `?ticker=${ticker}` : ""}`)
      if (!response.ok) {
        setCatalysts([])
        return
      }
      const data = await response.json()
      if (data.success) {
        const catalystsData = data.data || [];
        console.log("Loaded catalysts:", {
          count: catalystsData.length,
          ticker: ticker,
          sampleDates: catalystsData.slice(0, 3).map((c: any) => c.date)
        });
        
        // Debug date information for first few catalysts
        catalystsData.slice(0, 3).forEach((catalyst: any, index: number) => {
          debugDateInfo(catalyst.date, `catalyst-${index}`);
        });
        
        setCatalysts(catalystsData)
      } else {
        setCatalysts([])
      }
    } catch (error) {
      console.error("Error loading catalysts:", error);
      setCatalysts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCatalysts()
  }, [ticker, refreshKey])

  const toggleMonth = (monthKey: string) => {
    const newOpenMonths = new Set(openMonths)
    if (newOpenMonths.has(monthKey)) {
      newOpenMonths.delete(monthKey)
      const newOpenWeeks = new Set(openWeeks)
      Array.from(openWeeks).forEach((weekKey) => {
        if (weekKey.startsWith(monthKey)) {
          newOpenWeeks.delete(weekKey)
        }
      })
      setOpenWeeks(newOpenWeeks)
    } else {
      newOpenMonths.add(monthKey)
    }
    setOpenMonths(newOpenMonths)
  }

  const toggleWeek = (weekKey: string) => {
    const newOpenWeeks = new Set(openWeeks)
    if (newOpenWeeks.has(weekKey)) {
      newOpenWeeks.delete(weekKey)
    } else {
      newOpenWeeks.add(weekKey)
    }
    setOpenWeeks(newOpenWeeks)
  }

  // Filter catalysts by search query if provided
  const filteredCatalysts = searchQuery && searchQuery.trim().length > 0
    ? catalysts.filter((c: Catalyst) =>
        (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : catalysts

  const getCatalystsForWeek = (weekStart: Date, weekEnd: Date) => {
    console.log("Filtering catalysts for week:", {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalCatalysts: filteredCatalysts.length
    });
    
    const weekCatalysts = filteredCatalysts.filter((catalyst) => {
      const catalystDate = new Date(catalyst.date + 'T00:00:00.000Z'); // Ensure UTC parsing
      const isInWeek = isWithinInterval(catalystDate, { start: weekStart, end: weekEnd });
      
      // Debug logging for date matching
      if (catalyst.stockTickers?.length) {
        console.log("Catalyst date check:", {
          ticker: catalyst.stockTickers[0],
          catalystDate: catalyst.date,
          parsedDate: catalystDate.toISOString(),
          isInWeek,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString()
        });
      }
      
      return isInWeek;
    });
    
    console.log("Catalysts found for week:", weekCatalysts.length);
    return weekCatalysts;
  }

  const handleCatalystAdded = () => {
    setShowAddForm(null)
    loadCatalysts()
  }

  const handleCatalystUpdated = () => {
    loadCatalysts()
  }

  const handleCatalystDeleted = () => {
    loadCatalysts()
  }

  const addCustomMonth = (monthDate: Date) => {
    const monthKey = format(monthDate, "yyyy-MM")
    const allMonths = getAllVisibleMonths()
    const exists = allMonths.some((m) => format(m, "yyyy-MM") === monthKey)
    if (!exists) {
      const updatedCustomMonths = [...customMonths, monthDate];
      setCustomMonths(updatedCustomMonths)
      if (deletedMonths.has(monthKey)) {
        const updatedDeletedMonths = new Set(deletedMonths);
        updatedDeletedMonths.delete(monthKey);
        setDeletedMonths(updatedDeletedMonths)
        saveTimelinePrefs(updatedCustomMonths, updatedDeletedMonths);
        toast({ title: "Month Restored", description: `${format(monthDate, "MMMM yyyy")} has been restored to your timeline.` })
      } else {
        saveTimelinePrefs(updatedCustomMonths, deletedMonths);
        toast({ title: "Month Added", description: `${format(monthDate, "MMMM yyyy")} has been added to your timeline.` })
      }
    } else {
      toast({ title: "Month Already Exists", description: `${format(monthDate, "MMMM yyyy")} is already in your timeline.`, variant: "destructive" })
    }
    setShowAddMonthForm(false)
  }

  const deleteMonth = (monthDate: Date) => {
    const monthKey = format(monthDate, "yyyy-MM")
    const defaultMonths = generateDefault6Months()
    const isDefaultMonth = defaultMonths.some((m) => format(m, "yyyy-MM") === monthKey)
    const isCustomMonth = customMonths.some((m) => format(m, "yyyy-MM") === monthKey)
    if (isDefaultMonth) {
      const updatedDeletedMonths = new Set(Array.from(deletedMonths).concat(monthKey));
      setDeletedMonths(updatedDeletedMonths)
      saveTimelinePrefs(customMonths, updatedDeletedMonths);
      toast({ title: "Month Hidden", description: `${format(monthDate, "MMMM yyyy")} has been hidden. You can restore it anytime.` })
    } else if (isCustomMonth) {
      const updatedCustomMonths = customMonths.filter((m) => format(m, "yyyy-MM") !== monthKey);
      setCustomMonths(updatedCustomMonths)
      saveTimelinePrefs(updatedCustomMonths, deletedMonths);
      toast({ title: "Month Removed", description: `${format(monthDate, "MMMM yyyy")} has been removed from your timeline.` })
    }
  }

  const getDeletedMonthsForRestore = () => {
    const defaultMonths = generateDefault6Months()
    return defaultMonths.filter((month) => {
      const monthKey = format(month, "yyyy-MM")
      return deletedMonths.has(monthKey)
    })
  }

  const formatPriceChange = (change: number | null | undefined, percentage: number | null | undefined) => {
    if (change === null || change === undefined) return null
    const isPositive = change > 0
    const changeStr = change > 0 ? `+$${change.toFixed(2)}` : `-$${Math.abs(change).toFixed(2)}`
    const percentageStr = percentage ? ` (${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}%)` : ""
    return (
      <div className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
        <span className="font-medium">
          {changeStr}
          {percentageStr}
        </span>
      </div>
    )
  }

  const exportToCSV = () => {
    const headers = ["Title", "Description", "Source", "Date", "Price Before", "Price After"]
    const rows = filteredCatalysts.map(c => [
      c.title?.replace(/"/g, '""') ?? '',
      c.description?.replace(/"/g, '""') ?? '',
      c.source?.replace(/"/g, '""') ?? '',
      c.date ?? '',
      c.priceBefore !== undefined ? c.priceBefore : '',
      c.priceAfter !== undefined ? c.priceAfter : ''
    ])
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ticker}-catalysts.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading catalyst history...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const months = getAllVisibleMonths()
  const deletedMonthsForRestore = getDeletedMonthsForRestore()

  return (
    <div className="space-y-4">
      {/* Debug Panel - Remove this in production */}
      <DateDebugPanel />
      
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>News Catalyst History - {ticker}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal text-muted-foreground">
                {catalysts.length} catalyst{catalysts.length !== 1 ? "s" : ""} found
              </span>
              <Button variant="outline" size="sm" onClick={() => setShowAddMonthForm(true)}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Month
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddMonthForm && (
            <Card className="mb-4 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium">Add Custom Month</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="month"
                    className="px-3 py-2 border rounded-md"
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month] = e.target.value.split("-")
                        const monthDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
                        addCustomMonth(monthDate)
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => setShowAddMonthForm(false)}>
                    Cancel
                  </Button>
                </div>

                {deletedMonthsForRestore.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-2">Restore Hidden Months:</div>
                    <div className="flex flex-wrap gap-2">
                      {[...deletedMonthsForRestore].map((month) => (
                        <Button
                          key={format(month, "yyyy-MM")}
                          variant="outline"
                          size="sm"
                          onClick={() => addCustomMonth(month)}
                          className="text-xs"
                        >
                          <ArrowPathIcon className="h-3 w-3 mr-1" />
                          {format(month, "MMM yyyy")}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {[...months].map((month) => {
              const monthKey = format(month, "yyyy-MM")
              const monthName = format(month, "MMMM yyyy")
              const isCurrentMonth = format(new Date(), "yyyy-MM") === monthKey
              const defaultMonths = generateDefault6Months()
              const isDefaultMonth = defaultMonths.some((m) => format(m, "yyyy-MM") === monthKey)
              const isCustomMonth = customMonths.some((m) => format(m, "yyyy-MM") === monthKey)
              const isOpen = openMonths.has(monthKey)
              const weeks = generateWeeksForMonth(month)
              const monthStart = startOfMonth(month)
              const monthEnd = endOfMonth(month)
              const monthCatalysts = getCatalystsForWeek(monthStart, monthEnd)
              return (
                <Collapsible key={monthKey} open={isOpen} onOpenChange={() => toggleMonth(monthKey)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-between p-3 h-auto ${isCurrentMonth ? "bg-slate-800 border border-slate-700" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                        <span className="font-medium">{monthName}</span>
                        {isCurrentMonth && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                        {isCustomMonth && (
                          <Badge variant="outline" className="text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {monthCatalysts.length} catalyst{monthCatalysts.length !== 1 ? "s" : ""}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMonth(month)
                          }}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 pt-2 space-y-2">
                    {weeks.map((week, weekIndex) => {
                      const weekKey = `${monthKey}-week-${weekIndex}`
                      const weekCatalysts = getCatalystsForWeek(week.start, week.end)
                      const isWeekOpen = openWeeks.has(weekKey)
                      const weekLabel =
                        weekIndex === 3
                          ? `Week 4: ${format(week.start, "MMM d")} - ${format(week.end, "MMM d")} (End of Month)`
                          : `Week ${weekIndex + 1}: ${format(week.start, "MMM d")} - ${format(week.end, "MMM d")}`
                      return (
                        <Collapsible key={weekKey} open={isWeekOpen} onOpenChange={() => toggleWeek(weekKey)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between p-2 h-auto text-sm">
                              <div className="flex items-center gap-2">
                                {isWeekOpen ? (
                                  <ChevronDownIcon className="h-3 w-3" />
                                ) : (
                                  <ChevronRightIcon className="h-3 w-3" />
                                )}
                                <span>{weekLabel}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {weekCatalysts.length} catalyst{weekCatalysts.length !== 1 ? "s" : ""}
                              </span>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pl-6 pt-2 space-y-2">
                            {weekCatalysts.length > 0 ? (
                              weekCatalysts.map((catalyst) => (
                                <div key={catalyst.id} className="border rounded-lg p-3 bg-gray-900">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        {editingId === catalyst.id ? (
                                          <>
                                            <input
                                              type="text"
                                              name="title"
                                              value={editForm.title}
                                              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                              className="px-3 py-2 border rounded-md"
                                            />
                                            {catalyst.description && (
                                              <textarea
                                                name="description"
                                                value={editForm.description || ""}
                                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                className="px-3 py-2 border rounded-md"
                                              />
                                            )}
                                            {catalyst.source && (
                                              <input
                                                type="text"
                                                name="source"
                                                value={editForm.source || ""}
                                                onChange={e => setEditForm({ ...editForm, source: e.target.value })}
                                                className="px-3 py-2 border rounded-md"
                                              />
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <h4 className="font-medium text-sm">{catalyst.title}</h4>
                                            {formatPriceChange(catalyst.priceBefore, catalyst.priceAfter)}
                                          </>
                                        )}
                                      </div>
                                      {catalyst.description && (
                                        <p className="text-xs text-muted-foreground mb-2">{catalyst.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>{format(new Date(catalyst.date), "MMM d, yyyy")}</span>
                                        {catalyst.source && <span>Source: {catalyst.source}</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {editingId === catalyst.id ? (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditingId(null)}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                          >
                                            <Undo2 className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {/* Save logic here */ setEditingId(null) }}
                                            className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                                          >
                                            Save
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingId(catalyst.id)}
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {/* Delete logic here */}}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-sm text-muted-foreground">
                                No catalysts for this week
                              </div>
                            )}
                            <div className="pt-2">
                              {showAddForm === weekKey ? (
                                <AddCatalystForm
                                  selectedStockSymbol={ticker}
                                  onSuccess={handleCatalystAdded}
                                  onCancel={() => setShowAddForm(null)}
                                />
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowAddForm(weekKey)}
                                  className="w-full"
                                >
                                  <PlusIcon className="h-4 w-4 mr-2" />
                                  Add New Catalyst
                                </Button>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end mb-2">
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
