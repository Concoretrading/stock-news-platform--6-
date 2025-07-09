'use client';

import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isToday, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, DollarSign, Building2, Zap, AlertTriangle, Clock } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
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
}

interface ModernCalendarProps {
  type?: 'events' | 'earnings' | 'all';
}

export function ModernCalendar({ type = 'all' }: ModernCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);

  // Get calendar days for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const db = getFirestore();
        
        const eventsRef = collection(db, 'earnings_calendar');
        const startDate = format(calendarStart, 'yyyy-MM-dd');
        const endDate = format(calendarEnd, 'yyyy-MM-dd');
        
        const q = query(
          eventsRef,
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        );

        const querySnapshot = await getDocs(q);
        const newEvents: Record<string, CalendarEvent[]> = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const event: CalendarEvent = {
            id: doc.id,
            date: data.date,
            ticker: data.ticker || data.stockTicker || 'N/A',
            company_name: data.company_name || data.companyName || 'Unknown',
            event_type: data.event_type || data.earningsType || 'Event',
            confirmed: data.confirmed !== false,
            auto_generated: data.auto_generated || false,
            created_at: data.created_at
          };
          
          const dateKey = data.date;
          if (!newEvents[dateKey]) {
            newEvents[dateKey] = [];
          }
          newEvents[dateKey].push(event);
        });

        setEvents(newEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate, calendarStart, calendarEnd, type]);

  const handleDateClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEvents = events[dateKey] || [];
    setSelectedDate(date);
    setSelectedDayEvents(dayEvents);
  };

  const getEventIcon = (ticker: string, eventType: string) => {
    if (ticker === 'MARKET') return <AlertTriangle className="h-4 w-4" />;
    if (ticker === 'WITCHING') return <Zap className="h-4 w-4" />;
    if (ticker === 'FOMC' || ticker === 'FED') return <Building2 className="h-4 w-4" />;
    if (ticker === 'VIX') return <TrendingUp className="h-4 w-4" />;
    if (['CPI', 'PPI', 'CLAIMS', 'RETAIL', 'HOUSING', 'PMI', 'GDP', 'MICH'].includes(ticker)) return <DollarSign className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  const getEventColor = (ticker: string, eventType: string) => {
    if (ticker === 'MARKET') return 'bg-red-100 text-red-800 border-red-200';
    if (ticker === 'WITCHING') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (ticker === 'FOMC' || ticker === 'FED') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (ticker === 'VIX') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (['CPI', 'PPI', 'CLAIMS', 'RETAIL', 'HOUSING', 'PMI', 'GDP', 'MICH'].includes(ticker)) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const renderDayDetailDialog = () => {
    if (!selectedDate) return null;

    return (
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h2>
                <p className="text-muted-foreground text-sm">
                  {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'} scheduled
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[500px] mt-4">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No events scheduled</h3>
                <p className="text-sm">This day is clear of major market events.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayEvents.map((event, index) => (
                  <Card key={`${event.date}-${index}`} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-lg flex items-center justify-center shrink-0",
                        getEventColor(event.ticker, event.event_type)
                      )}>
                        {getEventIcon(event.ticker, event.event_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono font-bold">
                            {event.ticker}
                          </Badge>
                          {event.auto_generated && (
                            <Badge variant="secondary" className="text-xs">
                              Auto
                            </Badge>
                          )}
                          {!event.confirmed && (
                            <Badge variant="destructive" className="text-xs">
                              Unconfirmed
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-lg mb-1">{event.company_name}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {event.event_type}
                        </p>
                        
                        {event.ticker === 'MARKET' && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-800">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium text-sm">Market Closed</span>
                            </div>
                            <p className="text-red-700 text-xs mt-1">No trading activity today</p>
                          </div>
                        )}
                        
                        {event.ticker === 'WITCHING' && (
                          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-2 text-purple-800">
                              <Zap className="h-4 w-4" />
                              <span className="font-medium text-sm">High Volatility Expected</span>
                            </div>
                            <p className="text-purple-700 text-xs mt-1">Options expiration may cause increased market activity</p>
                          </div>
                        )}
                        
                        {(event.ticker === 'FOMC' || event.ticker === 'FED') && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-800">
                              <Building2 className="h-4 w-4" />
                              <span className="font-medium text-sm">Federal Reserve Event</span>
                            </div>
                            <p className="text-blue-700 text-xs mt-1">Potential market-moving monetary policy announcement</p>
                          </div>
                        )}
                        
                        {['CPI', 'PPI', 'CLAIMS', 'RETAIL', 'HOUSING', 'PMI', 'GDP', 'MICH'].includes(event.ticker) && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium text-sm">Economic Data Release</span>
                            </div>
                            <p className="text-green-700 text-xs mt-1">Monitor for market reaction to economic indicators</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
          <p className="text-muted-foreground">Click any day to view events</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = events[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              
              return (
                <div
                  key={dateKey}
                  className={cn(
                    "min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all duration-200",
                    "hover:bg-accent hover:shadow-sm",
                    !isCurrentMonth && "opacity-40 bg-muted/20",
                    isDayToday && "ring-2 ring-primary bg-primary/5",
                  )}
                  onClick={() => handleDateClick(day)}
                >
                  <div className={cn(
                    "text-sm font-medium mb-2",
                    isDayToday && "text-primary font-bold"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, index) => (
                      <div
                        key={`${event.date}-${index}`}
                        className={cn(
                          "text-xs px-2 py-1 rounded-md border truncate",
                          getEventColor(event.ticker, event.event_type)
                        )}
                        title={`${event.ticker}: ${event.company_name}`}
                      >
                        <span className="font-medium">{event.ticker}</span>
                      </div>
                    ))}
                    
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground px-2 py-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-slate-100 text-slate-800">
                <TrendingUp className="h-3 w-3" />
              </div>
              <span className="text-sm">Earnings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-green-100 text-green-800">
                <DollarSign className="h-3 w-3" />
              </div>
              <span className="text-sm">Economic Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-blue-100 text-blue-800">
                <Building2 className="h-3 w-3" />
              </div>
              <span className="text-sm">Fed Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-purple-100 text-purple-800">
                <Zap className="h-3 w-3" />
              </div>
              <span className="text-sm">Options Expiration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-orange-100 text-orange-800">
                <TrendingUp className="h-3 w-3" />
              </div>
              <span className="text-sm">VIX Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3" />
              </div>
              <span className="text-sm">Market Closed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      {renderDayDetailDialog()}
    </div>
  );
} 