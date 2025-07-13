"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Calendar, Plus, Trash2, Edit, Download, Undo2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { getDownloadURL, ref as storageRef } from "firebase/storage"
import { storage } from "@/lib/firebase"
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
import { StockManualNewsForm } from "./stock-manual-news-form"

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

export function NewsImage({ imagePath, source }: { imagePath: string; source?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  
  // Don't display if no image path
  if (!imagePath) {
    return null
  }
  
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
  return <img src={url} alt="News Image" className="mt-2 max-h-32 rounded" />
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
  const { user, loading: authLoading } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{title: string, description?: string, source?: string, date?: string}>({title: ""})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [undoData, setUndoData] = useState<Catalyst | null>(null)
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Toggle description expansion
  const toggleDescriptionExpansion = (catalystId: string) => {
    const newExpanded = new Set(expandedDescriptions)
    if (newExpanded.has(catalystId)) {
      newExpanded.delete(catalystId)
    } else {
      newExpanded.add(catalystId)
    }
    setExpandedDescriptions(newExpanded)
  }

  // Render expandable description
  const renderDescription = (catalyst: Catalyst) => {
    if (!catalyst.description) return null
    
    const isExpanded = expandedDescriptions.has(catalyst.id)
    const shouldTruncate = catalyst.description.length > 150
    const displayText = shouldTruncate && !isExpanded 
      ? catalyst.description.substring(0, 150) + "..."
      : catalyst.description

    return (
      <div className="flex-1 text-xs text-muted-foreground">
        {displayText}
        {shouldTruncate && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleDescriptionExpansion(catalyst.id)
            }}
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            {isExpanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>
    )
  }

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
      if (!user) return;
      const response = await fetchWithAuth(`/api/timeline-prefs?uid=${user.uid}`);
      const result = await response.json();
      if (result.success) {
        setCustomMonths((result.data.customMonths || []).map((m: string) => new Date(m + "-01")));
        setDeletedMonths(new Set(result.data.deletedMonths || []));
      }
    }
    fetchTimelinePrefs();
  }, [user]);

  async function saveTimelinePrefs(newCustomMonths: Date[], newDeletedMonths: Set<string>) {
    if (!user) return;
    const response = await fetchWithAuth(`/api/timeline-prefs?uid=${user.uid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customMonths: newCustomMonths.map(m => `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`),
        deletedMonths: Array.from(newDeletedMonths),
      }),
    });
    const result = await response.json();
    if (result.success) {
      toast({ title: "Timeline preferences saved", description: "Your timeline preferences have been saved." });
    } else {
      toast({ title: "Save failed", description: result.error || "Failed to save timeline preferences.", variant: "destructive" });
    }
  }

  async function fetchCatalysts() {
    if (authLoading) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let url = '/api/catalysts';
      if (ticker && ticker !== "all") {
        url += `?ticker=${ticker.toUpperCase()}`;
      }

      const response = await fetchWithAuth(url);
      const result = await response.json();

      if (result.success) {
        setCatalysts(result.data || []);
      } else {
        console.error('Failed to fetch catalysts:', result.error);
        setCatalysts([]);
      }
    } catch (error) {
      console.error("Error loading catalysts:", error);
      setError("Failed to load catalyst data");
      setCatalysts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCatalysts();
  }, [ticker, refreshKey, authLoading]);

  // Remove the auto-refresh interval that was causing form flashing
  // Instead, we'll refresh when form is submitted via handleCatalystAdded

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
    const catalysts = filteredCatalysts.filter((catalyst) => {
      // Safe date parsing to prevent RangeError
      if (!catalyst.date) return false;
      try {
        const catalystDate = new Date(catalyst.date + 'T00:00:00.000Z');
        if (isNaN(catalystDate.getTime())) return false;
        return isWithinInterval(catalystDate, { start: weekStart, end: weekEnd });
      } catch (error) {
        console.warn('Invalid date in catalyst:', catalyst.date);
        return false;
      }
    });
    return {
      catalysts,
      debugInfo: [`Week ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}: ${catalysts.length} catalysts`]
    };
  }

  const handleCatalystAdded = () => {
    setShowAddForm(null)
    fetchCatalysts() // Refresh after successful add
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

  const formatPriceChange = (priceBefore: number | null | undefined, priceAfter: number | null | undefined) => {
    // If we don't have both prices, don't show anything
    if (!priceBefore || !priceAfter) return null

    const change = priceAfter - priceBefore
    const percentage = (change / priceBefore) * 100
    const isPositive = change > 0

    return (
      <div className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? (
          <ArrowTrendingUpIcon className="h-4 w-4" />
        ) : (
          <ArrowTrendingDownIcon className="h-4 w-4" />
        )}
        <span className="font-medium text-xs">
          {percentage > 0 ? "+" : ""}{percentage.toFixed(1)}%
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
      if (!user) throw new Error("Not authenticated");
      const response = await fetchWithAuth(`/api/catalysts/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setCatalysts(prev => prev.filter(c => c.id !== id));
        toast({ title: "Catalyst deleted", description: "The news catalyst was deleted successfully." });
      } else {
        toast({ title: "Delete failed", description: result.error || "Failed to delete catalyst.", variant: "destructive" });
      }
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

  // Safe date handling to prevent RangeError
  let todayIso: string;
  try {
    todayIso = new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error('Error creating today date:', error);
    todayIso = '1970-01-01'; // Fallback date
  }
  
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
      {(() => { console.log('Rendering catalyst ids:', catalysts.map(c => c && typeof c.id === 'string' ? c.id : '[INVALID]'), 'Types:', catalysts.map(c => typeof c.id)); return null; })()}
      
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
                      <div className="w-full flex items-center justify-between">
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
                          ? `Week 4: ${format(week.start, "MMM d")} - ${format(week.end, "MMM d")}${!isMobile ? ' (End of Month)' : ''}`
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
                              weekResult.catalysts.map((catalyst) => {
                                let safeId = typeof catalyst.id === 'string' ? catalyst.id : ((catalyst as any).id && typeof (catalyst as any).id === 'object' && typeof (catalyst as any).id.toString === 'function' ? (catalyst as any).id.toString() : String((catalyst as any).id));
                                if (!safeId || typeof safeId !== 'string' || !safeId.trim()) {
                                  console.warn('Skipping catalyst with invalid id:', catalyst);
                                  return null;
                                }
                                return (
                                  <div key={safeId} className="border rounded-lg p-3 bg-gray-900">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          {editingId === catalyst.id ? (
                                            <div className="flex items-center gap-4 w-full">
                                              <input
                                                type="date"
                                                name="date"
                                                value={editForm.date || catalyst.date}
                                                onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                                className="px-2 py-1 border rounded-md w-32"
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
                                                  const response = await fetchWithAuth(`/api/catalysts/${catalyst.id}`, {
                                                    method: 'PUT',
                                                    headers: {
                                                      'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify({
                                                      date: editForm.date || catalyst.date,
                                                      title: editForm.title,
                                                      description: editForm.description || '',
                                                    }),
                                                  });
                                                  const result = await response.json();
                                                  if (result.success) {
                                                    setEditingId(null);
                                                    toast({ title: "Catalyst updated", description: "The news catalyst was updated successfully." });
                                                  } else {
                                                    toast({ title: "Update failed", description: result.error || "Failed to update catalyst.", variant: "destructive" });
                                                  }
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
                                            <div className="flex items-start gap-4 w-full">
                                              <span className="w-32 text-xs text-muted-foreground mt-1">{format(new Date(catalyst.date), "MMM d, yyyy")}</span>
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <div className="font-medium text-sm">{catalyst.title}</div>
                                                  {formatPriceChange(catalyst.priceBefore, catalyst.priceAfter)}
                                                </div>
                                                {renderDescription(catalyst)}
                                              </div>
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
                                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 mt-1"
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteCatalyst(catalyst.id)}
                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800 mt-1"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                          {catalyst.source && <span>Source: {catalyst.source}</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-4 text-sm text-muted-foreground">
                                No catalysts for this week
                              </div>
                            )}
                            <div className="pt-2">
                              {showAddForm === weekKey ? (
                                <div className="border rounded-lg p-4 bg-card">
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-medium">Add News Catalyst</h3>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowAddForm(null)}
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                  <StockManualNewsForm 
                                    ticker={ticker === "all" ? "AAPL" : ticker} 
                                    onSuccess={handleCatalystAdded}
                                    defaultDate={format(week.start, "yyyy-MM-dd")}
                                  />
                                </div>
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
