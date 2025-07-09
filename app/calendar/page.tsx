'use client';

import { AdminCalendarUpload } from '@/components/admin-calendar-upload';
import { EarningsCalendar } from '@/components/earnings-calendar';
import { ModernCalendar } from '@/components/modern-calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, TrendingUp, Star, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.email === 'handrigannick@gmail.com';

  return (
    <div className="container mx-auto p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Calendar & Events</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <Tabs defaultValue="events" className="w-full">
        {/* Mobile: Horizontal Tabs, Desktop: Vertical Tabs */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Tabs - Horizontal on mobile, Vertical on desktop */}
          <Card className="h-fit">
            <TabsList className="flex flex-row lg:flex-col h-auto bg-muted/50 p-2 lg:p-3 gap-1 lg:gap-3 overflow-x-auto lg:overflow-x-visible">
              <TabsTrigger value="events" className="flex-shrink-0 lg:w-48 justify-start text-sm lg:text-lg py-2 lg:py-4 whitespace-nowrap">
                <Calendar className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                Events
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex-shrink-0 lg:w-48 justify-start text-sm lg:text-lg py-2 lg:py-4 whitespace-nowrap">
                <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="elite" className="flex-shrink-0 lg:w-48 justify-start text-sm lg:text-lg py-2 lg:py-4 whitespace-nowrap">
                <Star className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                Elite
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="flex-shrink-0 lg:w-48 justify-start text-sm lg:text-lg py-2 lg:py-4 bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300 whitespace-nowrap">
                  <div className="p-0.5 lg:p-1 bg-gradient-to-br from-amber-400 to-amber-600 rounded mr-1.5 lg:mr-3">
                    <Settings className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-white" />
                  </div>
                  Admin
                </TabsTrigger>
              )}
            </TabsList>
          </Card>

          {/* Calendar Content */}
          <Card className="flex-1 p-3 sm:p-6">
            <TabsContent value="events">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Economic Events
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Fed meetings, economic data releases, market holidays, and options expiration events
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <ModernCalendar type="events" />
              </CardContent>
            </TabsContent>

            <TabsContent value="earnings">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  Earnings Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <EarningsCalendar type="earnings" />
              </CardContent>
            </TabsContent>

            <TabsContent value="elite">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg">
                    <Star className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className="text-lg sm:text-2xl font-light tracking-wide text-gradient bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                    Elite
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center p-6 sm:p-12 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl border border-amber-200 shadow-lg">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full blur-lg opacity-20"></div>
                    <div className="relative p-3 sm:p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
                      <Star className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-light text-amber-800 mb-4 sm:mb-6 tracking-wide">Coming Soon</h3>
                  <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto text-sm sm:text-lg font-light">
                    This section here will be an absolute game changer for everyone in the family allowing you to draw from the past the future and give you the most for the present on 3 stocks of your choice.
                  </p>
                </div>
              </CardContent>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg">
                      <Settings className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-lg sm:text-2xl font-light tracking-wide text-gradient bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                      Admin Control Panel
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <AdminCalendarUpload />
                </CardContent>
              </TabsContent>
            )}
          </Card>
        </div>
      </Tabs>
    </div>
  );
} 