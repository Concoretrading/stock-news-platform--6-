"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Calendar } from "@/components/ui/calendar";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIDataCollector from "@/components/ai-data-collector";
import EarningsCalendarManager from "@/components/earnings-calendar-manager";
import UpcomingEventsCalendar from "@/components/upcoming-events-calendar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  addMonths, 
  startOfMonth, 
  format, 
  eachWeekOfInterval, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  getDay,
  parseISO
} from "date-fns";

const TABS = [
  { key: "events", label: "Events" },
  { key: "earnings", label: "Earnings" },
  { key: "alerts", label: "Alerts" },
  { key: "personal", label: "Personal" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ai-collector", label: "AI Collector" },
  { key: "earnings-manager", label: "Earnings Manager" },
];

interface EarningsData {
  symbol: string
  name: string
  reportDate: string
  fiscalDateEnding: string
  estimate: string
  currency: string
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("earnings")
  const [earningsData, setEarningsData] = useState<EarningsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchEarningsData()
  }, [])

  async function fetchEarningsData() {
    try {
      setLoading(true)
      const response = await fetchWithAuth('/api/earnings-calendar')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch earnings data')
      }

      setEarningsData(data.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching earnings:', err)
      setError('Failed to load earnings data')
    } finally {
      setLoading(false)
    }
  }

  function getStocksForDate(date: Date): EarningsData[] {
    return earningsData.filter(earning => 
      isSameDay(parseISO(earning.reportDate), date)
    )
  }

  function renderMonthCalendar(month: Date) {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const weeks = eachWeekOfInterval({ start, end })

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {format(month, 'MMMM yyyy')}
        </h2>
        
        <div className="grid grid-cols-7 gap-px bg-muted">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium">
              {day}
            </div>
          ))}
          
          {weeks.map(week => {
            const days = eachDayOfInterval({
              start: startOfWeek(week),
              end: endOfWeek(week)
            })

            return days.map(day => {
              const dayStocks = getStocksForDate(day)
              const isCurrentMonth = isSameMonth(day, month)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] p-2 ${
                    isCurrentMonth ? 'bg-card' : 'bg-muted/50'
                  }`}
                >
                  <div className="font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayStocks.map(stock => (
                      <Dialog key={`${stock.symbol}-${stock.reportDate}`}>
                        <DialogTrigger asChild>
                          <div className="text-xs p-1 bg-primary/10 rounded cursor-pointer hover:bg-primary/20">
                            {stock.symbol}
                          </div>
                        </DialogTrigger>
                        
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {stock.name} ({stock.symbol})
                            </DialogTitle>
                            <DialogDescription>
                              Earnings Report Details
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-2">
                            <p><strong>Report Date:</strong> {format(parseISO(stock.reportDate), 'PPP')}</p>
                            <p><strong>Fiscal Period Ending:</strong> {stock.fiscalDateEnding}</p>
                            <p><strong>Estimate:</strong> {stock.estimate} {stock.currency}</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </div>
              )
            })
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {TABS.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {activeTab === "earnings" && (
          <div className="mt-6 space-y-8">
            {loading ? (
              <div>Loading earnings data...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <>
                {renderMonthCalendar(selectedDate)}
                {renderMonthCalendar(addMonths(selectedDate, 1))}
              </>
            )}
          </div>
        )}

        {/* Keep other tab content */}
      </Tabs>
    </div>
  )
} 