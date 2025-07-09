'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isPast } from 'date-fns';
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
}

interface ModernCalendarProps {
  type?: 'events' | 'earnings' | 'all';
}

export function ModernCalendar({ type = 'all' }: ModernCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const fetchingRef = useRef(false);

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
        
        // Choose collection based on type
        const collectionName = type === 'events' ? 'economic_events' : 'earnings_calendar';
        const eventsRef = collection(db, collectionName);
        const startDate = format(calendarStart, 'yyyy-MM-dd');
        const endDate = format(calendarEnd, 'yyyy-MM-dd');
        
        // Create sample events for immediate testing
        const newEvents: Record<string, CalendarEvent[]> = {};
        
        // Add sample events for the current month
        const today = new Date();
        
        // Comprehensive Market Watch Economic Data - spread throughout the month
        const sampleEvents = [
          // EMPLOYMENT DATA
          {
            id: 'sample-1',
            date: `${currentMonthKey}-01`,
            ticker: 'JOBS',
            company_name: 'Non-Farm Payrolls',
            event_type: 'Employment Data',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-2',
            date: `${currentMonthKey}-01`,
            ticker: 'UNEMP',
            company_name: 'Unemployment Rate',
            event_type: 'Employment Data',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-3',
            date: `${currentMonthKey}-08`,
            ticker: 'CLAIMS',
            company_name: 'Initial Jobless Claims',
            event_type: 'Employment Data',
            confirmed: true,
            auto_generated: true
          },
          // INFLATION DATA
          {
            id: 'sample-4',
            date: `${currentMonthKey}-12`,
            ticker: 'CPI',
            company_name: 'Consumer Price Index',
            event_type: 'Inflation Data',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-5',
            date: `${currentMonthKey}-14`,
            ticker: 'PPI',
            company_name: 'Producer Price Index',
            event_type: 'Inflation Data',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-6',
            date: `${currentMonthKey}-29`,
            ticker: 'PCE',
            company_name: 'Personal Consumption Expenditures',
            event_type: 'Inflation Data',
            confirmed: true,
            auto_generated: true
          },
          // CONSUMER/RETAIL DATA
          {
            id: 'sample-7',
            date: `${currentMonthKey}-15`,
            ticker: 'RETAIL',
            company_name: 'Retail Sales',
            event_type: 'Consumer Data',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-8',
            date: `${currentMonthKey}-26`,
            ticker: 'CONF',
            company_name: 'Consumer Confidence',
            event_type: 'Consumer Data',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-9',
            date: `${currentMonthKey}-27`,
            ticker: 'MICH',
            company_name: 'Michigan Consumer Sentiment',
            event_type: 'Consumer Data',
            confirmed: true,
            auto_generated: true
          },
          // MANUFACTURING DATA
          {
            id: 'sample-10',
            date: `${currentMonthKey}-03`,
            ticker: 'ISM',
            company_name: 'ISM Manufacturing PMI',
            event_type: 'Manufacturing Data',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-11',
            date: `${currentMonthKey}-05`,
            ticker: 'ISPMI',
            company_name: 'ISM Services PMI',
            event_type: 'Manufacturing Data',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-12',
            date: `${currentMonthKey}-16`,
            ticker: 'IP',
            company_name: 'Industrial Production',
            event_type: 'Manufacturing Data',
            confirmed: true,
            auto_generated: true
          },
          // HOUSING DATA
          {
            id: 'sample-13',
            date: `${currentMonthKey}-19`,
            ticker: 'STARTS',
            company_name: 'Housing Starts',
            event_type: 'Housing Data',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-14',
            date: `${currentMonthKey}-21`,
            ticker: 'EXIST',
            company_name: 'Existing Home Sales',
            event_type: 'Housing Data',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-15',
            date: `${currentMonthKey}-24`,
            ticker: 'NEW',
            company_name: 'New Home Sales',
            event_type: 'Housing Data',
            confirmed: true,
            auto_generated: true
          },
          // GDP & TRADE DATA
          {
            id: 'sample-16',
            date: `${currentMonthKey}-30`,
            ticker: 'GDP',
            company_name: 'Gross Domestic Product',
            event_type: 'Economic Growth',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-17',
            date: `${currentMonthKey}-06`,
            ticker: 'TRADE',
            company_name: 'Trade Balance',
            event_type: 'Trade Data',
            confirmed: true,
            auto_generated: true
          },
          // FED EVENTS
          {
            id: 'sample-18',
            date: `${currentMonthKey}-20`,
            ticker: 'FOMC',
            company_name: 'Federal Reserve FOMC Meeting',
            event_type: 'Fed Meeting',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-19',
            date: `${currentMonthKey}-18`,
            ticker: 'BEIGE',
            company_name: 'Fed Beige Book Release',
            event_type: 'Fed Report',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-20',
            date: `${currentMonthKey}-10`,
            ticker: 'MINUTES',
            company_name: 'FOMC Meeting Minutes',
            event_type: 'Fed Report',
            confirmed: true,
            auto_generated: true
          },
          // MARKET STRUCTURE EVENTS
          {
            id: 'sample-21',
            date: `${currentMonthKey}-17`,
            ticker: 'VIX',
            company_name: 'VIX Options Expiration',
            event_type: 'Options Expiration',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-22',
            date: `${currentMonthKey}-22`,
            ticker: 'WITCHING',
            company_name: 'Triple Witching Day',
            event_type: 'Options & Futures Expiration',
            confirmed: true,
            auto_generated: true
          },
          {
            id: 'sample-23',
            date: `${currentMonthKey}-28`,
            ticker: 'MARKET',
            company_name: 'Market Holiday',
            event_type: 'Market Closed',
            confirmed: true,
            auto_generated: true
          },
          // EARNINGS EVENTS (Major Tech & Blue Chips - Q4 2024 Results)
          // JANUARY 2025 - Q4 2024 Earnings Season
          {
            id: 'earnings-1', 
            date: '2025-01-14',
            ticker: 'JPM',
            company_name: 'JPMorgan Chase & Co.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-2',
            date: '2025-01-15',
            ticker: 'C',
            company_name: 'Citigroup Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-3',
            date: '2025-01-16',
            ticker: 'BAC',
            company_name: 'Bank of America Corp.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-4',
            date: '2025-01-17',
            ticker: 'WFC',
            company_name: 'Wells Fargo & Company',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-5',
            date: '2025-01-21',
            ticker: 'NFLX',
            company_name: 'Netflix Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-6',
            date: '2025-01-22',
            ticker: 'JNJ',
            company_name: 'Johnson & Johnson',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-7',
            date: '2025-01-28',
            ticker: 'AAPL',
            company_name: 'Apple Inc.',
            event_type: 'Earnings Call',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-8',
            date: '2025-01-29',
            ticker: 'MSFT',
            company_name: 'Microsoft Corporation',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-9',
            date: '2025-01-30',
            ticker: 'TSLA',
            company_name: 'Tesla Inc.',
            event_type: 'Earnings Call',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-10',
            date: '2025-01-31',
            ticker: 'META',
            company_name: 'Meta Platforms Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          // FEBRUARY 2025 - Continued Q4 2024 Earnings
          {
            id: 'earnings-11',
            date: '2025-02-03',
            ticker: 'GOOGL',
            company_name: 'Alphabet Inc.',
            event_type: 'Earnings Call',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-12',
            date: '2025-02-04',
            ticker: 'AMZN',
            company_name: 'Amazon.com Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-13',
            date: '2025-02-05',
            ticker: 'NVDA',
            company_name: 'NVIDIA Corporation',
            event_type: 'Earnings Call',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-14',
            date: '2025-02-06',
            ticker: 'V',
            company_name: 'Visa Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-15',
            date: '2025-02-11',
            ticker: 'PFE',
            company_name: 'Pfizer Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-16',
            date: '2025-02-12',
            ticker: 'KO',
            company_name: 'The Coca-Cola Company',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-17',
            date: '2025-02-13',
            ticker: 'DIS',
            company_name: 'The Walt Disney Company',
            event_type: 'Earnings Call',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-18',
            date: '2025-02-18',
            ticker: 'WMT',
            company_name: 'Walmart Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-19',
            date: '2025-02-19',
            ticker: 'HD',
            company_name: 'The Home Depot Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-20',
            date: '2025-02-25',
            ticker: 'PYPL',
            company_name: 'PayPal Holdings Inc.',
            event_type: 'Earnings Call',
            confirmed: true,
            auto_generated: false
          },
          // MARCH 2025 - Late Q4 2024 & Early Q1 2025 Guidance
          {
            id: 'earnings-21',
            date: '2025-03-04',
            ticker: 'CRM',
            company_name: 'Salesforce Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-22',
            date: '2025-03-06',
            ticker: 'ORCL',
            company_name: 'Oracle Corporation',
            event_type: 'Earnings Call',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-23',
            date: '2025-03-11',
            ticker: 'ADBE',
            company_name: 'Adobe Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-24',
            date: '2025-03-13',
            ticker: 'INTC',
            company_name: 'Intel Corporation',
            event_type: 'Earnings Call',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-25',
            date: '2025-03-18',
            ticker: 'BA',
            company_name: 'The Boeing Company',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-26',
            date: '2025-03-20',
            ticker: 'NKE',
            company_name: 'Nike Inc.',
            event_type: 'Earnings Call',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-27',
            date: '2025-03-25',
            ticker: 'AMD',
            company_name: 'Advanced Micro Devices Inc.',
            event_type: 'Earnings Report',
            confirmed: true,
            auto_generated: false
          },
          {
            id: 'earnings-28',
            date: '2025-03-27',
            ticker: 'SBUX',
            company_name: 'Starbucks Corporation',
            event_type: 'Earnings Call',
            confirmed: true,
            auto_generated: false
          }
        ];

        // Filter events based on type prop
        const filteredSampleEvents = sampleEvents.filter(event => {
          if (type === 'earnings') {
            // Only show earnings events (event_type contains 'Earnings')
            return event.event_type.toLowerCase().includes('earnings');
          } else if (type === 'events') {
            // Show everything EXCEPT earnings events
            return !event.event_type.toLowerCase().includes('earnings');
          }
          // type === 'all' - show everything
          return true;
        });
        
        // Add sample events to the calendar
        filteredSampleEvents.forEach(event => {
          if (!newEvents[event.date]) {
            newEvents[event.date] = [];
          }
          newEvents[event.date].push(event);
        });

        try {
          // Try to fetch real events with simple query (no complex indexes)
          const simpleQuery = query(
            eventsRef,
            limit(50) // Simple query without complex where clauses
          );
          
          const snapshot = await getDocs(simpleQuery);
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            let dateString: string;
            
            if (type === 'earnings') {
              // Handle earnings events from earnings_calendar collection
              if (data.earningsDate) {
                const earningsDate = data.earningsDate;
                if (earningsDate instanceof Date) {
                  dateString = format(earningsDate, 'yyyy-MM-dd');
                } else if (typeof earningsDate === 'string') {
                  dateString = earningsDate.split('T')[0];
                } else if (earningsDate?.toDate) {
                  dateString = format(earningsDate.toDate(), 'yyyy-MM-dd');
                } else {
                  return;
                }
                
                // Only include events in current view range
                if (dateString >= startDate && dateString <= endDate) {
                  const event: CalendarEvent = {
                    id: doc.id,
                    date: dateString,
                    ticker: data.stockTicker || 'EARN',
                    company_name: data.companyName || 'Company Earnings',
                    event_type: data.earningsType || 'Earnings',
                    confirmed: data.isConfirmed !== false,
                    auto_generated: false,
                    created_at: data.created_at || data.createdAt
                  };
                  
                  if (!newEvents[dateString]) {
                    newEvents[dateString] = [];
                  }
                  newEvents[dateString].push(event);
                }
              }
            } else {
              // Handle economic events from economic_events collection
              if (data.date && typeof data.date === 'string') {
                const dateString = data.date;
                if (dateString >= startDate && dateString <= endDate) {
                  const event: CalendarEvent = {
                    id: doc.id,
                    date: dateString,
                    ticker: data.ticker || 'ECO',
                    company_name: data.company_name || 'Economic Data',
                    event_type: data.event_type || 'Economic Event',
                    confirmed: data.confirmed !== false,
                    auto_generated: data.auto_generated || false,
                    created_at: data.created_at
                  };
                  
                  if (!newEvents[dateString]) {
                    newEvents[dateString] = [];
                  }
                  newEvents[dateString].push(event);
                }
              }
            }
          });
        } catch (queryError) {
          console.log('📅 Using sample events only (Firebase queries need indexes):', queryError);
        }

        setEvents(newEvents);
        console.log('📅 Calendar events loaded:', Object.keys(newEvents).length, 'days with events');
      } catch (error) {
        console.error('Error fetching events:', error);
        // Still show sample events even if Firebase fails
        const newEvents: Record<string, CalendarEvent[]> = {};
        
        const fallbackEvents = [
          {
            id: 'fallback-1',
            date: format(new Date(), 'yyyy-MM-dd'),
            ticker: 'SAMPLE',
            company_name: 'Sample Event',
            event_type: 'Demo Event',
            confirmed: true,
            auto_generated: false
          }
        ];
        
        // Apply filtering to fallback events too
        const filteredFallbackEvents = fallbackEvents.filter(event => {
          if (type === 'earnings') {
            return event.event_type.toLowerCase().includes('earnings');
          } else if (type === 'events') {
            return !event.event_type.toLowerCase().includes('earnings');
          }
          return true;
        });
        
        filteredFallbackEvents.forEach(event => {
          if (!newEvents[event.date]) {
            newEvents[event.date] = [];
          }
          newEvents[event.date].push(event);
        });
        
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

  const getEventIcon = (ticker: string, eventType: string) => {
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

  const renderDayDetailDialog = () => {
    if (!selectedDate) return null;

    return (
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] p-4 sm:p-6">
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

          <ScrollArea className="max-h-[60vh] sm:max-h-[500px] mt-3 sm:mt-4">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <h3 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">No events scheduled</h3>
                <p className="text-xs sm:text-sm">This day is clear of major market events.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {selectedDayEvents.map((event, index) => (
                  <Card key={`${event.date}-${index}`} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={cn(
                        "p-1.5 sm:p-2 rounded-lg flex items-center justify-center shrink-0",
                        getEventColor(event.ticker, event.event_type)
                      )}>
                        {getEventIcon(event.ticker, event.event_type)}
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

      {/* Calendar Grid */}
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
                <div
                  key={dateKey}
                  className={cn(
                    "relative min-h-[60px] sm:min-h-[80px] md:min-h-[120px] p-0.5 sm:p-1 md:p-2 border rounded-md sm:rounded-lg cursor-pointer transition-all duration-200 touch-manipulation",
                    "hover:bg-accent hover:shadow-sm",
                    !isCurrentMonth && "opacity-40 bg-muted/20",
                    isDayToday && "ring-1 sm:ring-2 ring-primary bg-primary/5",
                    isDayPast && "bg-muted/10"
                  )}
                  onClick={() => handleDateClick(day)}
                >
                  {/* Cross overlay for past dates */}
                  {isDayPast && dayEvents.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <X className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 text-muted-foreground/50 stroke-[1.5]" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "text-[10px] sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1 md:mb-2",
                    isDayToday && "text-primary font-bold",
                    isDayPast && "text-muted-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-0.5 sm:space-y-1">
                    {dayEvents.slice(0, 1).map((event, index) => (
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
                        "text-[8px] sm:text-xs text-muted-foreground px-0.5 sm:px-1 md:px-2 py-0.5 sm:py-1",
                        isDayPast && "opacity-60"
                      )}>
                        +{dayEvents.length - 1} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Legend - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg">Event Types</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-slate-100 text-slate-800">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Earnings</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-green-100 text-green-800">
                <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Economic Data</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-blue-100 text-blue-800">
                <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Fed Events</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-purple-100 text-purple-800">
                <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">Options Expiration</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-orange-100 text-orange-800">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm">VIX Events</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="p-0.5 sm:p-1 rounded bg-red-100 text-red-800">
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