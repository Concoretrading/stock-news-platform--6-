'use client';

import { AdminCalendarUpload } from '@/components/admin-calendar-upload';
import { EarningsCalendar } from '@/components/earnings-calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, TrendingUp, Star } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendar & Events</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <Tabs defaultValue="events" orientation="vertical" className="w-full">
        <div className="flex gap-6">
          {/* Vertical Tabs */}
          <Card className="h-fit">
            <TabsList className="flex flex-col h-auto bg-muted/50 p-2 gap-2">
              <TabsTrigger value="events" className="w-32 justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger value="earnings" className="w-32 justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="elite" className="w-32 justify-start">
                <Star className="h-4 w-4 mr-2" />
                Elite
              </TabsTrigger>
            </TabsList>
          </Card>

          {/* Calendar Content */}
          <Card className="flex-1 p-6">
            <TabsContent value="events">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EarningsCalendar type="events" />
              </CardContent>
            </TabsContent>

            <TabsContent value="earnings">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Earnings Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <AdminCalendarUpload />
                <EarningsCalendar type="earnings" />
              </CardContent>
            </TabsContent>

            <TabsContent value="elite">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Elite Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EarningsCalendar type="elite" />
              </CardContent>
            </TabsContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
} 