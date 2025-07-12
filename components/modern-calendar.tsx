'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isPast } from 'date-fns';
import { startOfDay, endOfDay, isSameWeek, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, DollarSign, Building2, Zap, AlertTriangle, Clock, X } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  date: string;
  ticker: string;
  company_name: string;
  event_type: string;
  confirmed: boolean;
  auto_generated?: boolean;
  created_at?: any;
  iconUrl?: string;
  logoUrl?: string;
  type?: 'economic' | 'earnings';
}

interface ModernCalendarProps {
  type?: 'events' | 'earnings' | 'all';
}

type ViewMode = 'month' | 'week' | 'day';

export function ModernCalendar({ type = 'all' }: ModernCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const fetchingRef = useRef(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [weekStartDate, setWeekStartDate] = useState<Date>(startOfWeek(currentDate));
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Memoize calendar calculations to prevent unnecessary recalculations
  const { monthStart, monthEnd, calendarStart, calendarEnd, calendarDays } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return { monthStart, monthEnd, calendarStart, calendarEnd, calendarDays };
  }, [currentDate]);

  // Memoize the current month string to prevent unnecessary useEffect runs
  const currentMonthKey = useMemo(() => format(currentDate, 'yyyy-MM'), [currentDate]);

  useEffect(() => {
    const fetchEvents = async () => {
      // Prevent multiple simultaneous fetches
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        setIsLoading(true);
        const db = getFirestore();
        const startDate = format(calendarStart, 'yyyy-MM-dd');
        const endDate = format(calendarEnd, 'yyyy-MM-dd');
        
        console.log('📅 Fetching events for date range:', startDate, 'to', endDate);
        console.log('📅 Current month being displayed:', format(currentDate, 'MMMM yyyy'));
        
        // Fetch real events from database
        const newEvents: Record<string, CalendarEvent[]> = {};

        if (type === 'events' || type === 'all') {
          // Fetch economic events
          const economicEventsRef = collection(db, 'economic_events');
          const economicQuery = query(
            economicEventsRef,
            where('date', '>=', startDate),
            where('date', '<=', endDate)
          );
          const economicSnapshot = await getDocs(economicQuery);
          
          console.log('📊 Found', economicSnapshot.size, 'economic events in database');
          
          economicSnapshot.forEach((doc) => {
            const eventData = doc.data();
            console.log('📊 Economic event:', eventData);
            const event: CalendarEvent = {
              id: doc.id,
              date: eventData.date,
              ticker: eventData.event?.substring(0, 5).toUpperCase() || 'ECON',
              company_name: eventData.event || 'Economic Event',
              event_type: eventData.importance || 'MEDIUM',
              confirmed: true,
              auto_generated: false,
              created_at: eventData.createdAt,
              // Add economic event specific fields
              iconUrl: eventData.iconUrl,
              type: 'economic'
            };
            
            if (!newEvents[event.date]) {
              newEvents[event.date] = [];
            }
            newEvents[event.date].push(event);
          });
        }

        if (type === 'earnings' || type === 'all') {
          // Fetch earnings events (but not when type is 'events')
          const earningsRef = collection(db, 'earnings_calendar');
          const earningsQuery = query(
            earningsRef,
            where('earningsDate', '>=', startDate),
            where('earningsDate', '<=', endDate)
          );
          const earningsSnapshot = await getDocs(earningsQuery);
          
          console.log('📊 Found', earningsSnapshot.size, 'earnings events in database');
          
          earningsSnapshot.forEach((doc) => {
            const eventData = doc.data();
            const event: CalendarEvent = {
              id: doc.id,
              date: eventData.earningsDate,
              ticker: eventData.stockTicker || eventData.ticker || 'STOCK',
              company_name: eventData.companyName || eventData.company_name || 'Company',
              event_type: eventData.earningsType || 'Earnings',
              confirmed: eventData.isConfirmed || false,
              auto_generated: eventData.auto_generated || false,
              created_at: eventData.created_at,
              // Add earnings specific fields
              logoUrl: eventData.logoUrl,
              type: 'earnings'
            };
            
            if (!newEvents[event.date]) {
              newEvents[event.date] = [];
            }
            newEvents[event.date].push(event);
          });
        }

        setEvents(newEvents);
        console.log('📅 Calendar events loaded:', Object.keys(newEvents).length, 'days with events');
        console.log('📅 Events by date:', newEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        // Show fallback event if Firebase fails
        const newEvents: Record<string, CalendarEvent[]> = {};
        setEvents(newEvents);
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchEvents();
  }, [currentMonthKey, type]); // Only depend on currentMonthKey and type to prevent unnecessary re-renders

  const handleDateClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEvents = events[dateKey] || [];
    setSelectedDate(date);
    setSelectedDayEvents(dayEvents);
  };

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/delete-economic-event/${eventId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Remove from UI
        setSelectedDayEvents((prev) => prev.filter((e) => e.id !== eventId));
        setEvents((prev) => {
          const newEvents = { ...prev };
          Object.keys(newEvents).forEach((date) => {
            newEvents[date] = newEvents[date].filter((e) => e.id !== eventId);
          });
          return newEvents;
        });
      } else {
        alert('Failed to delete event');
      }
    } catch (err) {
      alert('Error deleting event');
    } finally {
      setDeletingId(null);
    }
  };

  const getEventIcon = (event: CalendarEvent) => {
    // If event has an iconUrl, use it
    if (event.iconUrl) {
      return <img src={event.iconUrl} alt={event.company_name} className="h-4 w-4 rounded" />;
    }
    
    // If event has a logoUrl, use it
    if (event.logoUrl) {
      return <img src={event.logoUrl} alt={event.company_name} className="h-4 w-4 rounded" />;
    }
    
    // Fallback to ticker-based icons
    const ticker = event.ticker;
    if (ticker === 'MARKET') return <AlertTriangle className="h-4 w-4" />;
    if (ticker === 'WITCHING') return <Zap className="h-4 w-4" />;
    if (ticker === 'FOMC' || ticker === 'BEIGE' || ticker === 'MINUTES') return <Building2 className="h-4 w-4" />;
    if (ticker === 'VIX') return <TrendingUp className="h-4 w-4" />;
    if (['CPI', 'PPI', 'PCE', 'JOBS', 'UNEMP', 'CLAIMS', 'RETAIL', 'CONF', 'MICH', 'ISM', 'ISPMI', 'IP', 'STARTS', 'EXIST', 'NEW', 'GDP', 'TRADE'].includes(ticker)) return <DollarSign className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  const getEventColor = (ticker: string, eventType: string) => {
    if (ticker === 'MARKET') return 'bg-red-100 text-red-800 border-red-200';
    if (ticker === 'WITCHING') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (ticker === 'FOMC' || ticker === 'BEIGE' || ticker === 'MINUTES') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (ticker === 'VIX') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (['CPI', 'PPI', 'PCE', 'JOBS', 'UNEMP', 'CLAIMS', 'RETAIL', 'CONF', 'MICH', 'ISM', 'ISPMI', 'IP', 'STARTS', 'EXIST', 'NEW', 'GDP', 'TRADE'].includes(ticker)) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getEventTypeIcon = (ticker: string) => {
    if (ticker === 'MARKET') return <AlertTriangle className="h-3 w-3" />;
    if (ticker === 'WITCHING') return <Zap className="h-3 w-3" />;
    if (ticker === 'FOMC' || ticker === 'BEIGE' || ticker === 'MINUTES') return <Building2 className="h-3 w-3" />;
    if (ticker === 'VIX') return <TrendingUp className="h-3 w-3" />;
    if (['CPI', 'PPI', 'PCE', 'JOBS', 'UNEMP', 'CLAIMS', 'RETAIL', 'CONF', 'MICH', 'ISM', 'ISPMI', 'IP', 'STARTS', 'EXIST', 'NEW', 'GDP', 'TRADE'].includes(ticker)) return <DollarSign className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  const getUniqueEventTypes = (events: CalendarEvent[]) => {
    const eventTypes = new Map<string, React.ReactNode>();
    
    events.forEach(event => {
      const ticker = event.ticker;
      let icon: React.ReactNode;
      
      if (ticker === 'MARKET') {
        icon = <AlertTriangle className="h-3 w-3 text-red-600" />;
        eventTypes.set('Market Closed', icon);
      } else if (ticker === 'WITCHING') {
        icon = <Zap className="h-3 w-3 text-purple-600" />;
        eventTypes.set('Options Expiration', icon);
      } else if (ticker === 'FOMC' || ticker === 'BEIGE' || ticker === 'MINUTES') {
        icon = <Building2 className="h-3 w-3 text-blue-600" />;
        eventTypes.set('Fed Events', icon);
      } else if (ticker === 'VIX') {
        icon = <TrendingUp className="h-3 w-3 text-orange-600" />;
        eventTypes.set('VIX Events', icon);
      } else if (['CPI', 'PPI', 'PCE', 'JOBS', 'UNEMP', 'CLAIMS', 'RETAIL', 'CONF', 'MICH', 'ISM', 'ISPMI', 'IP', 'STARTS', 'EXIST', 'NEW', 'GDP', 'TRADE'].includes(ticker)) {
        icon = <DollarSign className="h-3 w-3 text-green-600" />;
        eventTypes.set('Economic Data', icon);
      } else {
        icon = <TrendingUp className="h-3 w-3 text-slate-600" />;
        eventTypes.set('Other Events', icon);
      }
    });
    
    return Array.from(eventTypes.values());
  };

  // Function to prioritize important events for display
  const getPrioritizedEvents = (events: CalendarEvent[]) => {
    if (events.length === 0) return [];
    
    // Define priority order (higher index = higher priority)
    const priorityOrder = [
      'CPI', 'PPI', 'PCE', 'JOBS', 'UNEMP', 'CLAIMS', 'RETAIL', 'CONF', 'MICH', 'ISM', 'ISPMI', 'IP', 'STARTS', 'EXIST', 'NEW', 'GDP', 'TRADE', // Economic data
      'FOMC', 'BEIGE', 'MINUTES', // Fed events
      'VIX', // VIX events
      'WITCHING', // Options expiration
      'MARKET' // Market closed
    ];
    
    // Sort events by priority
    const sortedEvents = [...events].sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.ticker);
      const bPriority = priorityOrder.indexOf(b.ticker);
      
      // If both are in priority list, sort by priority (higher index = higher priority)
      if (aPriority !== -1 && bPriority !== -1) {
        return bPriority - aPriority;
      }
      
      // If only one is in priority list, prioritize it
      if (aPriority !== -1 && bPriority === -1) return -1;
      if (aPriority === -1 && bPriority !== -1) return 1;
      
      // If neither is in priority list, maintain original order
      return 0;
    });
    
    return sortedEvents;
  };

  const renderDayDetailDialog = () => {
    if (!selectedDate) return null;

    return (
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-7xl max-h-[98vh] w-[95vw] p-4 sm:p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 sm:gap-3">
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h2>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'} scheduled
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3 sm:mt-4">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <h3 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">No events scheduled</h3>
                <p className="text-xs sm:text-sm">This day is clear of major market events.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {selectedDayEvents.map((event, index) => (
                  <Card key={`${event.date}-${index}`} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={cn(
                        "p-1.5 sm:p-2 rounded-lg flex items-center justify-center shrink-0",
                        getEventColor(event.ticker, event.event_type)
                      )}>
                        {getEventIcon(event)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                          <Badge variant="outline" className="font-mono font-bold text-xs sm:text-sm">
                            {event.ticker}
                          </Badge>
                          {event.auto_generated && (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">
                              Auto
                            </Badge>
                          )}
                          {!event.confirmed && (
                            <Badge variant="destructive" className="text-[10px] sm:text-xs">
                              Unconfirmed
                            </Badge>
                          )}
                          {/* Delete button for economic events */}
                          {event.type === 'economic' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="ml-2"
                              disabled={deletingId === event.id}
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              {deletingId === event.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-sm sm:text-base md:text-lg mb-1">{event.company_name}</h4>
                        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                          {event.event_type}
                        </p>
                        
                        {event.ticker === 'MARKET' && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-red-800">
                              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="font-medium text-xs sm:text-sm">Market Closed</span>
                            </div>
                            <p className="text-red-700 text-[10px] sm:text-xs mt-1">No trading activity today</p>
                          </div>
                        )}
                        
                        {event.ticker === 'WITCHING' && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-purple-800">
                              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="font-medium text-xs sm:text-sm">High Volatility Expected</span>
                            </div>
                            <p className="text-purple-700 text-[10px] sm:text-xs mt-1">Options expiration may cause increased market activity</p>
                          </div>
                        )}
                        
                        {(event.ticker === 'FOMC' || event.ticker === 'BEIGE' || event.ticker === 'MINUTES') && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-blue-800">
                              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="font-medium text-xs sm:text-sm">Federal Reserve Event</span>
                            </div>
                            <p className="text-blue-700 text-[10px] sm:text-xs mt-1">Potential market-moving monetary policy announcement</p>
                          </div>
                        )}
                        
                        {['CPI', 'PPI', 'PCE', 'JOBS', 'UNEMP', 'CLAIMS', 'RETAIL', 'CONF', 'MICH', 'ISM', 'ISPMI', 'IP', 'STARTS', 'EXIST', 'NEW', 'GDP', 'TRADE'].includes(event.ticker) && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-green-800">
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="font-medium text-xs sm:text-sm">Economic Data Release</span>
                            </div>
                            <p className="text-green-700 text-[10px] sm:text-xs mt-1">Monitor for market reaction to economic indicators</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

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
          setViewMode('week');
          setSelectedDate(new Date());
          setWeekStartDate(startOfWeek(new Date()));
        }}
      >Week</Button>
    </div>
  );

  const renderMonthView = () => (
    <>
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <Button 
          variant="ghost" 
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {renderViewToggles()}
      {/* Calendar Grid (existing code) */}
      <Card>
        <CardContent className="p-2 sm:p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-1 sm:p-3 text-center font-medium text-muted-foreground text-[10px] sm:text-sm">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = events[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              const isDayPast = isPast(day) && !isDayToday;
              return (
                <div key={dateKey} className="relative">
                  <div
                    className={cn(
                      "relative min-h-[60px] sm:min-h-[80px] md:min-h-[120px] p-0.5 sm:p-1 md:p-2 border rounded-md sm:rounded-lg cursor-pointer transition-all duration-200 touch-manipulation",
                      "hover:bg-accent hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                      !isCurrentMonth && "opacity-40 bg-muted/20",
                      isDayToday && "ring-1 sm:ring-2 ring-primary bg-primary/5",
                      isDayPast && "bg-muted/10"
                    )}
                    onClick={() => {
                      setSelectedDate(day);
                      setSelectedDayEvents(dayEvents);
                    }}
                  >
                    {/* Cross overlay for past dates */}
                    {isDayPast && dayEvents.length > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="absolute inset-0 bg-red-500/10 rounded-md" />
                        <X className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-red-500 drop-shadow-lg opacity-80" />
                      </div>
                    )}
                    <div className={cn(
                      "text-[10px] sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1 md:mb-2",
                      isDayToday && "text-primary font-bold",
                      isDayPast && "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                      {dayEvents.length > 0 && (
                        <div className="text-[8px] text-muted-foreground mt-0.5 opacity-60">
                          click to view
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-0.5 sm:space-y-1">
                      {getPrioritizedEvents(dayEvents).slice(0, 1).map((event, index) => (
                        <div
                          key={`${event.date}-${index}`}
                          className={cn(
                            "text-[8px] sm:text-xs px-0.5 sm:px-1 md:px-2 py-0.5 sm:py-1 rounded border truncate",
                            getEventColor(event.ticker, event.event_type),
                            isDayPast && "opacity-60"
                          )}
                          title={`${event.ticker}: ${event.company_name}`}
                        >
                          <span className="font-medium">{event.ticker}</span>
                        </div>
                      ))}
                      {dayEvents.length > 1 && (
                        <div className={cn(
                          "text-[8px] sm:text-xs bg-gray-100 text-red-600 font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded",
                          isDayPast && "opacity-60"
                        )}>
                          +{dayEvents.length - 1} more
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Event Type Icons - Positioned to the right */}
                  {dayEvents.length > 0 && (
                    <div className="absolute -right-1 sm:-right-2 top-1 sm:top-2 flex flex-col gap-0.5 sm:gap-1">
                      {getUniqueEventTypes(dayEvents).map((icon, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-0.5 sm:p-1 rounded border bg-background shadow-sm",
                            isDayPast && "opacity-60"
                          )}
                        >
                          {icon}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );

  const renderWeekView = () => {
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
    return (
      <>
        {renderViewToggles()}
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => setWeekStartDate(addDays(weekStartDate, -7))}><ChevronLeft className="h-4 w-4" />Prev</Button>
          <h2 className="text-xl font-bold">Week of {format(weekStartDate, 'MMM d, yyyy')}</h2>
          <Button variant="ghost" onClick={() => setWeekStartDate(addDays(weekStartDate, 7))}>Next<ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = events[dateKey] || [];
            return (
              <div key={dateKey} className="relative">
                <Card 
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedDate(day);
                    setSelectedDayEvents(dayEvents);
                  }}
                >
                  <div className="text-center mb-2">
                    <div className="text-lg font-bold">{format(day, 'EEE')}</div>
                    <div className="text-sm text-muted-foreground">{format(day, 'MMM d')}</div>
                    {dayEvents.length > 0 && (
                      <div className="text-[8px] text-muted-foreground mt-1 opacity-60">
                        click to view
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {dayEvents.length > 0 ? (
                      <>
                        {/* Event Details - 2x2 Grid Layout */}
                        <div className="grid grid-cols-2 gap-1 w-full">
                          {getPrioritizedEvents(dayEvents).slice(0, 4).map((event, i) => (
                            <div key={i} className="flex flex-col items-center gap-0.5 text-center">
                              <span className="font-semibold text-[10px] leading-tight">{event.company_name}</span>
                              <span className="text-[8px] text-muted-foreground leading-tight">{event.ticker}</span>
                            </div>
                          ))}
                        </div>
                        {dayEvents.length > 4 && (
                          <div className="text-[8px] bg-gray-100 text-red-600 font-medium px-1 py-0.5 rounded">
                            +{dayEvents.length - 4} more
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No Events</div>
                    )}
                  </div>
                </Card>
                
                {/* Event Type Icons - Positioned to the right */}
                {dayEvents.length > 0 && (
                  <div className="absolute -right-1 top-2 flex flex-col gap-1">
                    {getUniqueEventTypes(dayEvents).map((icon, index) => (
                      <div
                        key={index}
                        className="p-1 rounded border bg-background shadow-sm"
                      >
                        {icon}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">Loading calendar events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Click any day to view events</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 justify-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="touch-manipulation h-8 sm:h-9 px-2 sm:px-3"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="touch-manipulation h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="touch-manipulation h-8 sm:h-9 px-2 sm:px-3"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
      {/* View Mode Switcher */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {/* Event Legend - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg">Event Types</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {type !== 'events' && (
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="p-0.5 sm:p-1 rounded bg-slate-100 text-slate-800">
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </div>
                <span className="text-[10px] sm:text-xs md:text-sm">Earnings</span>
              </div>
            )}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-green-100 text-green-600">
                <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Economic Data</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-blue-100 text-blue-600">
                <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Fed Events</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-purple-100 text-purple-600">
                <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Options Expiration</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-orange-100 text-orange-600">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">VIX Events</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-red-100 text-red-600">
                <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Market Closed</span>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Day Detail Dialog */}
      {renderDayDetailDialog()}
    </div>
  );
} 