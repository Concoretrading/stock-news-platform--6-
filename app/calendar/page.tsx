"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  addMonths,
  subMonths, 
  startOfMonth, 
  format, 
  eachWeekOfInterval, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
  isSameWeek,
  startOfDay,
  endOfDay
} from "date-fns";

// Define the three main tabs
const TABS = [
  { key: "events", label: "Events", description: "Economic events and important dates" },
  { key: "earnings", label: "Earnings", description: "Company earnings calendar" },
  { key: "elite", label: "Elite", description: "Special events and institutional activity" },
];

interface EarningsEvent {
  symbol: string;
  name: string;
  reportDate: string;
  fiscalDateEnding: string;
  estimate: string;
  currency: string;
  earningsType: string;
  lastEarnings?: string;
  conferenceCallTime?: string;
  conferenceCallUrl?: string;
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("earnings");
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredWeek, setHoveredWeek] = useState<Date | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (activeTab === "earnings") {
      fetchEarningsData();
    }
  }, [activeTab, selectedDate]); // Also fetch when month changes

  async function fetchEarningsData() {
    try {
      setLoading(true);
      const startOfMonthDate = startOfMonth(selectedDate);
      const endOfMonthDate = endOfMonth(selectedDate);
      
      const params = new URLSearchParams({
        startDate: format(startOfMonthDate, 'yyyy-MM-dd'),
        endDate: format(endOfMonthDate, 'yyyy-MM-dd')
      });

      console.log('Fetching earnings data:', params.toString());
      const response = await fetchWithAuth(`/api/earnings-calendar?${params}`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch earnings data');
      }

      setEarnings(data.data);
      console.log('Earnings set:', data.data.length, 'events');
      setError(null);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }

  function getEarningsForDate(date: Date): EarningsEvent[] {
    return earnings.filter(earning => {
      const earningDate = parseISO(earning.reportDate);
      return isSameDay(earningDate, date);
    }).sort((a, b) => {
      // Sort by market time: BMO first, then market hours, then AMC
      const timeOrder = {
        'Before Market Open': 0,
        'During Market Hours': 1,
        'After Market Close': 2
      };
      return (timeOrder[a.earningsType] || 1) - (timeOrder[b.earningsType] || 1);
    });
  }

  function renderEarningsCard(earning: EarningsEvent) {
    return (
      <Dialog key={`${earning.symbol}-${earning.reportDate}`}>
        <DialogTrigger asChild>
          <div className="text-xs p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity bg-gray-100 dark:bg-gray-800 flex flex-col mb-1">
            <span className="font-semibold">{earning.symbol}</span>
            <span className="text-[10px] opacity-75 truncate" title={earning.name}>{earning.name}</span>
            <span className="text-[10px] opacity-75">{earning.earningsType}</span>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{earning.name} ({earning.symbol})</DialogTitle>
            <DialogDescription>Earnings Report Details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Report Date</span>
              <span className="text-sm">{format(parseISO(earning.reportDate), 'PPP')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Time</span>
              <span className="text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">{earning.earningsType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fiscal Period</span>
              <span className="text-sm">{earning.fiscalDateEnding}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estimate</span>
              <span className="text-sm">{earning.estimate === 'N/A' ? 'Not Available' : `${earning.estimate} ${earning.currency}`}</span>
            </div>
            {earning.lastEarnings && earning.lastEarnings !== 'N/A' && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Earnings</span>
                <span className="text-sm">{earning.lastEarnings} {earning.currency}</span>
              </div>
            )}
            {earning.conferenceCallUrl && (
              <div className="mt-4 pt-4 border-t">
                <a 
                  href={earning.conferenceCallUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 flex items-center justify-center w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Join Conference Call
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  function renderWeekView(week: Date) {
    const days = eachDayOfInterval({
      start: startOfWeek(week),
      end: endOfWeek(week)
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Week of {format(week, 'MMM d, yyyy')}
          </h3>
          <Button variant="ghost" onClick={() => setSelectedWeek(null)}>
            Back to Month View
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-4">
          {days.map(day => {
            const dayEarnings = getEarningsForDate(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[200px] p-4 rounded-lg border ${
                  isCurrentDay ? 'border-primary' : 'border-border'
                }`}
              >
                <div className={`font-medium mb-4 ${
                  isCurrentDay ? 'text-primary' : ''
                }`}>
                  {format(day, 'EEE')}<br />
                  {format(day, 'MMM d')}
                </div>
                
                <div className="space-y-2">
                  {dayEarnings.map(earning => renderEarningsCard(earning))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderMonthCalendar(month: Date) {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const weeks = eachWeekOfInterval({ start, end });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <h2 className="text-2xl font-bold">
            {format(month, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium bg-muted-foreground/5">
              {day}
            </div>
          ))}
          
          {weeks.map(week => {
            const days = eachDayOfInterval({
              start: startOfWeek(week),
              end: endOfWeek(week)
            });

            return (
              <div 
                key={week.toISOString()}
                className={`contents group cursor-pointer`}
                onMouseEnter={() => setHoveredWeek(week)}
                onMouseLeave={() => setHoveredWeek(null)}
                onClick={() => setSelectedWeek(week)}
              >
                {days.map(day => {
                  const dayEarnings = getEarningsForDate(day);
                  const isCurrentMonth = isSameMonth(day, month);
                  const isCurrentDay = isToday(day);
                  const isHovered = hoveredWeek && isSameWeek(day, hoveredWeek);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[100px] p-2 transition-colors ${
                        isCurrentMonth 
                          ? 'bg-card' 
                          : 'bg-muted/50'
                      } ${
                        isCurrentDay
                          ? 'ring-2 ring-primary ring-inset'
                          : ''
                      } ${
                        isHovered
                          ? 'bg-muted-foreground/5'
                          : ''
                      }`}
                    >
                      <div className={`font-medium mb-2 text-sm ${
                        isCurrentDay ? 'text-primary' : ''
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEarnings.slice(0, 3).map(earning => (
                          <Dialog key={`${earning.symbol}-${earning.reportDate}`}>
                            <DialogTrigger asChild>
                              <div className="text-[10px] p-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-gray-100 dark:bg-gray-800 flex items-center">
                                <span className="font-medium">{earning.symbol}</span>
                                <span className="ml-1 opacity-75">
                                  {earning.earningsType === 'Before Market Open' ? '(BMO)' :
                                   earning.earningsType === 'After Market Close' ? '(AMC)' : ''}
                                </span>
                              </div>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{earning.name} ({earning.symbol})</DialogTitle>
                                <DialogDescription>Earnings Report Details</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3 pt-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Report Date</span>
                                  <span className="text-sm">{format(parseISO(earning.reportDate), 'PPP')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Time</span>
                                  <span className="text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">{earning.earningsType}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Estimate</span>
                                  <span className="text-sm">{earning.estimate === 'N/A' ? 'Not Available' : `${earning.estimate} ${earning.currency}`}</span>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ))}
                        {dayEarnings.length > 3 && (
                          <div 
                            className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWeek(startOfWeek(day));
                            }}
                          >
                            +{dayEarnings.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="flex items-center justify-between border-b pb-4">
          <TabsList className="h-10">
            {TABS.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="px-8">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="earnings" className="flex-grow pt-6">
          {loading ? (
            <div className="text-center py-12">Loading earnings data...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-12">{error}</div>
          ) : selectedWeek ? (
            renderWeekView(selectedWeek)
          ) : (
            renderMonthCalendar(selectedDate)
          )}
        </TabsContent>

        <TabsContent value="events" className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            Economic events calendar coming soon
          </div>
        </TabsContent>

        <TabsContent value="elite" className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            Elite events calendar coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 