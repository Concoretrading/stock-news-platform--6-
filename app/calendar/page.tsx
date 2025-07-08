'use client';

import { AdminCalendarUpload } from '@/components/admin-calendar-upload';
import { EarningsCalendar } from '@/components/earnings-calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="flex gap-6">
        {/* Vertical Tabs */}
        <Card className="h-fit">
          <TabsList className="flex flex-col h-auto bg-muted/50 p-2 gap-2">
            <TabsTrigger value="events" className="w-32 justify-start">Events</TabsTrigger>
            <TabsTrigger value="earnings" className="w-32 justify-start">Earnings</TabsTrigger>
            <TabsTrigger value="elite" className="w-32 justify-start">Elite</TabsTrigger>
          </TabsList>
        </Card>

        {/* Calendar Content */}
        <Card className="flex-1 p-6">
          <Tabs defaultValue="events" orientation="vertical" className="w-full">
            <TabsContent value="events">
              <EarningsCalendar type="events" />
            </TabsContent>

            <TabsContent value="earnings">
              <AdminCalendarUpload />
              <EarningsCalendar type="earnings" />
            </TabsContent>

            <TabsContent value="elite">
              <EarningsCalendar type="elite" />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
} 