"use client"

import { useState, useEffect } from "react"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import AddCatalystForm from "./add-catalyst-form"
import { CatalystManager } from "./catalyst-manager"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Undo2, Download } from "lucide-react"
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

interface NewsTableProps {
  ticker: string
  searchQuery?: string
}

export function NewsTable({ ticker, searchQuery }: NewsTableProps) {
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

  // Generate the default 12 months
  const generateDefault12Months = () => {
    const months = []
    const now = new Date()

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(monthDate)
    }

    return months
  }

  // Get all visible months (default - deleted + custom)
  const getAllVisibleMonths = () => {
    const defaultMonths = generateDefault12Months()

    // Filter out deleted default months
    const visibleDefaultMonths = defaultMonths.filter((month) => {
      const monthKey = format(month, "yyyy-MM")
      return !deletedMonths.has(monthKey)
    })

    // Combine with custom months
    const allMonths = [...visibleDefaultMonths, ...customMonths]

    // Remove duplicates and sort by date (newest first)
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

    // Week 1: 1st-7th
    weeks.push({
      start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1),
      end: new Date(monthStart.getFullYear(), monthStart.getMonth(), 7),
    })

    // Week 2: 8th-14th
    weeks.push({
      start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 8),
      end: new Date(monthStart.getFullYear(), monthStart.getMonth(), 14),
    })

    // Week 3: 15th-21st
    weeks.push({
      start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 15),
      end: new Date(monthStart.getFullYear(), monthStart.getMonth(), 21),
    })

    // Week 4: 22nd-end of month (includes all remaining days)
    weeks.push({
      start: new Date(monthStart.getFullYear(), monthStart.getMonth(), 22),
      end: monthEnd,
    })

    return weeks
  }

  // Auto-open current month
  useEffect(() => {
    const currentMonth = format(new Date(), "yyyy-MM")
    setOpenMonths(new Set([currentMonth]))
  }, [])

  const loadCatalysts = async () => {
    try {
      setLoading(true)
      setError(null)

      // console.log(`Loading catalysts for ${ticker}...`)

      const response = await fetch(`/api/catalysts?ticker=${ticker}`)

      if (!response.ok) {
        // If API fails, use empty array instead of throwing error
        // console.log("API request failed, using empty data")
        setCatalysts([])
        return
      }

      const data = await response.json()

      // console.log("API response status:", response.status)
      // console.log("API response data:", data)

      if (data.success) {
        setCatalysts(data.data || [])
        // console.log(`Loaded ${data.data?.length || 0} catalysts`)
      } else {
        // console.log("No catalysts found or API returned empty data")
        setCatalysts([])
      }
    } catch (error) {
      console.error("Error loading catalysts:", error)
      // Don't show error to user, just use empty data
      setCatalysts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ticker) {
      loadCatalysts()
    }
  }, [ticker])

  const toggleMonth = (monthKey: string) => {
    const newOpenMonths = new Set(openMonths)
    if (newOpenMonths.has(monthKey)) {
      newOpenMonths.delete(monthKey)
      // Also close all weeks in this month
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
    ? catalysts.filter(c =>
        (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : catalysts

  const getCatalystsForWeek = (weekStart: Date, weekEnd: Date) => {
    return filteredCatalysts.filter((catalyst) => {
      const catalystDate = new Date(catalyst.date)
      return isWithinInterval(catalystDate, { start: weekStart, end: weekEnd })
    })
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
      setCustomMonths((prev) => [...prev, monthDate])
      // If this was a deleted default month, restore it instead
      if (deletedMonths.has(monthKey)) {
        setDeletedMonths((prev) => {
          const newSet = new Set(prev)
          newSet.delete(monthKey)
          return newSet
        })
        toast({
          title: "Month Restored",
          description: `${format(monthDate, "MMMM yyyy")} has been restored to your timeline.`,
        })
      } else {
        toast({
          title: "Month Added",
          description: `${format(monthDate, "MMMM yyyy")} has been added to your timeline.`,
        })
      }
    } else {
      toast({
        title: "Month Already Exists",
        description: `${format(monthDate, "MMMM yyyy")} is already in your timeline.`,
        variant: "destructive",
      })
    }
    setShowAddMonthForm(false)
  }

  const deleteMonth = (monthDate: Date) => {
    const monthKey = format(monthDate, "yyyy-MM")
    const defaultMonths = generateDefault12Months()
    const isDefaultMonth = defaultMonths.some((m) => format(m, "yyyy-MM") === monthKey)
    const isCustomMonth = customMonths.some((m) => format(m, "yyyy-MM") === monthKey)

    if (isDefaultMonth) {
      // Mark default month as deleted
      setDeletedMonths((prev) => new Set(Array.from(prev).concat(monthKey)))
      toast({
        title: "Month Hidden",
        description: `${format(monthDate, "MMMM yyyy")} has been hidden. You can restore it anytime.`,
      })
    } else if (isCustomMonth) {
      // Remove custom month
      setCustomMonths((prev) => prev.filter((m) => format(m, "yyyy-MM") !== monthKey))
      toast({
        title: "Month Removed",
        description: `${format(monthDate, "MMMM yyyy")} has been removed from your timeline.`,
      })
    }
  }

  const getDeletedMonthsForRestore = () => {
    const defaultMonths = generateDefault12Months()
    return defaultMonths.filter((month) => {
      const monthKey = format(month, "yyyy-MM")
      return deletedMonths.has(monthKey)
    })
  }

  const formatPriceChange = (change: number | null | undefined, percentage: number | null | undefined) => {
    if (change === null || change === undefined) return null

    // console.log('change value:', change, typeof change);
    const isPositive = change > 0
    const changeStr = typeof change === 'number' && !isNaN(change) ? (change > 0 ? `+$${change.toFixed(2)}` : `-$${Math.abs(change).toFixed(2)}`) : 'N/A';
    // console.log('percentage value:', percentage, typeof percentage);
    const percentageStr = typeof percentage === 'number' && !isNaN(percentage) ? ` (${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}%)` : "";

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

  function highlightMatch(text: string, query: string) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
    );
  }

  const handleEdit = (catalyst: Catalyst) => {
    setEditingId(catalyst.id)
    setEditForm({title: catalyst.title, description: catalyst.description, source: catalyst.source})
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({...editForm, [e.target.name]: e.target.value})
  }

  const handleEditSave = async (id: string) => {
    // Simulate API call
    setCatalysts(prev => prev.map(c => c.id === id ? {...c, ...editForm} : c))
    setEditingId(null)
    toast({title: "Catalyst updated", description: "The news/catalyst entry was updated."})
  }

  const handleEditCancel = () => {
    setEditingId(null)
  }

  const handleDelete = (catalyst: Catalyst) => {
    setDeletingId(catalyst.id)
    setUndoData(catalyst)
    setCatalysts(prev => prev.filter(c => c.id !== catalyst.id))
    toast({
      title: "Catalyst deleted",
      description: "You can undo this action.",
      action: (
        <ToastAction altText="Undo" onClick={handleUndoDelete}>
          Undo
        </ToastAction>
      )
    })
    if (undoTimeout) clearTimeout(undoTimeout)
    setUndoTimeout(setTimeout(() => setUndoData(null), 5000))
  }

  const handleUndoDelete = () => {
    if (undoData) {
      setCatalysts(prev => [undoData!, ...prev])
      setUndoData(null)
      setDeletingId(null)
      toast({title: "Undo successful", description: "The catalyst was restored."})
    }
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
              const defaultMonths = generateDefault12Months()
              const isDefaultMonth = defaultMonths.some((m) => format(m, "yyyy-MM") === monthKey)
              const isCustomMonth = customMonths.some((m) => format(m, "yyyy-MM") === monthKey)
              const isOpen = openMonths.has(monthKey)

              // Get 4 weeks for this month
              const weeks = generateWeeksForMonth(month)

              // Count catalysts for this month
              const monthStart = startOfMonth(month)
              const monthEnd = endOfMonth(month)
              const monthCatalysts = getCatalystsForWeek(monthStart, monthEnd)

              return (
                <Collapsible key={monthKey} open={isOpen} onOpenChange={() => toggleMonth(monthKey)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-between p-3 h-auto ${
                        isCurrentMonth ? "bg-slate-800 border border-slate-700" : ""
                      }`}
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
                        {isDefaultMonth && !isCustomMonth && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            Default
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
                                              onChange={handleEditChange}
                                              className="px-3 py-2 border rounded-md"
                                            />
                                            {catalyst.description && (
                                              <textarea
                                                name="description"
                                                value={editForm.description || ""}
                                                onChange={handleEditChange}
                                                className="px-3 py-2 border rounded-md"
                                              />
                                            )}
                                            {catalyst.source && (
                                              <input
                                                type="text"
                                                name="source"
                                                value={editForm.source || ""}
                                                onChange={handleEditChange}
                                                className="px-3 py-2 border rounded-md"
                                              />
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <h4 className="font-medium text-sm">{highlightMatch(catalyst.title, searchQuery || "")}</h4>
                                            {formatPriceChange(catalyst.priceBefore, catalyst.priceAfter)}
                                          </>
                                        )}
                                      </div>
                                      {catalyst.description && (
                                        <p className="text-xs text-muted-foreground mb-2">{highlightMatch(catalyst.description, searchQuery || "")}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>{format(new Date(catalyst.date), "MMM d, yyyy")}</span>
                                        {catalyst.source && <span>Source: {highlightMatch(catalyst.source, searchQuery || "")}</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {editingId === catalyst.id ? (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleEditCancel}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                          >
                                            <Undo2 className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditSave(catalyst.id)}
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
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEdit(catalyst)
                                            }}
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDelete(catalyst)
                                            }}
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
