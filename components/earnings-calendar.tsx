'use client';

import React from "react";

import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, isSameWeek } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, Calendar as CalendarIcon, ExternalLink, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import tickers from '../lib/tickers.json';

type ViewMode = 'months' | 'month' | 'week';

interface EarningsEvent {
  id: string; // Document ID for deletion
  stockTicker: string;
  companyName: string;
  eventDate: Date;
  logoUrl?: string;
  earningsType: 'BMO' | 'AMC'; // Before Market Open or After Market Close
  estimatedEPS?: number;
  actualEPS?: number;
  estimatedRevenue?: number;
  actualRevenue?: number;
  conferenceCallUrl?: string;
  lastEarningsDate?: Date;
  lastEarningsEPS?: number;
  lastEarningsRevenue?: number;
}

interface EarningsCalendarProps {
  type?: 'events' | 'earnings' | 'elite';
}

// Static market cap mapping (in billions, example values)
const MARKET_CAPS: Record<string, number> = {
  AAPL: 3000, MSFT: 2800, GOOGL: 2000, AMZN: 1900, TSLA: 800, NVDA: 2500, META: 1200, BRK: 900, V: 500, UNH: 450, JPM: 400, XOM: 400, MA: 350, AVGO: 600, LLY: 700, JNJ: 400, WMT: 450, PG: 350, HD: 350, CVX: 300
};

// Helper to get market cap, fallback to 0 if not found
function getMarketCap(ticker: string) {
  return MARKET_CAPS[ticker.replace(/\..*$/, '')] || 0;
}

export function EarningsCalendar({ type = 'earnings' }: EarningsCalendarProps) {
  const { user, firebaseUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('months');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Record<string, EarningsEvent[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EarningsEvent | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  // Add modal state for overflow
  const [overflowModal, setOverflowModal] = useState<{date: string, events: EarningsEvent[], dayTitle?: string} | null>(null);
  // Add state for tracking failed logo loads
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  // Generate 7 months starting from current month
  const months = Array.from({ length: 7 }, (_, i) => addMonths(startOfMonth(new Date()), i));

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const db = getFirestore();
      
      // Get start and end dates based on view mode
      let start: Date, end: Date;
      if (viewMode === 'months') {
        start = months[0];
        end = months[months.length - 1];
      } else if (viewMode === 'month') {
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
      } else {
        start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      }

      const eventsRef = collection(db, 'earnings_calendar');
      
      // Convert dates to YYYY-MM-DD format for proper querying
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');
      
      console.log(`📅 Earnings Calendar: Querying from ${startDate} to ${endDate}`);
      console.log(`📅 Earnings Calendar: Current view mode: ${viewMode}`);
      console.log(`📅 Earnings Calendar: Selected date: ${format(selectedDate, 'yyyy-MM-dd')}`);
      
      // Try querying with string dates first (for newer data)
      let q = query(
        eventsRef,
        where('earningsDate', '>=', startDate),
        where('earningsDate', '<=', endDate)
      );

      let querySnapshot = await getDocs(q);
      console.log(`📅 Earnings Calendar: Found ${querySnapshot.size} documents with string date query`);

      // If no results, try with Date objects (for older data)
      if (querySnapshot.empty) {
        console.log('📅 Earnings Calendar: No results with string query, trying Date object query...');
        q = query(
          eventsRef,
          where('earningsDate', '>=', start),
          where('earningsDate', '<=', end)
        );
        querySnapshot = await getDocs(q);
        console.log(`📅 Earnings Calendar: Found ${querySnapshot.size} documents with Date object query`);
      }

      const newEvents: Record<string, EarningsEvent[]> = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📅 Earnings Calendar: Processing event:`, data);
        
        let localEventDate: Date;
        
        // Handle both string and Date object formats
        if (typeof data.earningsDate === 'string') {
          // Handle string date (YYYY-MM-DD format)
          const [year, month, day] = data.earningsDate.split('-').map(Number);
          localEventDate = new Date(year, month - 1, day);
        } else if (data.earningsDate instanceof Date) {
          // Handle Date object
          localEventDate = data.earningsDate;
        } else if (data.earningsDate?.toDate) {
          // Handle Firestore Timestamp
          localEventDate = data.earningsDate.toDate();
        } else {
          console.warn('📅 Earnings Calendar: Unknown earningsDate format:', data.earningsDate);
          return; // Skip this event
        }
        
        const event: EarningsEvent = {
          id: doc.id, // Add document ID for deletion
          stockTicker: data.stockTicker,
          companyName: data.companyName,
          eventDate: localEventDate,
          logoUrl: data.logoUrl,
          earningsType: data.earningsType,
          estimatedEPS: data.estimatedEPS,
          actualEPS: data.actualEPS,
          estimatedRevenue: data.estimatedRevenue,
          actualRevenue: data.actualRevenue,
          conferenceCallUrl: data.conferenceCallUrl,
          lastEarningsDate: data.lastEarningsDate ? new Date(data.lastEarningsDate) : undefined,
          lastEarningsEPS: data.lastEarningsEPS,
          lastEarningsRevenue: data.lastEarningsRevenue
        };
        const dateKey = format(localEventDate, 'yyyy-MM-dd');
        if (!newEvents[dateKey]) {
          newEvents[dateKey] = [];
        }
        newEvents[dateKey].push(event);
      });

      console.log(`📅 Earnings Calendar: Processed ${Object.keys(newEvents).length} days with events`);
      console.log(`📅 Earnings Calendar: Events by date:`, Object.keys(newEvents));
      setEvents(newEvents);
      
      // If no events found, try a simple query to see if there are any events at all
      if (Object.keys(newEvents).length === 0) {
        console.log('📅 Earnings Calendar: No events found in date range, checking if any events exist...');
        try {
          const simpleQuery = query(eventsRef, limit(5));
          const simpleSnapshot = await getDocs(simpleQuery);
          console.log(`📅 Earnings Calendar: Found ${simpleSnapshot.size} total events in database`);
          simpleSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`📅 Earnings Calendar: Sample event:`, data);
            console.log(`📅 Earnings Calendar: earningsDate type:`, typeof data.earningsDate);
            console.log(`📅 Earnings Calendar: earningsDate value:`, data.earningsDate);
          });
        } catch (simpleError) {
          console.error('📅 Earnings Calendar: Error checking for events:', simpleError);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate, viewMode, type]);

  const handleEventClick = (event: EarningsEvent, e: MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    setSelectedEvent(event);
  };

  const handleDeleteEvent = async (event: EarningsEvent) => {
    if (!firebaseUser) {
      toast.error('You must be logged in to delete events');
      return;
    }

    if (!confirm(`Are you sure you want to delete the ${event.stockTicker} earnings event on ${format(event.eventDate, 'MMM d, yyyy')}?`)) {
      return;
    }

    setIsDeleting(event.id);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/delete-earnings/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event');
      }

      toast.success(`🗑️ Deleted ${event.stockTicker} earnings event`);
      setSelectedEvent(null);
      
      // Refresh the events
      fetchEvents();
    } catch (error) {
      console.error('Delete event error:', error);
      toast.error('Failed to delete earnings event');
    } finally {
      setIsDeleting(null);
    }
  };

  const CompanyLogo = ({ event, size = "small" }: { event: EarningsEvent, size?: "small" | "large" }) => {
    // Mobile-responsive logo sizes
    const sizeClasses = size === "small" 
      ? "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" 
      : "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20";
    
    // Find logo URL from tickers.json (case-insensitive)
    const tickerEntry = tickers.find(
      (t) => t.ticker.toLowerCase() === event.stockTicker.toLowerCase()
    );
    let logoUrl = tickerEntry?.logoUrl;
    // Fallback to lowercase PNG if not found
    if (!logoUrl) {
      logoUrl = `/images/logos/${event.stockTicker.toLowerCase()}.png`;
    }
    
    // Check if this logo has failed to load
    const hasFailed = failedLogos.has(event.stockTicker.toLowerCase());
    
    return (
      <div 
        className={`${sizeClasses} cursor-pointer hover:opacity-80 flex-shrink-0`}
        onClick={(e) => handleEventClick(event, e)}
      >
        {hasFailed ? (
          <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm md:text-base lg:text-lg bg-primary text-white rounded">
            {event.stockTicker.slice(0, 2)}
          </div>
        ) : (
          <img
            src={logoUrl}
            alt={event.companyName}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Add to failed logos set to prevent flickering
              setFailedLogos(prev => new Set([...Array.from(prev), event.stockTicker.toLowerCase()]));
              // Log missing logo ticker
              console.log('Missing logo for:', event.stockTicker, '| Company:', event.companyName);
            }}
          />
        )}
      </div>
    );
  };

  // Helper function to check if a company has a logo
  const hasLogo = (event: EarningsEvent) => {
    const tickerEntry = tickers.find(
      (t) => t.ticker.toLowerCase() === event.stockTicker.toLowerCase()
    );
    return !!tickerEntry?.logoUrl;
  };

  const EarningsDialog = () => {
    if (!selectedEvent) return null;

    const formatMoney = (amount?: number) => {
      if (!amount) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };

    return (
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <CompanyLogo event={selectedEvent} size="large" />
              <div>
                <h2 className="text-2xl font-bold">{selectedEvent.companyName}</h2>
                <p className="text-muted-foreground">{selectedEvent.stockTicker}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">

            {/* Current Earnings Estimates */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Current Quarter Estimates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">EPS Estimate</p>
                  <p className="text-lg font-semibold">{formatMoney(selectedEvent.estimatedEPS)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Estimate</p>
                  <p className="text-lg font-semibold">{formatMoney(selectedEvent.estimatedRevenue)}</p>
                </div>
              </div>
            </Card>

            {/* Previous Quarter Results */}
            {selectedEvent.lastEarningsDate && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">
                  Previous Quarter ({format(selectedEvent.lastEarningsDate, 'MMM d, yyyy')})
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Actual EPS</p>
                    <p className="text-lg font-semibold">{formatMoney(selectedEvent.lastEarningsEPS)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Revenue</p>
                    <p className="text-lg font-semibold">{formatMoney(selectedEvent.lastEarningsRevenue)}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Conference Call Section */}
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Conference Call
              </h3>
              {selectedEvent.conferenceCallUrl ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Access the live earnings call and investor information for {selectedEvent.companyName}.
                  </p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(selectedEvent.conferenceCallUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Investor Relations
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">
                    Conference call information not yet available for {selectedEvent.companyName}.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`https://www.google.com/search?q=${selectedEvent.stockTicker}+earnings+call+investor+relations`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Search for Earnings Call
                  </Button>
                </div>
              )}
            </Card>

            {/* Earnings Timing Banner */}
            <div className={`p-3 rounded-lg text-center font-medium ${
              selectedEvent.earningsType === 'BMO' 
                ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                : 'bg-purple-100 text-purple-800 border border-purple-200'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {selectedEvent.earningsType === 'BMO' 
                    ? '🌅 Before Market Open (Pre-Market)' 
                    : '🌆 After Market Close (Post-Market)'
                  }
                </span>
              </div>
              <p className="text-xs mt-1 opacity-75">
                {selectedEvent.earningsType === 'BMO' 
                  ? 'Results typically released around 6:00-8:00 AM ET' 
                  : 'Results typically released around 4:00-6:00 PM ET'
                }
              </p>
            </div>

            {/* Delete Button (All Users) */}
            {user && (
              <div className="border-t pt-4">
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteEvent(selectedEvent)}
                  disabled={isDeleting === selectedEvent.id}
                  className="w-full"
                >
                  {isDeleting === selectedEvent.id ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Earnings Event
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderMonthsView = () => (
    <div className="grid grid-cols-3 gap-4">
      {months.map((month) => (
        <Card
          key={format(month, 'yyyy-MM')}
          className="p-6 cursor-pointer hover:bg-accent"
          onClick={() => {
            setSelectedDate(month);
            setViewMode('month');
          }}
        >
          <h3 className="text-xl font-bold mb-2">{format(month, 'MMMM yyyy')}</h3>
          <p className="text-sm text-muted-foreground uppercase">EARNINGS</p>
          <p className="mt-4">Click to zoom in</p>
        </Card>
      ))}
    </div>
  );

  // Helper for toggles
  const renderViewToggles = () => (
    <div className="flex gap-2 mb-4 justify-center">
      <Button
        variant={viewMode === 'month' ? 'default' : 'outline'}
        onClick={() => setViewMode('month')}
      >Month</Button>
      <Button
        variant={viewMode === 'week' ? 'default' : 'outline'}
        onClick={() => {
          // When switching to week view, set the selected date to the current week
          const today = new Date();
          const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
          setSelectedDate(currentWeekStart);
          setViewMode('week');
        }}
      >Week</Button>
    </div>
  );

  const renderMonthView = () => {
    const days = eachDayOfInterval({
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate)
    });

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setViewMode('months')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Months
          </Button>
          <h2 className="text-2xl font-bold">{format(selectedDate, 'MMMM yyyy')}</h2>
        </div>
        {renderViewToggles()}
        <div className="grid grid-cols-5 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.filter(day => {
            const dayOfWeek = day.getDay();
            return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday = 1, Friday = 5
          }).map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            let dayEvents = events[dateKey] || [];
            // Sort by: 1) Has logo (prioritize), 2) Market cap descending
            dayEvents = [...dayEvents].sort((a, b) => {
              const aHasLogo = hasLogo(a);
              const bHasLogo = hasLogo(b);
              
              // First priority: companies with logos come first
              if (aHasLogo && !bHasLogo) return -1;
              if (!aHasLogo && bHasLogo) return 1;
              
              // Second priority: market cap (if both have logos or both don't)
              return getMarketCap(b.stockTicker) - getMarketCap(a.stockTicker);
            });
            const isHoveredWeek = hoveredDate && isSameWeek(day, hoveredDate, { weekStartsOn: 1 });
            const showEvents = dayEvents.slice(0, 8);
            const overflowCount = dayEvents.length - 8;
            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-[140px] p-2 border rounded transition-colors duration-200 relative",
                  isHoveredWeek && "bg-accent/50 cursor-pointer",
                  !dayEvents.length && "hover:bg-accent/25"
                )}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => {
                  if (isHoveredWeek) {
                    setSelectedDate(day);
                    setViewMode('week');
                  } else {
                    setSelectedDate(day);
                    // Show day details in a modal instead of switching view
                    setOverflowModal({ 
                      date: dateKey, 
                      events: dayEvents,
                      dayTitle: format(day, 'EEEE, MMMM d, yyyy')
                    });
                  }
                }}
              >
                {/* Event count in top-right corner */}
                {dayEvents.length > 0 && (
                  <div className="absolute top-1 right-1 bg-gray-500 text-red-500 text-xs px-1.5 py-0.5 rounded font-medium">
                    {dayEvents.length}
                  </div>
                )}
                
                <div className="font-medium">{format(day, 'd')}</div>
                {dayEvents.length > 0 && (
                  <div className="mt-2">
                    {/* First row of 3 logos (bigger spacing) */}
                    <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                      {showEvents.slice(0, 3).map((event: EarningsEvent, i: number) => (
                        <div
                          key={i}
                          className="relative group"
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            handleEventClick(event, e);
                          }}
                        >
                          <CompanyLogo event={event} />
                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {event.companyName}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Second row of 3 logos */}
                    <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                      {showEvents.slice(3, 6).map((event: EarningsEvent, i: number) => (
                        <div
                          key={i + 3}
                          className="relative group"
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            handleEventClick(event, e);
                          }}
                        >
                          <CompanyLogo event={event} />
                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {event.companyName}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Third row for remaining 2 logos or overflow */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {showEvents.slice(6, 8).map((event: EarningsEvent, i: number) => (
                        <div
                          key={i + 6}
                          className="relative group"
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            handleEventClick(event, e);
                          }}
                        >
                          <CompanyLogo event={event} />
                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {event.companyName}
                          </div>
                        </div>
                      ))}
                      {overflowCount > 0 && (
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-gray-500 text-red-500 text-xs rounded hover:bg-gray-600"
                          onClick={e => {
                            e.stopPropagation();
                            setOverflowModal({ date: dateKey, events: dayEvents });
                          }}
                        >
                          +{overflowCount}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Overflow Modal */}
        {overflowModal && (
          <Dialog open={!!overflowModal} onOpenChange={() => setOverflowModal(null)}>
            <DialogContent className="max-w-6xl max-h-[95vh] w-[90vw]">
              <DialogHeader>
                <DialogTitle>
                  {overflowModal.dayTitle ? overflowModal.dayTitle : `Earnings for ${overflowModal.date}`}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[80vh]">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {overflowModal.events.map((event, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 border rounded bg-card">
                      <CompanyLogo event={event} size="large" />
                      <div>
                        <div className="font-semibold">{event.companyName}</div>
                        <div className="text-sm text-muted-foreground">{event.stockTicker}</div>
                        <div className="text-xs">{event.earningsType}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setViewMode('month')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Month
          </Button>
          <h2 className="text-2xl font-bold">
            Week of {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 4), 'MMM d, yyyy')}
          </h2>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {weekDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            let dayEvents = events[dateKey] || [];
            // Sort by: 1) Has logo (prioritize), 2) Market cap descending
            dayEvents = [...dayEvents].sort((a, b) => {
              const aHasLogo = hasLogo(a);
              const bHasLogo = hasLogo(b);
              
              // First priority: companies with logos come first
              if (aHasLogo && !bHasLogo) return -1;
              if (!aHasLogo && bHasLogo) return 1;
              
              // Second priority: market cap (if both have logos or both don't)
              return getMarketCap(b.stockTicker) - getMarketCap(a.stockTicker);
            });

            return (
              <Card 
                key={dateKey} 
                className={cn(
                  "p-4 cursor-pointer transition-colors duration-200 hover:bg-accent/50",
                  dayEvents.length > 0 && "border-primary/20"
                )}
                onClick={() => {
                  setSelectedDate(day);
                  // Show day details in a modal instead of switching view
                  setOverflowModal({ 
                    date: dateKey, 
                    events: dayEvents,
                    dayTitle: format(day, 'EEEE, MMMM d, yyyy')
                  });
                }}
              >
                <div className="text-center mb-4">
                  <div className="text-lg font-bold">{format(day, 'EEEE')}</div>
                  <div className="text-sm text-muted-foreground">{format(day, 'MMM d')}</div>
                  {/* Event count badge */}
                  {dayEvents.length > 0 && (
                    <div className="absolute top-2 right-2 bg-gray-500 text-red-500 text-xs px-1.5 py-0.5 rounded font-medium">
                      {dayEvents.length}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                  {dayEvents.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {dayEvents.slice(0, 4).map((event: EarningsEvent, i: number) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <CompanyLogo event={event} size="small" />
                          <div className="text-xs text-center">{event.stockTicker}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No Earnings</div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };



  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {viewMode === 'months' && renderMonthsView()}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      <EarningsDialog />
    </div>
  );
} 
