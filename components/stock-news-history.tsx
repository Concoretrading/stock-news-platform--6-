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
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import AddCatalystForm from "./add-catalyst-form"
import { deleteCatalyst, getUserStocks } from "@/lib/firebase-services"
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
  const [editForm, setEditForm] = useState<{title: string, description?: string, source?: string, date?: string}>({title: ""})
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
    if (ticker && ticker !== "all") {
      q = query(
        collection(db, "catalysts"),
        where("userId", "==", user.uid),
        where("stockTickers", "array-contains", ticker.toUpperCase()),
        orderBy("createdAt", "desc")
      );
    }

    setLoading(true);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const catalysts: Catalyst[] = [];
      querySnapshot.forEach((doc) => {
        catalysts.push({ id: doc.id, ...doc.data() } as Catalyst);
      });
      setCatalysts(catalysts);
      setLoading(false);
    }, (error) => {
      setError(error.message || "Failed to fetch news");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [ticker, refreshKey]);

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
    const debugInfo: string[] = [];
    const catalysts = filteredCatalysts.filter((catalyst) => {
      const catalystDate = new Date(catalyst.date + 'T00:00:00.000Z');
      const isInWeek = isWithinInterval(catalystDate, { start: weekStart, end: weekEnd });
      debugInfo.push(
        `Catalyst: ${catalyst.title || catalyst.id} | Date: ${catalyst.date} (parsed: ${catalystDate.toISOString()}) | Week: ${weekStart.toISOString()} - ${weekEnd.toISOString()} | Match: ${isInWeek}`
      );
      return isInWeek;
    });
    return { catalysts, debugInfo };
  };

  const handleCatalystAdded = () => {
    setShowAddForm(null)
  }

  const handleCatalystUpdated = () => {
    // Implementation needed
  }

  const handleCatalystDeleted = () => {
    // Implementation needed
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

  const handleDeleteCatalyst = async (id: string) => {
    try {
      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      await deleteDoc(doc(db, "catalysts", id));
      setCatalysts(prev => prev.filter(c => c.id !== id));
      toast({ title: "Catalyst deleted", description: "The news catalyst was deleted successfully." });
    } catch (error) {
      toast({ title: "Delete failed", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    }
  };

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

  const todayIso = new Date().toISOString().split('T')[0];
  const missingTodayCatalysts = catalysts.filter(c => c.date === todayIso);
  const shownCatalystIds = new Set();
  months.forEach(month => {
    const weeks = generateWeeksForMonth(month);
    weeks.forEach(week => {
      const weekResult = getCatalystsForWeek(week.start, week.end);
      weekResult.catalysts.forEach(c => shownCatalystIds.add(c.id));
    });
  });
  const missingToday = missingTodayCatalysts.filter(c => !shownCatalystIds.has(c.id));

  if (missingToday.length > 0) {
    console.warn(`Warning: ${missingToday.length} catalyst(s) with today's date (${todayIso}) are not shown in any week. Check date logic!`);
  }

  return (
    <div className="space-y-4">
      {/* Debug Panel - Remove this in production */}
      
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
              const monthResult = getCatalystsForWeek(monthStart, monthEnd)
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
                          {monthResult.catalysts.length} catalyst{monthResult.catalysts.length !== 1 ? "s" : ""}
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
                      const weekResult = getCatalystsForWeek(week.start, week.end)
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
                                {weekResult.catalysts.length} catalyst{weekResult.catalysts.length !== 1 ? "s" : ""}
                              </span>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pl-6 pt-2 space-y-2">
                            {weekResult.catalysts.length > 0 ? (
                              weekResult.catalysts.map((catalyst) => (
                                <div key={catalyst.id} className="border rounded-lg p-3 bg-gray-900">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        {editingId === catalyst.id ? (
                                          <div className="flex items-center gap-3 w-full">
                                            <input
                                              type="date"
                                              name="date"
                                              value={editForm.date || catalyst.date}
                                              onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                              className="px-2 py-1 border rounded-md w-36"
                                            />
                                            <input
                                              type="text"
                                              name="title"
                                              value={editForm.title}
                                              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                              className="px-2 py-1 border rounded-md flex-1"
                                              placeholder="Title"
                                            />
                                            <input
                                              type="text"
                                              name="description"
                                              value={editForm.description || ''}
                                              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                              className="px-2 py-1 border rounded-md flex-1"
                                              placeholder="Description"
                                            />
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={async () => {
                                                // Save logic
                                                const db = getFirestore();
                                                const docRef = doc(db, "catalysts", catalyst.id);
                                                await updateDoc(docRef, {
                                                  date: editForm.date || catalyst.date,
                                                  title: editForm.title,
                                                  description: editForm.description || '',
                                                });
                                                setEditingId(null);
                                                toast({ title: "Catalyst updated", description: "The news catalyst was updated successfully." });
                                              }}
                                              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                                            >
                                              Save
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setEditingId(null)}
                                              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDeleteCatalyst(catalyst.id)}
                                              className="h-6 w-6 p-0 text-red-600 hover:text-red-800 ml-2"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-4 w-full">
                                            <span className="w-32 text-xs text-muted-foreground">{format(new Date(catalyst.date), "MMM d, yyyy")}</span>
                                            <span className="font-medium text-sm flex-1">{catalyst.title}</span>
                                            <span className="flex-1 text-xs text-muted-foreground">{catalyst.description}</span>
                                            {typeof catalyst.priceBefore === 'number' && typeof catalyst.priceAfter === 'number' && catalyst.priceAfter !== catalyst.priceBefore && (
                                              <span className={`font-bold ml-2 flex items-center gap-1 ${catalyst.priceAfter - catalyst.priceBefore > 0 ? 'text-green-600' : 'text-red-600'}`}> 
                                                {catalyst.priceAfter - catalyst.priceBefore > 0 ? '▲' : '▼'}
                                                {Math.abs(catalyst.priceAfter - catalyst.priceBefore)}
                                              </span>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setEditingId(catalyst.id);
                                                setEditForm({
                                                  title: catalyst.title || "",
                                                  description: catalyst.description || "",
                                                  date: catalyst.date || ""
                                                });
                                              }}
                                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDeleteCatalyst(catalyst.id)}
                                              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
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
                                            onClick={() => {
                                              setEditingId(catalyst.id);
                                              setEditForm({
                                                title: catalyst.title || "",
                                                description: catalyst.description || "",
                                                date: catalyst.date || ""
                                              });
                                            }}
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteCatalyst(catalyst.id)}
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
                            {weekResult.debugInfo && (
                              <div className="text-xs text-orange-400 whitespace-pre-wrap font-mono mb-2">
                                {weekResult.debugInfo.join('\n')}
                              </div>
                            )}
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
