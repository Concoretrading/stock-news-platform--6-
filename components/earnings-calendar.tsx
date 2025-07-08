'use client';

import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, isSameWeek } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, Calendar as CalendarIcon, ExternalLink, Clock } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { cn } from '@/lib/utils';

type ViewMode = 'months' | 'month' | 'week';

interface EarningsEvent {
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

export function EarningsCalendar({ type = 'earnings' }: EarningsCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('months');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Record<string, EarningsEvent[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EarningsEvent | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Generate 7 months starting from current month
  const months = Array.from({ length: 7 }, (_, i) => addMonths(startOfMonth(new Date()), i));

  useEffect(() => {
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
          start = startOfWeek(selectedDate);
          end = endOfWeek(selectedDate);
        }

        const eventsRef = collection(db, 'earnings_calendar');
        const q = query(
          eventsRef,
          where('earningsDate', '>=', start),
          where('earningsDate', '<=', end)
        );

        const querySnapshot = await getDocs(q);
        const newEvents: Record<string, EarningsEvent[]> = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const event: EarningsEvent = {
            stockTicker: data.stockTicker,
            companyName: data.companyName,
            eventDate: new Date(data.earningsDate),
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
          const dateKey = format(new Date(data.earningsDate), 'yyyy-MM-dd');
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
  }, [selectedDate, viewMode, type]);

  const handleEventClick = (event: EarningsEvent, e: MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    setSelectedEvent(event);
  };

  const CompanyLogo = ({ event, size = "small" }: { event: EarningsEvent, size?: "small" | "large" }) => {
    const sizeClasses = size === "small" ? "w-6 h-6" : "w-8 h-8";
    
    return (
      <div 
        className={`${sizeClasses} rounded-full bg-primary cursor-pointer hover:opacity-80`}
        onClick={(e) => handleEventClick(event, e)}
      >
        {event.logoUrl ? (
          <img
            src={event.logoUrl}
            alt={event.companyName}
            className="w-full h-full rounded-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white">
            {event.stockTicker.slice(0, 2)}
          </div>
        )}
      </div>
    );
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
            {/* Earnings Time */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{selectedEvent.earningsType === 'BMO' ? 'Before Market Open' : 'After Market Close'}</span>
            </div>

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

            {/* Conference Call Link */}
            {selectedEvent.conferenceCallUrl && (
              <Button 
                className="w-full"
                onClick={() => window.open(selectedEvent.conferenceCallUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Earnings Call
              </Button>
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
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = events[dateKey] || [];
            const isHoveredWeek = hoveredDate && isSameWeek(day, hoveredDate);
            
            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-[100px] p-2 border rounded transition-colors duration-200",
                  isHoveredWeek && "bg-accent/50 cursor-pointer",
                  !dayEvents.length && "hover:bg-accent/25"
                )}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => {
                  if (isHoveredWeek) {
                    setSelectedDate(day);
                    setViewMode('week');
                  }
                }}
              >
                <div className="font-medium">{format(day, 'd')}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dayEvents.map((event: EarningsEvent, i: number) => (
                    <div
                      key={i}
                      className="relative group"
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation(); // Prevent triggering week view
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
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
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
            const dayEvents = events[dateKey] || [];

            return (
              <Card key={dateKey} className="p-4">
                <div className="text-center mb-4">
                  <div className="text-lg font-bold">{format(day, 'EEEE')}</div>
                  <div className="text-sm text-muted-foreground">{format(day, 'MMM d')}</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                  {dayEvents.length > 0 ? (
                    dayEvents.map((event: EarningsEvent, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <CompanyLogo event={event} size="large" />
                        <div className="text-sm">{event.stockTicker}</div>
                      </div>
                    ))
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