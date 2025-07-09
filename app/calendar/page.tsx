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

      {/* Mobile: Horizontal Tabs at Top */}
      <div className="block sm:hidden mb-4">
        <div className="flex w-full justify-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          <button
            className={`flex-1 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar className="inline h-4 w-4 mr-1" /> Events
          </button>
          <button
            className={`flex-1 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'earnings' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            onClick={() => setActiveTab('earnings')}
          >
            <BarChart2 className="inline h-4 w-4 mr-1" /> Earnings
          </button>
          <button
            className={`flex-1 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'elite' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            onClick={() => setActiveTab('elite')}
          >
            <Star className="inline h-4 w-4 mr-1" /> Elite
          </button>
        </div>
      </div>

      {/* Mobile: Drill-down Calendar */}
      {isMobile ? (
        <div>
          {activeTab === 'events' ? (
            <ModernCalendar type="events" />
          ) : activeTab === 'earnings' ? (
            <div className="flex flex-col gap-2">
              {months.map((m, i) => (
                <div key={i}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold text-base ${expandedMonth === i ? 'bg-primary/10' : 'bg-muted'}`}
                    onClick={() => setExpandedMonth(expandedMonth === i ? null : i)}
                  >
                    {m.label}
                  </button>
                  {expandedMonth === i && (
                    <div className="pl-4 pt-2 flex flex-col gap-1">
                      {weeks.map((w) => (
                        <div key={w}>
                          <button
                            className={`w-full text-left px-3 py-2 rounded font-medium text-sm ${expandedWeek === w ? 'bg-primary/20' : 'bg-muted/50'}`}
                            onClick={() => setExpandedWeek(expandedWeek === w ? null : w)}
                          >
                            Week {w}
                          </button>
                          {expandedWeek === w && (
                            <div className="pl-4 pt-1">
                              <EarningsCalendar type="earnings" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {months.map((m, i) => (
                <div key={i}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold text-base ${expandedMonth === i ? 'bg-primary/10' : 'bg-muted'}`}
                    onClick={() => setExpandedMonth(expandedMonth === i ? null : i)}
                  >
                    {m.label}
                  </button>
                  {expandedMonth === i && (
                    <div className="pl-4 pt-2 flex flex-col gap-1">
                      {weeks.map((w) => (
                        <div key={w}>
                          <button
                            className={`w-full text-left px-3 py-2 rounded font-medium text-sm ${expandedWeek === w ? 'bg-primary/20' : 'bg-muted/50'}`}
                            onClick={() => setExpandedWeek(expandedWeek === w ? null : w)}
                          >
                            Week {w}
                          </button>
                          {expandedWeek === w && (
                            <div className="pl-4 pt-1">
                              <div className="text-center py-8">
                                <div className="w-full py-6 px-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                                  <p className="text-amber-800 font-medium mb-2">
                                    This section here will be an absolute game changer for everyone in the family
                                  </p>
                                  <p className="text-amber-700 text-sm mb-3">
                                    allowing you to draw from the past the future and give you the most for the present.
                                  </p>
                                  <span className="text-amber-600 font-semibold">Coming soon</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Desktop: Restore original tab layout
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
                Elite Earnings
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Premium earnings events with enhanced data and analysis
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center py-8">
                <div className="w-full py-6 px-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 font-medium mb-2">
                    This section here will be an absolute game changer for everyone in the family
                  </p>
                  <p className="text-amber-700 text-sm mb-3">
                    allowing you to draw from the past the future and give you the most for the present.
                  </p>
                  <span className="text-amber-600 font-semibold">Coming soon</span>
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
      )}
    </div>
  );
} 