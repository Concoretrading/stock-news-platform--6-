"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Calendar } from "@/components/ui/calendar";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIDataCollector from "@/components/ai-data-collector";
import EarningsCalendarManager from "@/components/earnings-calendar-manager";
import UpcomingEventsCalendar from "@/components/upcoming-events-calendar";
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
  { key: "personal", label: "Personal" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ai-collector", label: "AI Collector" },
  { key: "earnings-manager", label: "Earnings Manager" },
];

// Comprehensive mock earnings data (4 months ahead)
const MOCK_EARNINGS = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-01-25T16:00:00Z",
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
    ticker: "AAPL",
    name: "Apple Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-04-25T16:00:00Z",
    nextType: "After Close",
    popularity: 95,
    lastEarnings: {
      date: "2024-01-25",
      eps: 2.10,
      revenue: 118.5,
      surprise: "+0.15",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-01-24T16:00:00Z",
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
    ticker: "TSLA",
    name: "Tesla Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-04-24T16:00:00Z",
    nextType: "After Close",
    popularity: 92,
    lastEarnings: {
      date: "2024-01-24",
      eps: 0.73,
      revenue: 25.6,
      surprise: "+0.07",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-01-30T16:00:00Z",
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
    ticker: "MSFT",
    name: "Microsoft Corporation",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-04-30T16:00:00Z",
    nextType: "After Close",
    popularity: 88,
    lastEarnings: {
      date: "2024-01-30",
      eps: 2.78,
      revenue: 61.1,
      surprise: "+0.12",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-01-30T16:00:00Z",
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
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-04-30T16:00:00Z",
    nextType: "After Close",
    popularity: 85,
    lastEarnings: {
      date: "2024-01-30",
      eps: 1.60,
      revenue: 85.3,
      surprise: "+0.18",
    },
    conferenceCall: "https://example.com/conference-call",
  },
  {
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-02-01T16:00:00Z",
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
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    logo: "/placeholder-logo.png",
    nextEarnings: "2024-05-01T16:00:00Z",
    nextType: "After Close",
    popularity: 82,
    lastEarnings: {
      date: "2024-02-01",
      eps: 0.80,
      revenue: 166.2,
      surprise: "+0.25",
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

// Personal watchlist data with 10 categories
const PERSONAL_WATCHLISTS = [
  {
    id: "tech-giants",
    name: "Tech Giants",
    stocks: [
      { ticker: "AAPL", name: "Apple Inc.", price: 185.64, change: +2.34, changePercent: +1.28, volume: "45.2M", marketCap: "2.9T", pe: 28.5, sector: "Technology" },
      { ticker: "MSFT", name: "Microsoft Corporation", price: 378.85, change: +4.12, changePercent: +1.10, volume: "22.1M", marketCap: "2.8T", pe: 32.1, sector: "Technology" },
      { ticker: "GOOGL", name: "Alphabet Inc.", price: 142.56, change: -1.23, changePercent: -0.85, volume: "18.7M", marketCap: "1.8T", pe: 25.3, sector: "Technology" },
      { ticker: "AMZN", name: "Amazon.com Inc.", price: 145.24, change: +3.45, changePercent: +2.43, volume: "35.8M", marketCap: "1.5T", pe: 45.2, sector: "Technology" },
      { ticker: "NVDA", name: "NVIDIA Corporation", price: 485.09, change: +12.67, changePercent: +2.68, volume: "42.3M", marketCap: "1.2T", pe: 65.8, sector: "Technology" }
    ]
  },
  {
    id: "ai-leaders",
    name: "AI Leaders",
    stocks: [
      { ticker: "NVDA", name: "NVIDIA Corporation", price: 485.09, change: +12.67, changePercent: +2.68, volume: "42.3M", marketCap: "1.2T", pe: 65.8, sector: "Technology" },
      { ticker: "TSLA", name: "Tesla Inc.", price: 237.49, change: +8.91, changePercent: +3.90, volume: "78.9M", marketCap: "754B", pe: 72.3, sector: "Automotive" },
      { ticker: "META", name: "Meta Platforms Inc.", price: 334.92, change: +5.67, changePercent: +1.72, volume: "15.2M", marketCap: "852B", pe: 28.9, sector: "Technology" },
      { ticker: "PLTR", name: "Palantir Technologies", price: 16.78, change: +0.45, changePercent: +2.75, volume: "45.6M", marketCap: "37B", pe: 145.2, sector: "Technology" },
      { ticker: "AI", name: "C3.ai Inc.", price: 28.45, change: -1.23, changePercent: -4.15, volume: "12.3M", marketCap: "3.2B", pe: -45.8, sector: "Technology" }
    ]
  },
  {
    id: "ev-revolution",
    name: "EV Revolution",
    stocks: [
      { ticker: "TSLA", name: "Tesla Inc.", price: 237.49, change: +8.91, changePercent: +3.90, volume: "78.9M", marketCap: "754B", pe: 72.3, sector: "Automotive" },
      { ticker: "RIVN", name: "Rivian Automotive", price: 18.92, change: +0.67, changePercent: +3.67, volume: "23.4M", marketCap: "18B", pe: -12.5, sector: "Automotive" },
      { ticker: "LCID", name: "Lucid Group Inc.", price: 4.56, change: -0.12, changePercent: -2.56, volume: "18.7M", marketCap: "10.5B", pe: -8.9, sector: "Automotive" },
      { ticker: "NIO", name: "NIO Inc.", price: 7.89, change: +0.34, changePercent: +4.50, volume: "45.2M", marketCap: "12.8B", pe: -15.2, sector: "Automotive" },
      { ticker: "XPEV", name: "XPeng Inc.", price: 12.34, change: +0.56, changePercent: +4.76, volume: "28.9M", marketCap: "11.2B", pe: -22.1, sector: "Automotive" }
    ]
  },
  {
    id: "biotech-breakthroughs",
    name: "Biotech Breakthroughs",
    stocks: [
      { ticker: "MRNA", name: "Moderna Inc.", price: 89.45, change: +2.34, changePercent: +2.68, volume: "12.8M", marketCap: "34B", pe: 15.2, sector: "Healthcare" },
      { ticker: "BNTX", name: "BioNTech SE", price: 95.67, change: -1.23, changePercent: -1.27, volume: "8.9M", marketCap: "22B", pe: 8.9, sector: "Healthcare" },
      { ticker: "CRSP", name: "CRISPR Therapeutics", price: 45.23, change: +1.45, changePercent: +3.31, volume: "5.6M", marketCap: "3.6B", pe: -12.8, sector: "Healthcare" },
      { ticker: "EDIT", name: "Editas Medicine", price: 12.78, change: -0.34, changePercent: -2.59, volume: "3.2M", marketCap: "1.1B", pe: -8.5, sector: "Healthcare" },
      { ticker: "BEAM", name: "Beam Therapeutics", price: 28.91, change: +0.89, changePercent: +3.18, volume: "2.1M", marketCap: "1.8B", pe: -15.3, sector: "Healthcare" }
    ]
  },
  {
    id: "crypto-correlated",
    name: "Crypto Correlated",
    stocks: [
      { ticker: "COIN", name: "Coinbase Global", price: 156.78, change: +8.45, changePercent: +5.70, volume: "15.6M", marketCap: "38B", pe: 45.2, sector: "Financial" },
      { ticker: "MSTR", name: "MicroStrategy Inc.", price: 445.67, change: +23.45, changePercent: +5.55, volume: "2.8M", marketCap: "7.4B", pe: 89.5, sector: "Technology" },
      { ticker: "RIOT", name: "Riot Platforms", price: 12.34, change: +0.67, changePercent: +5.74, volume: "18.9M", marketCap: "3.2B", pe: 156.8, sector: "Technology" },
      { ticker: "MARA", name: "Marathon Digital", price: 18.92, change: +1.23, changePercent: +6.95, volume: "25.4M", marketCap: "4.8B", pe: 234.1, sector: "Technology" },
      { ticker: "SQ", name: "Block Inc.", price: 67.89, change: +2.34, changePercent: +3.57, volume: "12.3M", marketCap: "42B", pe: 78.9, sector: "Technology" }
    ]
  },
  {
    id: "renewable-energy",
    name: "Renewable Energy",
    stocks: [
      { ticker: "ENPH", name: "Enphase Energy", price: 89.45, change: +3.45, changePercent: +4.01, volume: "8.9M", marketCap: "12B", pe: 34.5, sector: "Energy" },
      { ticker: "SEDG", name: "SolarEdge Technologies", price: 67.23, change: +2.12, changePercent: +3.25, volume: "5.6M", marketCap: "3.8B", pe: 28.9, sector: "Energy" },
      { ticker: "RUN", name: "Sunrun Inc.", price: 23.45, change: +0.89, changePercent: +3.94, volume: "12.3M", marketCap: "5.2B", pe: -15.6, sector: "Energy" },
      { ticker: "NEE", name: "NextEra Energy", price: 67.89, change: +1.23, changePercent: +1.85, volume: "8.7M", marketCap: "135B", pe: 18.9, sector: "Energy" },
      { ticker: "PLUG", name: "Plug Power Inc.", price: 4.56, change: +0.23, changePercent: +5.31, volume: "45.8M", marketCap: "2.8B", pe: -12.3, sector: "Energy" }
    ]
  },
  {
    id: "defense-contractors",
    name: "Defense Contractors",
    stocks: [
      { ticker: "LMT", name: "Lockheed Martin", price: 445.67, change: +5.67, changePercent: +1.29, volume: "2.1M", marketCap: "112B", pe: 16.8, sector: "Aerospace" },
      { ticker: "RTX", name: "Raytheon Technologies", price: 89.45, change: +1.23, changePercent: +1.39, volume: "6.8M", marketCap: "127B", pe: 18.9, sector: "Aerospace" },
      { ticker: "BA", name: "Boeing Co.", price: 234.56, change: +4.56, changePercent: +1.98, volume: "8.9M", marketCap: "142B", pe: -45.2, sector: "Aerospace" },
      { ticker: "GD", name: "General Dynamics", price: 267.89, change: +3.45, changePercent: +1.30, volume: "1.8M", marketCap: "76B", pe: 22.1, sector: "Aerospace" },
      { ticker: "NOC", name: "Northrop Grumman", price: 445.23, change: +6.78, changePercent: +1.55, volume: "1.2M", marketCap: "68B", pe: 15.6, sector: "Aerospace" }
    ]
  },
  {
    id: "gaming-entertainment",
    name: "Gaming & Entertainment",
    stocks: [
      { ticker: "NFLX", name: "Netflix Inc.", price: 445.67, change: +12.34, changePercent: +2.85, volume: "8.9M", marketCap: "198B", pe: 32.1, sector: "Entertainment" },
      { ticker: "DIS", name: "Walt Disney Co.", price: 89.45, change: +2.34, changePercent: +2.69, volume: "12.3M", marketCap: "164B", pe: 45.2, sector: "Entertainment" },
      { ticker: "ATVI", name: "Activision Blizzard", price: 95.67, change: +1.23, changePercent: +1.30, volume: "8.7M", marketCap: "74B", pe: 28.9, sector: "Entertainment" },
      { ticker: "EA", name: "Electronic Arts", price: 134.56, change: +3.45, changePercent: +2.63, volume: "4.2M", marketCap: "37B", pe: 34.5, sector: "Entertainment" },
      { ticker: "TTWO", name: "Take-Two Interactive", price: 145.23, change: +4.56, changePercent: +3.24, volume: "3.8M", marketCap: "24B", pe: 45.8, sector: "Entertainment" }
    ]
  },
  {
    id: "fintech-disruptors",
    name: "Fintech Disruptors",
    stocks: [
      { ticker: "SQ", name: "Block Inc.", price: 67.89, change: +2.34, changePercent: +3.57, volume: "12.3M", marketCap: "42B", pe: 78.9, sector: "Technology" },
      { ticker: "PYPL", name: "PayPal Holdings", price: 67.23, change: +1.45, changePercent: +2.20, volume: "15.6M", marketCap: "76B", pe: 18.9, sector: "Technology" },
      { ticker: "ADYEN", name: "Adyen N.V.", price: 1234.56, change: +45.67, changePercent: +3.84, volume: "1.2M", marketCap: "38B", pe: 45.2, sector: "Technology" },
      { ticker: "STRIPE", name: "Stripe Inc.", price: 89.45, change: +3.45, changePercent: +4.01, volume: "N/A", marketCap: "95B", pe: "N/A", sector: "Technology" },
      { ticker: "ROKU", name: "Roku Inc.", price: 67.89, change: +2.34, changePercent: +3.57, volume: "8.9M", marketCap: "9.8B", pe: -12.3, sector: "Technology" }
    ]
  },
  {
    id: "space-exploration",
    name: "Space Exploration",
    stocks: [
      { ticker: "SPCE", name: "Virgin Galactic", price: 2.34, change: +0.12, changePercent: +5.41, volume: "45.6M", marketCap: "1.2B", pe: -8.9, sector: "Aerospace" },
      { ticker: "RKLB", name: "Rocket Lab USA", price: 4.56, change: +0.23, changePercent: +5.31, volume: "12.3M", marketCap: "2.1B", pe: -15.6, sector: "Aerospace" },
      { ticker: "ASTS", name: "AST SpaceMobile", price: 3.45, change: +0.18, changePercent: +5.50, volume: "8.7M", marketCap: "0.8B", pe: -12.3, sector: "Aerospace" },
      { ticker: "VORB", name: "Virgin Orbit", price: 0.89, change: +0.05, changePercent: +5.95, volume: "23.4M", marketCap: "0.3B", pe: -5.6, sector: "Aerospace" },
      { ticker: "MAXR", name: "Maxar Technologies", price: 23.45, change: +1.23, changePercent: +5.53, volume: "2.8M", marketCap: "1.5B", pe: 45.2, sector: "Aerospace" }
    ]
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
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>("tech-giants");
  const [selectedPersonalStock, setSelectedPersonalStock] = useState<any>(null);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [showStockSelector, setShowStockSelector] = useState(false);

  // Only show the real calendar to the admin
  const isAdmin = user?.email === "handrigannick@gmail.com";

  // Helper: Get week key for a date
  function getWeekKey(date: Date) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    return format(weekStart, 'yyyy-MM-dd');
  }

  // Helper: Get stocks for a specific week (showing 4 months ahead)
  function getStocksForWeek(weekStart: Date, weekEnd: Date) {
    const currentDate = new Date();
    const fourMonthsAhead = new Date();
    fourMonthsAhead.setMonth(currentDate.getMonth() + 4);
    
    return MOCK_EARNINGS.filter(stock => {
      const earningsDate = new Date(stock.nextEarnings);
      // Show earnings from current date to 4 months ahead
      return earningsDate >= currentDate && earningsDate <= fourMonthsAhead && earningsDate >= weekStart && earningsDate <= weekEnd;
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

  // Helper: Get stocks for a specific date (showing 4 months ahead)
  function getStocksForDate(date: Date) {
    const currentDate = new Date();
    const fourMonthsAhead = new Date();
    fourMonthsAhead.setMonth(currentDate.getMonth() + 4);
    
    return MOCK_EARNINGS.filter(stock => {
      const earningsDate = new Date(stock.nextEarnings);
      // Show earnings from current date to 4 months ahead
      return earningsDate >= currentDate && earningsDate <= fourMonthsAhead && isSameDay(earningsDate, date);
    });
  }

  // Helper: Get stocks for a specific month (showing 4 months ahead)
  function getStocksForMonth(month: Date) {
    const currentDate = new Date();
    const fourMonthsAhead = new Date();
    fourMonthsAhead.setMonth(currentDate.getMonth() + 4);
    
    return MOCK_EARNINGS.filter(stock => {
      const earningsDate = new Date(stock.nextEarnings);
      // Show earnings from current month to 4 months ahead
      return earningsDate >= currentDate && earningsDate <= fourMonthsAhead && isSameMonth(earningsDate, month);
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

  // Helper: Get user's watchlist stocks from Firebase
  async function getUserWatchlist() {
    try {
      const response = await fetchWithAuth('/api/stocks');
      if (response.ok) {
        const data = await response.json();
        return data.stocks || [];
      }
    } catch (error) {
      console.error('Error fetching user watchlist:', error);
    }
    
    // Fallback to mock data
    return [
      { ticker: "AAPL", name: "Apple Inc.", price: 185.64, change: +2.34, changePercent: +1.28, volume: "45.2M", marketCap: "2.9T", pe: 28.5, sector: "Technology" },
      { ticker: "TSLA", name: "Tesla Inc.", price: 237.49, change: +8.91, changePercent: +3.90, volume: "78.9M", marketCap: "754B", pe: 72.3, sector: "Automotive" },
      { ticker: "NVDA", name: "NVIDIA Corporation", price: 485.09, change: +12.67, changePercent: +2.68, volume: "42.3M", marketCap: "1.2T", pe: 65.8, sector: "Technology" },
      { ticker: "MSFT", name: "Microsoft Corporation", price: 378.85, change: +4.12, changePercent: +1.10, volume: "22.1M", marketCap: "2.8T", pe: 32.1, sector: "Technology" },
      { ticker: "GOOGL", name: "Alphabet Inc.", price: 142.56, change: -1.23, changePercent: -0.85, volume: "18.7M", marketCap: "1.8T", pe: 25.3, sector: "Technology" },
      { ticker: "AMZN", name: "Amazon.com Inc.", price: 145.24, change: +3.45, changePercent: +2.43, volume: "35.8M", marketCap: "1.5T", pe: 45.2, sector: "Technology" },
      { ticker: "META", name: "Meta Platforms Inc.", price: 334.92, change: +5.67, changePercent: +1.72, volume: "15.2M", marketCap: "852B", pe: 28.9, sector: "Technology" },
      { ticker: "NFLX", name: "Netflix Inc.", price: 445.67, change: +12.34, changePercent: +2.85, volume: "8.9M", marketCap: "198B", pe: 32.1, sector: "Entertainment" }
    ];
  }

  // Helper: Get selected stocks data
  async function getSelectedStocksData() {
    const watchlist = await getUserWatchlist();
    return watchlist.filter((stock: any) => selectedStocks.includes(stock.ticker));
  }

  // Helper: Toggle stock selection
  function toggleStockSelection(ticker: string) {
    if (selectedStocks.includes(ticker)) {
      setSelectedStocks(selectedStocks.filter(s => s !== ticker));
    } else if (selectedStocks.length < 3) {
      setSelectedStocks([...selectedStocks, ticker]);
    }
  }

  // Helper: Render the personal watchlist view
  async function renderPersonalView() {
    const userWatchlist = await getUserWatchlist();
    const selectedStocksData = await getSelectedStocksData();
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-200">Personal AI Monitoring</h2>
            <p className="text-gray-400">Select up to 3 stocks from your watchlist for AI-powered event tracking</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Selected: {selectedStocks.length}/3</div>
            <div className="text-xs text-gray-500">AI will monitor earnings calls and announcements</div>
          </div>
        </div>

        {/* Stock Selection */}
        <div className="bg-gray-900/60 rounded-xl border border-gray-600/30 p-6">
          <h3 className="text-lg font-bold text-gray-200 mb-4">Select Your Top 3 Stocks</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {userWatchlist.map((stock: any) => (
              <button
                key={stock.ticker}
                className={`p-4 rounded-lg transition text-left ${
                  selectedStocks.includes(stock.ticker)
                    ? "bg-purple-600/80 text-white ring-2 ring-purple-400"
                    : selectedStocks.length >= 3
                    ? "bg-gray-800/40 text-gray-500 cursor-not-allowed"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-700/60"
                }`}
                onClick={() => toggleStockSelection(stock.ticker)}
                disabled={selectedStocks.length >= 3 && !selectedStocks.includes(stock.ticker)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-lg">{stock.ticker}</div>
                  {selectedStocks.includes(stock.ticker) && (
                    <div className="text-purple-200">✓</div>
                  )}
                </div>
                <div className="text-sm opacity-75 mb-2">{stock.name}</div>
                <div className="text-lg font-bold">${stock.price}</div>
                <div className={`text-sm ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Stocks Display */}
        {selectedStocksData.length > 0 && (
          <div className="bg-gray-900/60 rounded-xl border border-gray-600/30 p-6">
            <h3 className="text-lg font-bold text-gray-200 mb-4">Your AI-Monitored Stocks</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedStocksData.map((stock: any) => (
                <div
                  key={stock.ticker}
                  className={`p-4 rounded-lg transition cursor-pointer ${
                    selectedPersonalStock?.ticker === stock.ticker
                      ? "bg-purple-600/80 text-white"
                      : "bg-gray-800/60 text-gray-300 hover:bg-gray-700/60"
                  }`}
                  onClick={() => setSelectedPersonalStock(stock)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-xl">{stock.ticker}</div>
                    <div className="text-sm">AI Monitoring ✓</div>
                  </div>
                  <div className="text-sm opacity-75 mb-3">{stock.name}</div>
                  <div className="text-2xl font-bold mb-1">${stock.price}</div>
                  <div className={`text-sm font-semibold ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Details Panel */}
        {selectedPersonalStock && (
          <div className="bg-gray-900/60 rounded-xl border border-gray-600/30 p-6">
            <h3 className="text-lg font-bold text-gray-200 mb-4">Stock Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold text-gray-200 mb-1">{selectedPersonalStock.ticker}</div>
                <div className="text-gray-400 mb-4">{selectedPersonalStock.name}</div>
                
                <div className="bg-gray-800/60 rounded-lg p-4 mb-4">
                  <div className="text-4xl font-bold text-gray-200 mb-2">${selectedPersonalStock.price}</div>
                  <div className={`text-xl font-semibold ${selectedPersonalStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedPersonalStock.change >= 0 ? '+' : ''}{selectedPersonalStock.change} ({selectedPersonalStock.changePercent >= 0 ? '+' : ''}{selectedPersonalStock.changePercent}%)
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Volume</div>
                  <div className="text-sm font-semibold text-gray-200">{selectedPersonalStock.volume}</div>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Market Cap</div>
                  <div className="text-sm font-semibold text-gray-200">{selectedPersonalStock.marketCap}</div>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <div className="text-xs text-gray-400">P/E Ratio</div>
                  <div className="text-sm font-semibold text-gray-200">{selectedPersonalStock.pe}</div>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Sector</div>
                  <div className="text-sm font-semibold text-gray-200">{selectedPersonalStock.sector}</div>
                </div>
              </div>
            </div>
            
            {/* AI Monitoring Status */}
            <div className="mt-6 p-4 bg-purple-900/20 border border-purple-600/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-purple-400">🤖</div>
                <div className="font-semibold text-purple-200">AI Monitoring Active</div>
              </div>
              <div className="text-sm text-purple-300">
                This stock is being monitored for earnings calls, product announcements, and key developments.
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
              tab === "personal" ? (
                renderPersonalView()
              ) : tab === "upcoming" ? (
                <UpcomingEventsCalendar />
              ) : tab === "ai-collector" ? (
                <AIDataCollector />
              ) : tab === "earnings-manager" ? (
                <EarningsCalendarManager />
              ) : (tab === "earnings" || tab === "events") ? (
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