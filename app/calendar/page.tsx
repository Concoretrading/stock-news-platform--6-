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
import { addMonths, startOfMonth, format, eachWeekOfInterval, endOfMonth } from "date-fns";

const TABS = [
  { key: "events", label: "Events" },
  { key: "earnings", label: "Earnings" },
  { key: "alerts", label: "Alerts" },
];

// Mock earnings data for demonstration
const MOCK_EARNINGS = [
  {
    ticker: "AEHR",
    name: "Aehr Test Systems",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-05-08T16:00:00Z",
    nextType: "After Close",
    lastEarnings: {
      date: "2024-02-07",
      eps: 0.32,
      revenue: 18.5,
      surprise: "+0.04",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "DAL",
    name: "Delta Air Lines",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-05-10T13:00:00Z",
    nextType: "Before Open",
    lastEarnings: {
      date: "2024-02-09",
      eps: 1.12,
      revenue: 12.3,
      surprise: "-0.02",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  // Add more mock stocks as needed
];

export default function CalendarPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("events");
  const [zoomedMonth, setZoomedMonth] = useState<Date | null>(null);
  const [zoomedWeek, setZoomedWeek] = useState<{ start: Date; end: Date } | null>(null);
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Only show the real calendar to the admin
  const isAdmin = user?.email === "handrigannick@gmail.com";

  // Helper: Render the grid of months
  function renderMonthGrid() {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => startOfMonth(addMonths(now, i - 3)));
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

  // Helper: Render the full calendar view for a month
  function renderMonthCalendar(month: Date) {
    const weeks = eachWeekOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
    return (
      <div>
        <div className="flex items-center mb-4">
          <button className="text-blue-400 hover:underline mr-4" onClick={() => setZoomedMonth(null)}>
            ← Back to Months
          </button>
          <div className="text-xl font-bold text-blue-200">{format(month, "MMMM yyyy")}</div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {weeks.map((weekStart, i) => {
            const weekEnd = addMonths(weekStart, 0);
            const isHovered = hoveredWeek === i;
            return (
              <div
                key={i}
                className={`rounded-lg border p-4 flex items-center justify-between transition cursor-pointer ${isHovered ? "border-blue-500 bg-blue-900/40" : "border-blue-700/30 bg-blue-950/60"}`}
                onMouseEnter={() => setHoveredWeek(i)}
                onMouseLeave={() => setHoveredWeek(null)}
                onClick={() => setZoomedWeek({ start: weekStart, end: endOfMonth(weekStart) })}
              >
                <div className="text-blue-200 font-semibold">Week {i + 1}: {format(weekStart, "MMM d")}</div>
                <span className="text-blue-400">Click to zoom in</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Helper: Render the detailed week view (reuse your current week view logic)
  function renderZoomedWeek() {
    return (
      <div>
        <button className="text-blue-400 hover:underline mb-4" onClick={() => setZoomedWeek(null)}>
          ← Back to Month
        </button>
        <div className="flex gap-4">
          {/* Example: 5 days in a week */}
          {[0, 1, 2, 3, 4].map((dayIdx) => {
            // For demo, show mock earnings on Tue/Thu
            let earnings = null;
            if (dayIdx === 1) earnings = [MOCK_EARNINGS[0]];
            if (dayIdx === 3) earnings = [MOCK_EARNINGS[1]];
            return (
              <div key={dayIdx} className="flex-1 min-w-[180px] bg-slate-900 rounded-xl border border-blue-700/30 p-4 flex flex-col items-center">
                <div className="text-blue-300 font-bold text-lg mb-2">{["Mon","Tue","Wed","Thu","Fri"][dayIdx]}</div>
                <div className="text-xs text-blue-400 mb-2 tracking-widest">EARNINGS</div>
                {earnings ? (
                  earnings.map((stock) => (
                    <Dialog key={stock.ticker} open={modalOpen && selectedStock?.ticker === stock.ticker} onOpenChange={setModalOpen}>
                      <DialogTrigger asChild>
                        <button
                          className="flex flex-col items-center bg-blue-800/60 rounded-lg p-3 mt-2 hover:bg-blue-700/80 transition"
                          onClick={() => setSelectedStock(stock)}
                        >
                          <img src={stock.logo} alt={stock.ticker} className="w-12 h-12 rounded mb-1" />
                          <span className="text-white font-semibold text-sm">{stock.ticker}</span>
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
                  ))
                ) : (
                  <div className="bg-blue-950/60 rounded-lg p-3 text-blue-300 flex items-center gap-2 mt-2">
                    <span className="text-lg">📅</span> No Earnings
                  </div>
                )}
              </div>
            );
          })}
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
                  renderZoomedWeek()
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