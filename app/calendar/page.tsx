"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  getDay
} from "date-fns";

const TABS = [
  { key: "events", label: "Events" },
  { key: "earnings", label: "Earnings" },
  { key: "alerts", label: "Alerts" },
];

// Comprehensive mock earnings data
const MOCK_EARNINGS = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-01-15T16:00:00Z",
    nextType: "After Close",
    popularity: 95,
    lastEarnings: {
      date: "2023-10-26",
      eps: 1.46,
      revenue: 89.5,
      surprise: "+0.08",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-01-17T16:00:00Z",
    nextType: "After Close",
    popularity: 92,
    lastEarnings: {
      date: "2023-10-18",
      eps: 0.66,
      revenue: 23.4,
      surprise: "-0.12",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-01-23T16:00:00Z",
    nextType: "After Close",
    popularity: 88,
    lastEarnings: {
      date: "2023-10-24",
      eps: 2.99,
      revenue: 56.5,
      surprise: "+0.15",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-01-25T16:00:00Z",
    nextType: "After Close",
    popularity: 85,
    lastEarnings: {
      date: "2023-10-24",
      eps: 1.55,
      revenue: 76.7,
      surprise: "+0.22",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-01-30T16:00:00Z",
    nextType: "After Close",
    popularity: 82,
    lastEarnings: {
      date: "2023-10-26",
      eps: 0.94,
      revenue: 143.1,
      surprise: "+0.18",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-02-05T16:00:00Z",
    nextType: "After Close",
    popularity: 90,
    lastEarnings: {
      date: "2023-11-21",
      eps: 4.02,
      revenue: 18.1,
      surprise: "+0.45",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "META",
    name: "Meta Platforms Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-02-07T16:00:00Z",
    nextType: "After Close",
    popularity: 78,
    lastEarnings: {
      date: "2023-10-25",
      eps: 4.39,
      revenue: 34.1,
      surprise: "+0.67",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "NFLX",
    name: "Netflix Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-02-12T16:00:00Z",
    nextType: "After Close",
    popularity: 75,
    lastEarnings: {
      date: "2023-10-18",
      eps: 3.73,
      revenue: 8.5,
      surprise: "+0.12",
    },
    conferenceCall: "https://example.com/conference-call",
  },
];

// Comprehensive economic events data
const MOCK_EVENTS = [
  // Market Holidays
  {
    id: "new-years-2024",
    title: "New Year's Day",
    type: "market-holiday",
    date: "2024-01-01T00:00:00Z",
    description: "Market Closed",
    impact: "high",
    category: "Holiday"
  },
  {
    id: "mlk-day-2024",
    title: "Martin Luther King Jr. Day",
    type: "market-holiday",
    date: "2024-01-15T00:00:00Z",
    description: "Market Closed",
    impact: "medium",
    category: "Holiday"
  },
  {
    id: "presidents-day-2024",
    title: "Presidents' Day",
    type: "market-holiday",
    date: "2024-02-19T00:00:00Z",
    description: "Market Closed",
    impact: "medium",
    category: "Holiday"
  },
  {
    id: "good-friday-2024",
    title: "Good Friday",
    type: "market-holiday",
    date: "2024-03-29T00:00:00Z",
    description: "Market Closed",
    impact: "medium",
    category: "Holiday"
  },
  {
    id: "memorial-day-2024",
    title: "Memorial Day",
    type: "market-holiday",
    date: "2024-05-27T00:00:00Z",
    description: "Market Closed",
    impact: "medium",
    category: "Holiday"
  },
  {
    id: "independence-day-2024",
    title: "Independence Day",
    type: "market-holiday",
    date: "2024-07-04T00:00:00Z",
    description: "Market Closed",
    impact: "medium",
    category: "Holiday"
  },
  {
    id: "labor-day-2024",
    title: "Labor Day",
    type: "market-holiday",
    date: "2024-09-02T00:00:00Z",
    description: "Market Closed",
    impact: "medium",
    category: "Holiday"
  },
  {
    id: "thanksgiving-2024",
    title: "Thanksgiving Day",
    type: "market-holiday",
    date: "2024-11-28T00:00:00Z",
    description: "Market Closed",
    impact: "medium",
    category: "Holiday"
  },
  {
    id: "christmas-2024",
    title: "Christmas Day",
    type: "market-holiday",
    date: "2024-12-25T00:00:00Z",
    description: "Market Closed",
    impact: "high",
    category: "Holiday"
  },
  
  // Quad Witching
  {
    id: "quad-witching-mar-2024",
    title: "Quad Witching",
    type: "trading-event",
    date: "2024-03-15T16:00:00Z",
    description: "Stock options, stock futures, index options, and index futures all expire",
    impact: "high",
    category: "Trading Event"
  },
  {
    id: "quad-witching-jun-2024",
    title: "Quad Witching",
    type: "trading-event",
    date: "2024-06-21T16:00:00Z",
    description: "Stock options, stock futures, index options, and index futures all expire",
    impact: "high",
    category: "Trading Event"
  },
  {
    id: "quad-witching-sep-2024",
    title: "Quad Witching",
    type: "trading-event",
    date: "2024-09-20T16:00:00Z",
    description: "Stock options, stock futures, index options, and index futures all expire",
    impact: "high",
    category: "Trading Event"
  },
  {
    id: "quad-witching-dec-2024",
    title: "Quad Witching",
    type: "trading-event",
    date: "2024-12-20T16:00:00Z",
    description: "Stock options, stock futures, index options, and index futures all expire",
    impact: "high",
    category: "Trading Event"
  },
  
  // Triple Witching
  {
    id: "triple-witching-jan-2024",
    title: "Triple Witching",
    type: "trading-event",
    date: "2024-01-19T16:00:00Z",
    description: "Stock options, index options, and index futures expire",
    impact: "medium",
    category: "Trading Event"
  },
  {
    id: "triple-witching-feb-2024",
    title: "Triple Witching",
    type: "trading-event",
    date: "2024-02-16T16:00:00Z",
    description: "Stock options, index options, and index futures expire",
    impact: "medium",
    category: "Trading Event"
  },
  {
    id: "triple-witching-apr-2024",
    title: "Triple Witching",
    type: "trading-event",
    date: "2024-04-19T16:00:00Z",
    description: "Stock options, index options, and index futures expire",
    impact: "medium",
    category: "Trading Event"
  },
  {
    id: "triple-witching-may-2024",
    title: "Triple Witching",
    type: "trading-event",
    date: "2024-05-17T16:00:00Z",
    description: "Stock options, index options, and index futures expire",
    impact: "medium",
    category: "Trading Event"
  },
  {
    id: "triple-witching-jul-2024",
    title: "Triple Witching",
    type: "trading-event",
    date: "2024-07-19T16:00:00Z",
    description: "Stock options, index options, and index futures expire",
    impact: "medium",
    category: "Trading Event"
  },
  {
    id: "triple-witching-aug-2024",
    title: "Triple Witching",
    type: "trading-event",
    date: "2024-08-16T16:00:00Z",
    description: "Stock options, index options, and index futures expire",
    impact: "medium",
    category: "Trading Event"
  },
  {
    id: "triple-witching-oct-2024",
    title: "Triple Witching",
    type: "trading-event",
    date: "2024-10-18T16:00:00Z",
    description: "Stock options, index options, and index futures expire",
    impact: "medium",
    category: "Trading Event"
  },
  {
    id: "triple-witching-nov-2024",
    title: "Triple Witching",
    type: "trading-event",
    date: "2024-11-15T16:00:00Z",
    description: "Stock options, index options, and index futures expire",
    impact: "medium",
    category: "Trading Event"
  },
  
  // Month-End Rebalancing
  {
    id: "month-end-jan-2024",
    title: "Month-End Rebalancing",
    type: "trading-event",
    date: "2024-01-31T16:00:00Z",
    description: "Portfolio rebalancing and window dressing",
    impact: "medium",
    category: "Trading Event"
  },
  {
    id: "month-end-feb-2024",
    title: "Month-End Rebalancing",
    type: "trading-event",
    date: "2024-02-29T16:00:00Z",
    description: "Portfolio rebalancing and window dressing",
    impact: "medium",
    category: "Trading Event"
  },
  {
    id: "month-end-mar-2024",
    title: "Month-End Rebalancing",
    type: "trading-event",
    date: "2024-03-29T16:00:00Z",
    description: "Portfolio rebalancing and window dressing",
    impact: "medium",
    category: "Trading Event"
  },
  
  // Quarter-End Rebalancing
  {
    id: "quarter-end-mar-2024",
    title: "Quarter-End Rebalancing",
    type: "trading-event",
    date: "2024-03-29T16:00:00Z",
    description: "Major portfolio rebalancing and institutional flows",
    impact: "high",
    category: "Trading Event"
  },
  {
    id: "quarter-end-jun-2024",
    title: "Quarter-End Rebalancing",
    type: "trading-event",
    date: "2024-06-28T16:00:00Z",
    description: "Major portfolio rebalancing and institutional flows",
    impact: "high",
    category: "Trading Event"
  },
  {
    id: "quarter-end-sep-2024",
    title: "Quarter-End Rebalancing",
    type: "trading-event",
    date: "2024-09-30T16:00:00Z",
    description: "Major portfolio rebalancing and institutional flows",
    impact: "high",
    category: "Trading Event"
  },
  {
    id: "quarter-end-dec-2024",
    title: "Quarter-End Rebalancing",
    type: "trading-event",
    date: "2024-12-31T16:00:00Z",
    description: "Major portfolio rebalancing and institutional flows",
    impact: "high",
    category: "Trading Event"
  },
  
  // Tax-Related Days
  {
    id: "tax-loss-harvesting-2024",
    title: "Tax Loss Harvesting",
    type: "trading-event",
    date: "2024-12-27T16:00:00Z",
    description: "Last trading day for tax loss harvesting",
    impact: "medium",
    category: "Trading Event"
  },
  
  // Economic Data
  {
    id: "cpi-jan-2024",
    title: "CPI Report",
    type: "economic-data",
    date: "2024-01-11T08:30:00Z",
    description: "Consumer Price Index - Inflation data",
    impact: "high",
    category: "Economic Data"
  },
  {
    id: "fomc-jan-2024",
    title: "FOMC Meeting",
    type: "economic-data",
    date: "2024-01-31T14:00:00Z",
    description: "Federal Reserve interest rate decision",
    impact: "high",
    category: "Economic Data"
  },
  {
    id: "jobs-report-feb-2024",
    title: "Jobs Report",
    type: "economic-data",
    date: "2024-02-02T08:30:00Z",
    description: "Non-farm payrolls and unemployment data",
    impact: "high",
    category: "Economic Data"
  },
  {
    id: "gdp-q4-2023",
    title: "GDP Report",
    type: "economic-data",
    date: "2024-01-25T08:30:00Z",
    description: "Q4 2023 GDP growth rate",
    impact: "high",
    category: "Economic Data"
  }
];

export default function CalendarPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("events");
  const [zoomedMonth, setZoomedMonth] = useState<Date | null>(null);
  const [zoomedWeek, setZoomedWeek] = useState<{ start: Date; end: Date } | null>(null);
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Only show the real calendar to the admin
  const isAdmin = user?.email === "handrigannick@gmail.com";

  // Helper: Get week key for a date
  function getWeekKey(date: Date) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    return format(weekStart, 'yyyy-MM-dd');
  }

  // Helper: Get stocks for a specific week
  function getStocksForWeek(weekStart: Date, weekEnd: Date) {
    return MOCK_EARNINGS.filter(stock => {
      const earningsDate = new Date(stock.nextEarnings);
      return earningsDate >= weekStart && earningsDate <= weekEnd;
    });
  }

  // Helper: Render the grid of months
  function renderMonthGrid() {
    const now = new Date();
    const months = Array.from({ length: 7 }, (_, i) => startOfMonth(addMonths(now, i)));
    const label = tab === "earnings" ? "EARNINGS" : tab === "events" ? "EVENTS" : "ALERTS";
    
    return (
      <div className="grid grid-cols-3 gap-6">
        {months.map((month, idx) => (
          <button
            key={idx}
            className="bg-blue-950/60 rounded-xl border border-blue-700/30 p-6 flex flex-col items-center hover:bg-blue-900/80 transition"
            onClick={() => setZoomedMonth(month)}
          >
            <div className="text-blue-300 font-bold text-lg mb-2">{format(month, "MMMM yyyy")}</div>
            <div className="text-xs text-blue-400 mb-2 tracking-widest">{label}</div>
            <span className="text-blue-200">Click to zoom in</span>
          </button>
        ))}
      </div>
    );
  }

  // Helper: Get stocks for a specific date
  function getStocksForDate(date: Date) {
    return MOCK_EARNINGS.filter(stock => {
      const earningsDate = new Date(stock.nextEarnings);
      return isSameDay(earningsDate, date);
    });
  }

  // Helper: Get stocks for a specific month
  function getStocksForMonth(month: Date) {
    return MOCK_EARNINGS.filter(stock => {
      const earningsDate = new Date(stock.nextEarnings);
      return isSameMonth(earningsDate, month);
    }).sort((a, b) => b.popularity - a.popularity);
  }

  // Helper: Find the week containing a specific stock
  function findWeekForStock(stock: any) {
    const earningsDate = new Date(stock.nextEarnings);
    const weekStart = startOfWeek(earningsDate, { weekStartsOn: 1 }); // Monday
    return { start: weekStart, end: endOfWeek(earningsDate, { weekStartsOn: 1 }) };
  }

  // Helper: Get events for a specific date
  function getEventsForDate(date: Date) {
    return MOCK_EVENTS.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  }

  // Helper: Get events for a specific month
  function getEventsForMonth(month: Date) {
    return MOCK_EVENTS.filter(event => {
      const eventDate = new Date(event.date);
      return isSameMonth(eventDate, month);
    }).sort((a, b) => {
      // Sort by impact (high first), then by date
      if (a.impact === 'high' && b.impact !== 'high') return -1;
      if (b.impact === 'high' && a.impact !== 'high') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  // Helper: Get events for a specific week
  function getEventsForWeek(weekStart: Date, weekEnd: Date) {
    return MOCK_EVENTS.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  }

  // Helper: Get event color based on type and impact
  function getEventColor(event: any) {
    if (event.type === 'market-holiday') return 'bg-red-600/80';
    if (event.type === 'economic-data') return 'bg-yellow-600/80';
    if (event.impact === 'high') return 'bg-orange-600/80';
    return 'bg-blue-600/80';
  }

  // Helper: Get event icon based on type
  function getEventIcon(event: any) {
    if (event.type === 'market-holiday') return '🏛️';
    if (event.type === 'economic-data') return '📊';
    if (event.category === 'Trading Event') return '⚡';
    return '📅';
  }

  // Helper: Render the detailed week view
  function renderWeekView(weekStart: Date, weekEnd: Date) {
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekStocks = getStocksForWeek(weekStart, weekEnd);
    const weekEvents = getEventsForWeek(weekStart, weekEnd);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button className="text-blue-400 hover:underline" onClick={() => setZoomedWeek(null)}>
            ← Back to Month
          </button>
          <div className="flex items-center gap-4">
            <button 
              className="text-blue-400 hover:text-blue-300 text-xl font-bold transition"
              onClick={() => {
                const prevWeekStart = addDays(weekStart, -7);
                const prevWeekEnd = addDays(weekEnd, -7);
                setZoomedWeek({ start: prevWeekStart, end: prevWeekEnd });
              }}
            >
              ‹
            </button>
            <div className="text-2xl font-bold text-blue-200">
              Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </div>
            <button 
              className="text-blue-400 hover:text-blue-300 text-xl font-bold transition"
              onClick={() => {
                const nextWeekStart = addDays(weekStart, 7);
                const nextWeekEnd = addDays(weekEnd, 7);
                setZoomedWeek({ start: nextWeekStart, end: nextWeekEnd });
              }}
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {weekDays.slice(0, 5).map((day, index) => {
            const dayStocks = getStocksForDate(day);
            const dayEvents = getEventsForDate(day);
            const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][index];
            
            return (
              <div key={index} className={`rounded-xl border p-4 ${
                tab === "events" 
                  ? "bg-gray-900/60 border-gray-600/30" 
                  : "bg-blue-950/60 border-blue-700/30"
              }`}>
                <div className="text-center mb-4">
                  <div className={`font-bold text-lg ${
                    tab === "events" ? "text-gray-300" : "text-blue-300"
                  }`}>{dayName}</div>
                  <div className={`text-sm ${
                    tab === "events" ? "text-gray-400" : "text-blue-400"
                  }`}>{format(day, "MMM d")}</div>
                </div>
                
                {tab === "earnings" && dayStocks.length > 0 ? (
                  <div className="space-y-3">
                    {dayStocks.map((stock) => (
                      <Dialog key={stock.ticker} open={modalOpen && selectedStock?.ticker === stock.ticker} onOpenChange={setModalOpen}>
                        <DialogTrigger asChild>
                          <button
                            className="w-full bg-blue-800/60 hover:bg-blue-700/80 rounded-lg p-3 transition flex flex-col items-center"
                            onClick={() => setSelectedStock(stock)}
                          >
                            <img src={stock.logo} alt={stock.ticker} className="w-12 h-12 rounded mb-2" />
                            <div className="text-white font-bold text-lg">{stock.ticker}</div>
                            <div className="text-blue-300 text-xs">{stock.name}</div>
                            <div className="text-green-400 text-xs font-medium mt-1">
                              {stock.nextType}
                            </div>
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <img src={stock.logo} alt={stock.ticker} className="w-8 h-8 rounded" />
                              {stock.name} ({stock.ticker})
                            </DialogTitle>
                            <DialogDescription>
                              <div className="mt-2 text-blue-700 font-medium">
                                Next Earnings: {stock.nextType} <br />
                                {new Date(stock.nextEarnings).toLocaleString()}
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            <div className="font-semibold mb-1">Last Earnings</div>
                            <div className="text-sm text-muted-foreground">
                              Date: {stock.lastEarnings.date}<br />
                              EPS: <span className="font-mono">{stock.lastEarnings.eps}</span> <br />
                              Revenue: <span className="font-mono">${stock.lastEarnings.revenue}M</span> <br />
                              Surprise: <span className="font-mono">{stock.lastEarnings.surprise}</span>
                            </div>
                          </div>
                          <DialogFooter className="mt-6">
                            <a
                              href={stock.conferenceCall}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition"
                            >
                              Listen to Conference Call
                            </a>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                ) : tab === "events" && dayEvents.length > 0 ? (
                  <div className="space-y-3">
                    {dayEvents.map((event) => (
                      <Dialog key={event.id} open={modalOpen && selectedStock?.id === event.id} onOpenChange={setModalOpen}>
                        <DialogTrigger asChild>
                          <button
                            className={`w-full ${getEventColor(event)} hover:opacity-80 rounded-lg p-3 transition flex flex-col items-center`}
                            onClick={() => setSelectedStock(event)}
                          >
                            <div className="text-3xl mb-2">{getEventIcon(event)}</div>
                            <div className="text-white font-bold text-sm text-center">{event.title}</div>
                            <div className="text-blue-200 text-xs mt-1">
                              {event.description}
                            </div>
                            <div className="text-yellow-400 text-xs font-medium capitalize mt-1">
                              {event.impact} impact
                            </div>
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <span className="text-2xl">{getEventIcon(event)}</span>
                              {event.title}
                            </DialogTitle>
                            <DialogDescription>
                              <div className="mt-2 text-blue-700 font-medium">
                                {event.description} <br />
                                {new Date(event.date).toLocaleString()}
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            <div className="font-semibold mb-1">Event Details</div>
                            <div className="text-sm text-muted-foreground">
                              Category: {event.category}<br />
                              Impact: <span className="font-mono capitalize">{event.impact}</span> <br />
                              Type: <span className="font-mono capitalize">{event.type.replace('-', ' ')}</span>
                            </div>
                          </div>
                          <DialogFooter className="mt-6">
                            <div className="text-xs text-muted-foreground">
                              Market impact may vary based on current conditions
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                ) : (
                  <div className={`rounded-lg p-4 flex flex-col items-center ${
                    tab === "events" 
                      ? "bg-gray-950/60 text-gray-300" 
                      : "bg-blue-950/60 text-blue-300"
                  }`}>
                    <span className="text-2xl mb-2">
                      {tab === "earnings" ? "📅" : "📊"}
                    </span>
                    <span className="text-sm">
                      {tab === "earnings" ? "No Earnings" : "No Events"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Helper: Render the full calendar view for a month
  function renderMonthCalendar(month: Date) {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // Sunday
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const monthStocks = getStocksForMonth(month);
    const monthEvents = getEventsForMonth(month);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button className="text-blue-400 hover:underline" onClick={() => setZoomedMonth(null)}>
            ← Back to Months
          </button>
          <div className="flex items-center gap-4">
            <button 
              className="text-blue-400 hover:text-blue-300 text-2xl font-bold transition"
              onClick={() => setZoomedMonth(addMonths(month, -1))}
            >
              ‹
            </button>
            <div className="text-2xl font-bold text-blue-200">{format(month, "MMMM yyyy")}</div>
            <button 
              className="text-blue-400 hover:text-blue-300 text-2xl font-bold transition"
              onClick={() => setZoomedMonth(addMonths(month, 1))}
            >
              ›
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={`rounded-xl border p-6 mb-8 ${
          tab === "events" 
            ? "bg-gray-900/60 border-gray-600/30" 
            : "bg-blue-950/60 border-blue-700/30"
        }`}>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
              <div key={day} className={`text-center font-semibold text-sm py-2 ${
                tab === "events" ? "text-gray-300" : "text-blue-300"
              }`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, month);
              const stocksForDay = getStocksForDate(day);
              const eventsForDay = getEventsForDate(day);
              const weekStart = startOfWeek(day, { weekStartsOn: 1 });
              const weekKey = getWeekKey(day);
              const isHovered = hoveredWeek === weekKey;
              
              return (
                <div
                  key={index}
                  data-week-start={format(weekStart, 'yyyy-MM-dd')}
                  className={`min-h-[120px] p-2 rounded-lg border transition cursor-pointer ${
                    isCurrentMonth 
                      ? isHovered 
                        ? tab === "events"
                          ? "bg-gray-800/60 border-gray-500/50 ring-2 ring-blue-400/30"
                          : "bg-blue-800/60 border-blue-500/50 ring-2 ring-blue-400/30"
                        : tab === "events"
                          ? "bg-gray-800/40 border-gray-600/30"
                          : "bg-blue-900/40 border-blue-600/30"
                      : tab === "events"
                        ? "bg-gray-950/20 border-gray-800/20"
                        : "bg-blue-950/20 border-blue-800/20"
                  }`}
                  onMouseEnter={() => setHoveredWeek(weekKey)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  onClick={() => setZoomedWeek({ start: weekStart, end: endOfWeek(day, { weekStartsOn: 1 }) })}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentMonth 
                      ? tab === "events" ? "text-gray-200" : "text-blue-200"
                      : tab === "events" ? "text-gray-500" : "text-blue-500"
                  }`}>
                    {format(day, "d")}
                  </div>
                  
                  {isCurrentMonth && tab === "earnings" && stocksForDay.length > 0 && (
                    <div className="space-y-1">
                      {stocksForDay.map((stock) => (
                        <Dialog key={stock.ticker} open={modalOpen && selectedStock?.ticker === stock.ticker} onOpenChange={setModalOpen}>
                          <DialogTrigger asChild>
                            <button
                              className="w-full bg-blue-700/60 hover:bg-blue-600/80 rounded px-2 py-1 text-xs text-white font-medium transition flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStock(stock);
                              }}
                            >
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              {stock.ticker}
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <img src={stock.logo} alt={stock.ticker} className="w-8 h-8 rounded" />
                                {stock.name} ({stock.ticker})
                              </DialogTitle>
                              <DialogDescription>
                                <div className="mt-2 text-blue-700 font-medium">
                                  Next Earnings: {stock.nextType} <br />
                                  {new Date(stock.nextEarnings).toLocaleString()}
                                </div>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              <div className="font-semibold mb-1">Last Earnings</div>
                              <div className="text-sm text-muted-foreground">
                                Date: {stock.lastEarnings.date}<br />
                                EPS: <span className="font-mono">{stock.lastEarnings.eps}</span> <br />
                                Revenue: <span className="font-mono">${stock.lastEarnings.revenue}M</span> <br />
                                Surprise: <span className="font-mono">{stock.lastEarnings.surprise}</span>
                              </div>
                            </div>
                            <DialogFooter className="mt-6">
                              <a
                                href={stock.conferenceCall}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition"
                              >
                                Listen to Conference Call
                              </a>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  )}
                  
                  {isCurrentMonth && tab === "events" && eventsForDay.length > 0 && (
                    <div className="space-y-1">
                      {eventsForDay.map((event) => (
                        <Dialog key={event.id} open={modalOpen && selectedStock?.id === event.id} onOpenChange={setModalOpen}>
                          <DialogTrigger asChild>
                            <button
                              className={`w-full ${getEventColor(event)} hover:opacity-80 rounded px-2 py-1 text-xs text-white font-medium transition flex items-center gap-1`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStock(event);
                              }}
                            >
                              <span className="text-sm">{getEventIcon(event)}</span>
                              {event.title}
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <span className="text-2xl">{getEventIcon(event)}</span>
                                {event.title}
                              </DialogTitle>
                              <DialogDescription>
                                <div className="mt-2 text-blue-700 font-medium">
                                  {event.description} <br />
                                  {new Date(event.date).toLocaleString()}
                                </div>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              <div className="font-semibold mb-1">Event Details</div>
                              <div className="text-sm text-muted-foreground">
                                Category: {event.category}<br />
                                Impact: <span className="font-mono capitalize">{event.impact}</span> <br />
                                Type: <span className="font-mono capitalize">{event.type.replace('-', ' ')}</span>
                              </div>
                            </div>
                            <DialogFooter className="mt-6">
                              <div className="text-xs text-muted-foreground">
                                Market impact may vary based on current conditions
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Items List */}
        <div className={`rounded-xl border p-6 ${
          tab === "events" 
            ? "bg-gray-900/60 border-gray-600/30" 
            : "bg-blue-950/60 border-blue-700/30"
        }`}>
          <h3 className={`text-lg font-bold mb-4 ${
            tab === "events" ? "text-gray-200" : "text-blue-200"
          }`}>
            {tab === "earnings" ? "Popular Tickers This Month" : "Key Events This Month"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tab === "earnings" ? (
              monthStocks.map((stock) => (
                <button
                  key={stock.ticker}
                  className="bg-blue-800/60 hover:bg-blue-700/80 rounded-lg p-3 transition flex flex-col items-center"
                  onClick={() => {
                    const weekRange = findWeekForStock(stock);
                    setZoomedWeek(weekRange);
                  }}
                >
                  <div className="text-white font-bold text-lg">{stock.ticker}</div>
                  <div className="text-blue-300 text-xs">{stock.name}</div>
                  <div className="text-blue-400 text-xs mt-1">
                    {format(new Date(stock.nextEarnings), "MMM d")}
                  </div>
                  <div className="text-green-400 text-xs font-medium">
                    {stock.popularity}% popular
                  </div>
                </button>
              ))
            ) : (
              monthEvents.map((event) => (
                <button
                  key={event.id}
                  className={`${getEventColor(event)} hover:opacity-80 rounded-lg p-3 transition flex flex-col items-center`}
                  onClick={() => {
                    const eventDate = new Date(event.date);
                    const weekStart = startOfWeek(eventDate, { weekStartsOn: 1 });
                    const weekEnd = endOfWeek(eventDate, { weekStartsOn: 1 });
                    setZoomedWeek({ start: weekStart, end: weekEnd });
                  }}
                >
                  <div className="text-2xl mb-1">{getEventIcon(event)}</div>
                  <div className="text-white font-bold text-sm text-center">{event.title}</div>
                  <div className="text-blue-200 text-xs mt-1">
                    {format(new Date(event.date), "MMM d")}
                  </div>
                  <div className="text-yellow-400 text-xs font-medium capitalize">
                    {event.impact} impact
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 text-center text-xs text-blue-400">Debug: Current user email: {user?.email || 'Not logged in'}</div>
      <h1 className="text-3xl font-bold mb-6 text-center">Calendar</h1>
      <div className="flex gap-8">
        {/* Side Tabs */}
        <Tabs value={tab} onValueChange={setTab} orientation="vertical" className="min-w-[120px]">
          <TabsList className="flex flex-col gap-2">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="w-full">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {/* Main Content */}
        <Card className="flex-1">
          <CardContent className="p-6">
            {isAdmin ? (
              (tab === "earnings" || tab === "events") ? (
                zoomedWeek ? (
                  renderWeekView(zoomedWeek.start, zoomedWeek.end)
                ) : zoomedMonth ? (
                  renderMonthCalendar(zoomedMonth)
                ) : (
                  renderMonthGrid()
                )
              ) : (
                <Calendar />
              )
            ) : (
              <div className="text-2xl text-muted-foreground text-center py-24">Calendar: Coming Soon!</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 