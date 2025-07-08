import { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

interface EarningsEvent {
  stockTicker: string;
  companyName: string;
  eventDate: Date;
  eventType: string;
}

interface EarningsCalendarProps {
  type?: 'events' | 'earnings' | 'elite';
}

export function EarningsCalendar({ type = 'earnings' }: EarningsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Record<string, EarningsEvent[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const db = getFirestore();
        
        // Get start and end of current month
        const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

        const eventsRef = collection(db, 'calendar_events');
        const q = query(
          eventsRef,
          where('eventDate', '>=', start),
          where('eventDate', '<=', end),
          where('eventType', '==', type)
        );

        const querySnapshot = await getDocs(q);
        const newEvents: Record<string, EarningsEvent[]> = {};

        querySnapshot.forEach((doc) => {
          const event = doc.data() as EarningsEvent;
          const dateKey = format(new Date(event.eventDate), 'yyyy-MM-dd');
          if (!newEvents[dateKey]) {
            newEvents[dateKey] = [];
          }
          newEvents[dateKey].push(event);
        });

        setEvents(newEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [selectedDate, type]);

  const dayHasEvents = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return !!events[dateKey]?.length;
  };

  return (
    <div>
      <div className="flex gap-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          modifiers={{ hasEvents: dayHasEvents }}
          modifiersStyles={{
            hasEvents: { backgroundColor: 'var(--primary)', color: 'white' }
          }}
          className="rounded-md border"
        />

        <Card className="flex-1">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">
              Events for {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div>Loading events...</div>
              ) : (
                <div className="space-y-2">
                  {events[format(selectedDate, 'yyyy-MM-dd')]?.map((event, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg border"
                    >
                      <Badge>{event.stockTicker}</Badge>
                      <span>{event.companyName}</span>
                      <Badge variant="outline">{event.eventType}</Badge>
                    </div>
                  )) || <div>No events for this date</div>}
                </div>
              )}
            </ScrollArea>
          </div>
        </Card>
      </div>
    </div>
  );
} 