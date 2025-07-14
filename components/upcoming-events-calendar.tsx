'use client';

import React from "react";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Calendar, TrendingUp, Target, AlertTriangle, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addWeeks, addDays, isSameWeek, isWithinInterval, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface UpcomingEvent {
  id: string;
  eventType: string;
  eventDate: string;
  title: string;
  description: string;
  stockTicker: string;
  confidence: number;
  source: string;
  category: string;
  impact: string;
  daysUntil: number;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function UpcomingEventsCalendar() {
  const { user, firebaseUser } = useAuth();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>('all');
  const [monthsAhead, setMonthsAhead] = useState<number>(6);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [currentView, setCurrentView] = useState<'calendar' | 'list'>('calendar');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  // Mobile-specific state
  const isMobile = useIsMobile();
  const [mobileViewMode, setMobileViewMode] = useState<'week' | 'day'>('week');
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [overflowModal, setOverflowModal] = useState<{ date: string; events: UpcomingEvent[]; dayTitle?: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchUpcomingEvents();
    }
  }, [user, selectedStock, monthsAhead, selectedEventType]);

  const fetchUpcomingEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await firebaseUser?.getIdToken();
      const params = new URLSearchParams({
        monthsAhead: monthsAhead.toString()
      });

      if (selectedStock !== 'all') {
        params.append('stockTicker', selectedStock);
      }

      if (selectedEventType !== 'all') {
        params.append('eventType', selectedEventType);
      }

      const response = await fetch(`/api/upcoming-events?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setError(`Failed to fetch events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventColor = (event: UpcomingEvent) => {
    switch (event.category) {
      case 'Earnings':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'Product Launch':
        return 'bg-green-600 hover:bg-green-700';
      case 'Conference':
        return 'bg-purple-600 hover:bg-purple-700';
      case 'Regulatory':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'AI Detected':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const getEventIcon = (event: UpcomingEvent) => {
    switch (event.category) {
      case 'Earnings':
        return '📊';
      case 'Product Launch':
        return '🚀';
      case 'Conference':
        return '🎤';
      case 'Regulatory':
        return '⚖️';
      case 'AI Detected':
        return '🤖';
      default:
        return '📅';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Mobile Week View - Matching Earnings Calendar Layout
  const renderMobileWeekView = () => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Monday to Friday

    return (
      <div>
        {/* Mobile-responsive header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <Button
            variant="ghost"
            onClick={() => setMobileViewMode('day')}
            className="flex items-center gap-2 w-fit"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Month
          </Button>
          <h2 className="text-lg sm:text-2xl font-bold text-center sm:text-right">
            Week of {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 4), 'MMM d, yyyy')}
          </h2>
        </div>
        
        {/* Mobile: Stack days vertically, Desktop: Grid layout */}
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-5 sm:gap-4">
          {weekDays
            .filter((day) => {
              // On mobile, filter out past dates (only show today and future)
              if (isMobile) {
                return !isBefore(startOfDay(day), startOfDay(new Date()));
              }
              // On desktop, show all days
              return true;
            })
            .map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = events.filter(event => 
              isSameDay(new Date(event.eventDate), day)
            );

            return (
              <Card 
                key={dateKey} 
                className={cn(
                  "relative cursor-pointer transition-colors duration-200 hover:bg-accent/50",
                  dayEvents.length > 0 && "border-primary/20",
                  // Mobile: horizontal layout, Desktop: vertical layout
                  "p-3 sm:p-4"
                )}
                onClick={() => {
                  // Show day details in a modal
                  setOverflowModal({ 
                    date: dateKey, 
                    events: dayEvents,
                    dayTitle: format(day, 'EEEE, MMMM d, yyyy')
                  });
                }}
              >
                {/* Event count badge */}
                {dayEvents.length > 0 && (
                  <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
                    {dayEvents.length}
                  </div>
                )}
                
                {/* Mobile Layout: Horizontal */}
                <div className="sm:hidden flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="text-lg font-bold">{format(day, 'EEEE')}</div>
                    <div className="text-sm text-muted-foreground">{format(day, 'MMM d')}</div>
                  </div>
                  <div className="flex-1">
                    {dayEvents.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {dayEvents.slice(0, 6).map((event, i) => (
                          <div key={i} className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
                            <span className={`text-xs ${getImpactColor(event.impact)}`}>{getEventIcon(event)}</span>
                            <div className="text-xs font-medium truncate max-w-[100px]">{event.title}</div>
                          </div>
                        ))}
                        {dayEvents.length > 6 && (
                          <div className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-1">
                            +{dayEvents.length - 6} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No Economic Events</div>
                    )}
                  </div>
                </div>

                {/* Desktop Layout: Vertical (original) */}
                <div className="hidden sm:block">
                  <div className="text-center mb-4">
                    <div className="text-lg font-bold">{format(day, 'EEEE')}</div>
                    <div className="text-sm text-muted-foreground">{format(day, 'MMM d')}</div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    {dayEvents.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1">
                        {dayEvents.slice(0, 4).map((event, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div className={`text-lg ${getImpactColor(event.impact)}`}>{getEventIcon(event)}</div>
                            <div className="text-xs text-center truncate w-16">{event.title}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No Events</div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Mobile Day View
  const renderMobileDayView = () => {
    const dayEvents = events.filter(event => 
      isSameDay(new Date(event.eventDate), selectedDay)
    );

    return (
      <div className="space-y-4">
        {/* Day Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDay(addDays(selectedDay, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="font-semibold">
              {format(selectedDay, 'EEEE, MMM d, yyyy')}
            </div>
            <div className="text-xs text-muted-foreground">Day View</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDay(addDays(selectedDay, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Events */}
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No events scheduled for this day.
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map(event => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">{getEventIcon(event)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{event.title}</h4>
                        <Badge variant="outline" className="text-xs">{event.stockTicker}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.eventDate), 'h:mm a')}
                        </div>
                        <div className={`flex items-center gap-1 ${getConfidenceColor(event.confidence)}`}>
                          <CheckCircle className="h-3 w-3" />
                          {Math.round(event.confidence * 100)}%
                        </div>
                        <div className={`flex items-center gap-1 ${getImpactColor(event.impact)}`}>
                          <AlertTriangle className="h-3 w-3" />
                          {event.impact}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const eventsForMonth = events.filter(event => 
      isSameMonth(new Date(event.eventDate), selectedMonth)
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
          >
            ← Previous
          </Button>
          <h3 className="text-lg font-semibold">
            {format(selectedMonth, 'MMMM yyyy')}
          </h3>
          <Button
            variant="outline"
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
          >
            Next →
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-sm">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {days.map(day => {
            const dayEvents = eventsForMonth.filter(event => 
              isSameDay(new Date(event.eventDate), day)
            );
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] p-1 border rounded ${
                  isSameMonth(day, new Date()) ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded text-white ${getEventColor(event)} cursor-pointer`}
                      title={`${event.title} (${event.stockTicker})`}
                    >
                      <div className="flex items-center gap-1">
                        <span>{getEventIcon(event)}</span>
                        <span className="truncate">{event.stockTicker}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );

    return (
      <div className="space-y-3">
        {sortedEvents.map(event => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getEventIcon(event)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      <Badge variant="outline">{event.stockTicker}</Badge>
                      <Badge className={getEventColor(event)}>
                        {event.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.eventDate), 'MMM d, yyyy h:mm a')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {event.daysUntil} days away
                      </div>
                      <div className={`flex items-center gap-1 ${getConfidenceColor(event.confidence)}`}>
                        <CheckCircle className="h-3 w-3" />
                        {Math.round(event.confidence * 100)}% confidence
                      </div>
                      <div className={`flex items-center gap-1 ${getImpactColor(event.impact)}`}>
                        <AlertTriangle className="h-3 w-3" />
                        {event.impact} impact
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Source: {event.source}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events Calendar</CardTitle>
          <CardDescription>Please log in to view upcoming events</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Upcoming Events Calendar
          </CardTitle>
          <CardDescription>
            Strategic view of upcoming catalysts and events for trading planning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile View Toggle */}
          {isMobile && (
            <div className="flex gap-2 mb-4">
              <Button
                variant={mobileViewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMobileViewMode('week')}
                className="flex-1"
              >
                Week
              </Button>
              <Button
                variant={mobileViewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMobileViewMode('day')}
                className="flex-1"
              >
                Day
              </Button>
            </div>
          )}

          {/* Filters - Hide on mobile when in week/day view */}
          {(!isMobile || currentView === 'list') && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Stock</label>
                <Select value={selectedStock} onValueChange={setSelectedStock}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stocks</SelectItem>
                    <SelectItem value="AAPL">Apple (AAPL)</SelectItem>
                    <SelectItem value="TSLA">Tesla (TSLA)</SelectItem>
                    <SelectItem value="NVDA">NVIDIA (NVDA)</SelectItem>
                    <SelectItem value="MSFT">Microsoft (MSFT)</SelectItem>
                    <SelectItem value="GOOGL">Alphabet (GOOGL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Months Ahead</label>
                <Select value={monthsAhead.toString()} onValueChange={(value) => setMonthsAhead(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="9">9 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Event Type</label>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="earnings">Earnings</SelectItem>
                    <SelectItem value="product_launch">Product Launches</SelectItem>
                    <SelectItem value="conference">Conferences</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="ai_detected">AI Detected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">View</label>
                <Select value={currentView} onValueChange={(value: 'calendar' | 'list') => setCurrentView(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calendar">Calendar</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming events found for the selected criteria.
            </div>
          ) : (
            <div>
              {/* Mobile View */}
              {isMobile && mobileViewMode === 'week' && renderMobileWeekView()}
              {isMobile && mobileViewMode === 'day' && renderMobileDayView()}
              
              {/* Desktop View */}
              {!isMobile && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {events.length} events in the next {monthsAhead} months
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">Earnings 📊</Badge>
                      <Badge variant="outline">Product Launch 🚀</Badge>
                      <Badge variant="outline">Conference 🎤</Badge>
                      <Badge variant="outline">Regulatory ⚖️</Badge>
                      <Badge variant="outline">AI Detected 🤖</Badge>
                    </div>
                  </div>
                  
                  {currentView === 'calendar' ? renderCalendarView() : renderListView()}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Overflow Modal */}
      {overflowModal && (
        <Dialog open={!!overflowModal} onOpenChange={() => setOverflowModal(null)}>
          <DialogContent className="max-w-6xl max-h-[95vh] w-[90vw]">
            <DialogHeader>
              <DialogTitle>
                {overflowModal.dayTitle ? overflowModal.dayTitle : `Economic Events for ${overflowModal.date}`}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {overflowModal.events.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 border rounded bg-card hover:shadow-md transition-shadow">
                    <div className={`text-xl ${getImpactColor(event.impact)}`}>
                      {getEventIcon(event)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{event.title}</div>
                      <div className="text-xs text-muted-foreground mb-1">{event.stockTicker}</div>
                      <div className="text-xs text-muted-foreground">{event.category}</div>
                      <div className="text-xs mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          getImpactColor(event.impact) === 'text-red-600' ? 'bg-red-100 text-red-700' :
                          getImpactColor(event.impact) === 'text-yellow-600' ? 'bg-yellow-100 text-yellow-700' :
                          getImpactColor(event.impact) === 'text-green-600' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {event.impact} impact
                        </span>
                      </div>
                      {event.description && (
                        <div className="text-xs text-muted-foreground mt-2 line-clamp-2">{event.description}</div>
                      )}
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
} 
