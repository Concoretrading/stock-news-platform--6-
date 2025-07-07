"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import Calendar from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { key: "events", label: "Events" },
  { key: "earnings", label: "Earnings" },
  { key: "alerts", label: "Alerts" },
];

export default function CalendarPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("events");

  // Only show the real calendar to the admin
  const isAdmin = user?.email === "handrigannick@gmail.com";

  return (
    <div className="container mx-auto py-8">
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
              <>
                <Calendar />
                <div className="mt-4 text-muted-foreground text-center">
                  Showing: <span className="font-semibold">{TABS.find(t => t.key === tab)?.label}</span>
                </div>
                {/* You can add tab-specific content here */}
              </>
            ) : (
              <div className="text-2xl text-muted-foreground text-center py-24">Calendar: Coming Soon!</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 