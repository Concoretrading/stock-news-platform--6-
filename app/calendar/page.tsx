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
    return (
      <div className="grid grid-cols-3 gap-6">
        {months.map((month, idx) => (
          <button
            key={idx}
            className="bg-blue-950/60 rounded-xl border border-blue-700/30 p-6 flex flex-col items-center hover:bg-blue-900/80 transition"
            onClick={() => setZoomedMonth(month)}
          >
            <div className="text-blue-300 font-bold text-lg mb-2">{format(month, "MMMM yyyy")}</div>
            <div className="text-xs text-blue-400 mb-2 tracking-widest">EARNINGS</div>
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

  // Helper: Render the detailed week view
  function renderWeekView(weekStart: Date, weekEnd: Date) {
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekStocks = getStocksForWeek(weekStart, weekEnd);

    return (
      <div>
        <div className="flex items-center mb-6">
          <button className="text-blue-400 hover:underline mr-4" onClick={() => setZoomedWeek(null)}>
            ← Back to Month
          </button>
          <div className="text-2xl font-bold text-blue-200">
            Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {weekDays.slice(0, 5).map((day, index) => {
            const dayStocks = getStocksForDate(day);
            const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][index];
            
            return (
              <div key={index} className="bg-blue-950/60 rounded-xl border border-blue-700/30 p-4">
                <div className="text-center mb-4">
                  <div className="text-blue-300 font-bold text-lg">{dayName}</div>
                  <div className="text-blue-400 text-sm">{format(day, "MMM d")}</div>
                </div>
                
                {dayStocks.length > 0 ? (
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
                ) : (
                  <div className="bg-blue-950/60 rounded-lg p-4 text-blue-300 flex flex-col items-center">
                    <span className="text-2xl mb-2">📅</span>
                    <span className="text-sm">No Earnings</span>
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

    return (
      <div>
        <div className="flex items-center mb-6">
          <button className="text-blue-400 hover:underline mr-4" onClick={() => setZoomedMonth(null)}>
            ← Back to Months
          </button>
          <div className="text-2xl font-bold text-blue-200">{format(month, "MMMM yyyy")}</div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-blue-950/60 rounded-xl border border-blue-700/30 p-6 mb-8">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
              <div key={day} className="text-center text-blue-300 font-semibold text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, month);
              const stocksForDay = getStocksForDate(day);
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
                        ? "bg-blue-800/60 border-blue-500/50 ring-2 ring-blue-400/30" 
                        : "bg-blue-900/40 border-blue-600/30"
                      : "bg-blue-950/20 border-blue-800/20"
                  }`}
                  onMouseEnter={() => setHoveredWeek(weekKey)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  onClick={() => setZoomedWeek({ start: weekStart, end: endOfWeek(day, { weekStartsOn: 1 }) })}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentMonth ? "text-blue-200" : "text-blue-500"
                  }`}>
                    {format(day, "d")}
                  </div>
                  
                  {isCurrentMonth && stocksForDay.length > 0 && (
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Tickers List */}
        <div className="bg-blue-950/60 rounded-xl border border-blue-700/30 p-6">
          <h3 className="text-lg font-bold text-blue-200 mb-4">Popular Tickers This Month</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {monthStocks.map((stock) => (
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
            ))}
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
              tab === "earnings" ? (
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