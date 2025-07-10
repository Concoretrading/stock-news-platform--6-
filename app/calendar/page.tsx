'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, BarChart2, Star } from 'lucide-react';
import { ModernCalendar } from '@/components/modern-calendar';
import { EarningsCalendar } from '@/components/earnings-calendar';
import { AdminCalendarUpload } from '@/components/admin-calendar-upload';

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

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const isMobile = useIsMobile();

  // Check if user is admin
  const isAdmin = user?.email === 'handrigannick@gmail.com';

  // Mobile calendar months (for demo, use current and next 2 months)
  const now = new Date();
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return {
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
      month: d.getMonth(),
      year: d.getFullYear(),
      date: d,
      index: i
    };
  });

  // For demo, weeks are just 1-5
  const weeks = [1, 2, 3, 4, 5];

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

      {/* Always show desktop tab layout for all devices */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="elite">Elite</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>
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
              <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />
              Earnings Calendar
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Company earnings, EPS estimates, and conference call times
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <EarningsCalendar type="earnings" />
          </CardContent>
        </TabsContent>
        <TabsContent value="elite">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Star className="h-4 w-4 sm:h-5 sm:w-5" />
              Elite
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Premium features and enhanced analysis
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center py-12">
              <div className="w-full py-10 px-8 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-2xl shadow-lg relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <div className="absolute top-4 right-4 w-20 h-20 bg-amber-300 rounded-full blur-xl"></div>
                  <div className="absolute bottom-8 left-8 w-16 h-16 bg-orange-300 rounded-full blur-lg"></div>
                  <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-yellow-300 rounded-full blur-md"></div>
                </div>
                <div className="relative z-10 max-w-lg mx-auto">
                  {/* Golden Concore Logo with glow effect */}
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full blur-md opacity-40 animate-pulse"></div>
                      <div className="relative z-10 w-16 h-16 mx-auto">
                        <img 
                          src="/images/concore-logo-new.png" 
                          alt="Concore Elite" 
                          className="w-full h-full object-contain filter drop-shadow-lg"
                          style={{
                            filter: 'brightness(1.2) contrast(1.1) saturate(1.3) hue-rotate(15deg) drop-shadow(0 4px 8px rgba(251, 191, 36, 0.4))'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Main message with better typography */}
                  <div className="space-y-4">
                    <h3 className="text-amber-800 font-bold text-xl sm:text-2xl leading-tight">
                      This section here will be an absolute game changer for everyone in the family
                    </h3>
                    <p className="text-amber-700 text-base sm:text-lg leading-relaxed font-medium">
                      allowing you to draw from the past the future and give you the most for the present.
                    </p>
                  </div>
                  {/* Enhanced coming soon badge */}
                  <div className="mt-8">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-full shadow-md transform hover:scale-105 transition-transform duration-200">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Coming soon
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        {isAdmin && (
          <TabsContent value="admin">
            <AdminCalendarUpload />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 