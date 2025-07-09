import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';

// Economic events template - this would normally be fetched from an API
const getEconomicEventsForWeeks = () => {
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(currentWeekStart.getDate() + 7);
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Generate events for current week and next week
  const events = [];
  
  // Current Week Events
  const currentMonday = new Date(currentWeekStart);
  const currentTuesday = new Date(currentWeekStart);
  currentTuesday.setDate(currentMonday.getDate() + 1);
  const currentWednesday = new Date(currentWeekStart);
  currentWednesday.setDate(currentMonday.getDate() + 2);
  const currentThursday = new Date(currentWeekStart);
  currentThursday.setDate(currentMonday.getDate() + 3);
  const currentFriday = new Date(currentWeekStart);
  currentFriday.setDate(currentMonday.getDate() + 4);
  
  // Next Week Events  
  const nextMonday = new Date(nextWeekStart);
  const nextTuesday = new Date(nextWeekStart);
  nextTuesday.setDate(nextMonday.getDate() + 1);
  const nextWednesday = new Date(nextWeekStart);
  nextWednesday.setDate(nextMonday.getDate() + 2);
  const nextThursday = new Date(nextWeekStart);
  nextThursday.setDate(nextMonday.getDate() + 3);
  const nextFriday = new Date(nextWeekStart);
  nextFriday.setDate(nextMonday.getDate() + 4);
  
  // Common weekly economic events pattern
  return [
    // Current Week
    {
      date: formatDate(currentTuesday),
      ticker: 'CPI',
      company_name: 'Consumer Price Index (CPI)',
      event_type: 'Monthly Inflation Data (8:30 AM ET) - Major Market Mover',
      confirmed: true,
      auto_generated: true
    },
    {
      date: formatDate(currentWednesday),
      ticker: 'PPI',
      company_name: 'Producer Price Index (PPI)', 
      event_type: 'Producer Inflation MoM & YoY (8:30 AM ET) - Inflation Pipeline',
      confirmed: true,
      auto_generated: true
    },
    {
      date: formatDate(currentThursday),
      ticker: 'CLAIMS',
      company_name: 'Initial Jobless Claims',
      event_type: 'Weekly Unemployment Claims (8:30 AM ET) - Labor Market Health',
      confirmed: true,
      auto_generated: true
    },
    {
      date: formatDate(currentFriday),
      ticker: 'RETAIL',
      company_name: 'Retail Sales',
      event_type: 'Monthly Consumer Spending (8:30 AM ET) - Economic Strength',
      confirmed: true,
      auto_generated: true
    },
    
    // Next Week
    {
      date: formatDate(nextTuesday),
      ticker: 'HOUSING',
      company_name: 'Existing Home Sales',
      event_type: 'Monthly Housing Market Data (10:00 AM ET) - Real Estate Health',
      confirmed: true,
      auto_generated: true
    },
    {
      date: formatDate(nextWednesday),
      ticker: 'PMI',
      company_name: 'Flash PMI Manufacturing',
      event_type: 'Manufacturing Activity Preliminary (9:45 AM ET) - Factory Health',
      confirmed: true,
      auto_generated: true
    },
    {
      date: formatDate(nextThursday),
      ticker: 'CLAIMS',
      company_name: 'Initial Jobless Claims',
      event_type: 'Weekly Unemployment Claims (8:30 AM ET) - Labor Market Health', 
      confirmed: true,
      auto_generated: true
    },
    {
      date: formatDate(nextFriday),
      ticker: 'MICH',
      company_name: 'University of Michigan Consumer Sentiment',
      event_type: 'Consumer Confidence Preliminary (10:00 AM ET) - Outlook Gauge',
      confirmed: true,
      auto_generated: true
    }
  ];
};

export async function POST(request: NextRequest) {
  try {
    const db = await getFirestore();
    
    console.log('🔄 Starting automatic economic calendar update...');
    
    // Calculate date range for cleanup (remove old auto-generated events)
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);
    
    // Clean up old auto-generated economic events
    const oldEventsQuery = await db
      .collection('earnings_calendar')
      .where('auto_generated', '==', true)
      .where('date', '<', twoWeeksAgo.toISOString().split('T')[0])
      .get();
    
    const batch = db.batch();
    let deletedCount = 0;
    
    oldEventsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    // Get new economic events for this week and next week
    const newEvents = getEconomicEventsForWeeks();
    let addedCount = 0;
    
    // Check for duplicates and add new events
    for (const event of newEvents) {
      const existingQuery = await db
        .collection('earnings_calendar')
        .where('date', '==', event.date)
        .where('ticker', '==', event.ticker)
        .where('auto_generated', '==', true)
        .get();
      
      if (existingQuery.empty) {
        const docRef = db.collection('earnings_calendar').doc();
        batch.set(docRef, {
          ...event,
          created_at: new Date(),
          updated_at: new Date()
        });
        addedCount++;
        console.log(`➕ Adding: ${event.date} - ${event.company_name} (${event.ticker})`);
      } else {
        console.log(`⏭️  Skipping duplicate: ${event.date} - ${event.company_name} (${event.ticker})`);
      }
    }
    
    await batch.commit();
    
    const summary = {
      success: true,
      deleted_old_events: deletedCount,
      added_new_events: addedCount,
      total_events_processed: newEvents.length,
      update_timestamp: new Date().toISOString(),
      message: `Economic calendar updated: ${addedCount} events added, ${deletedCount} old events removed`
    };
    
    console.log('✅ Economic calendar update completed:', summary);
    
    return NextResponse.json(summary);
    
  } catch (error) {
    console.error('❌ Error updating economic calendar:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        update_timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Allow GET requests for manual triggers
export async function GET(request: NextRequest) {
  // Check for authorization (you might want to add API key validation)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Redirect to POST method
  return POST(request);
} 