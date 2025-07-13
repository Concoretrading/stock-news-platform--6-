'use client';

import React from "react";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, TrendingUp, Target, AlertTriangle, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addWeeks, addDays, isSameWeek, isWithinInterval } from 'date-fns';

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

  // Mobile Week View
  const renderMobileWeekView = () => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const weekEvents = events.filter(event => 
      isWithinInterval(new Date(event.eventDate), { start: weekStart, end: weekEnd })
    );

    return (
      <div className="space-y-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="font-semibold">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </div>
            <div className="text-xs text-muted-foreground">Week View</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const dayEvents = weekEvents.filter(event => 
              isSameDay(new Date(event.eventDate), day)
            );
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[60px] p-1 border rounded text-xs ${
                  isSameDay(day, new Date()) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedDay(day);
                  setMobileViewMode('day');
                }}
              >
                <div className="text-center font-medium mb-1">
                  {format(day, 'EEE')}
                </div>
                <div className="text-center text-muted-foreground mb-1">
                  {format(day, 'd')}
                </div>
                {dayEvents.length > 0 && (
                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {dayEvents.length}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Week Events Summary */}
        {weekEvents.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium text-sm">This Week's Events:</div>
            {weekEvents.slice(0, 5).map(event => (
              <div key={event.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span>{getEventIcon(event)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(event.eventDate), 'MMM d, h:mm a')} • {event.stockTicker}
                  </div>
                </div>
              </div>
            ))}
            {weekEvents.length > 5 && (
              <div className="text-xs text-muted-foreground text-center">
                +{weekEvents.length - 5} more events this week
              </div>
            )}
          </div>
        )}
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
    </div>
  );
} 
