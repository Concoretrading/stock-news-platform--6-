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
            <TabsList className="flex flex-col h-auto bg-muted/50 p-3 gap-3">
              <TabsTrigger value="events" className="w-48 justify-start text-lg py-4">
                <Calendar className="h-5 w-5 mr-3" />
                Events
              </TabsTrigger>
              <TabsTrigger value="earnings" className="w-48 justify-start text-lg py-4">
                <TrendingUp className="h-5 w-5 mr-3" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="elite" className="w-48 justify-start text-lg py-4">
                <Star className="h-5 w-5 mr-3" />
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
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-light tracking-wide text-gradient bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                    Elite
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-12 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl border border-amber-200 shadow-lg">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full blur-lg opacity-20"></div>
                    <div className="relative p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                      <Star className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-light text-amber-800 mb-6 tracking-wide">Coming Soon</h3>
                  <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto text-lg font-light">
                    This section here will be an absolute game changer for everyone in the family allowing you to draw from the past the future and give you the most for the present on 3 stocks of your choice. Coming soon
                  </p>
                </div>
              </CardContent>
            </TabsContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
} 