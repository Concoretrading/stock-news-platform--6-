import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';

interface ProcessedEvent {
  date: string;
  time: string;
  event_name: string;
  description: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
}

// AI-powered text processing function
function parseEconomicEventsText(text: string): ProcessedEvent[] {
  const events: ProcessedEvent[] = [];
  const lines = text.split('\n');
  
  let currentDate = '';
  let currentYear = new Date().getFullYear();
  
  // Month mapping
  const monthMap: { [key: string]: string } = {
    'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
    'MAY': '05', 'JUNE': '06', 'JULY': '07', 'AUGUST': '08',
    'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12'
  };

  // High importance indicators
  const highImportanceKeywords = [
    'CPI', 'Consumer Price Index', 'PPI', 'Producer Price Index',
    'Fed', 'FOMC', 'Federal Reserve', 'Beige Book', 'Interest Rate',
    'Retail Sales', 'Jobless Claims', 'Unemployment', 'GDP',
    'Non-Farm Payrolls', 'Payrolls'
  ];

  // Medium importance indicators  
  const mediumImportanceKeywords = [
    'Empire State', 'Philadelphia Fed', 'Manufacturing',
    'Housing', 'Industrial Production', 'Business Inventories',
    'Consumer Sentiment', 'Capacity Utilization'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and headers
    if (!line || line.includes('Time (ET)') || line.includes('Report') || line.includes('Period') || line.includes('Actual') || line.includes('Forecast')) {
      continue;
    }
    
    // Check for date headers (e.g., "TUESDAY, JULY 15")
    const dateMatch = line.match(/^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY),?\s+([A-Z]+)\s+(\d{1,2})/i);
    if (dateMatch) {
      const [, dayOfWeek, month, day] = dateMatch;
      const monthNum = monthMap[month.toUpperCase()];
      if (monthNum) {
        currentDate = `${currentYear}-${monthNum}-${day.padStart(2, '0')}`;
      }
      continue;
    }

    // Check for "None scheduled" 
    if (line.toLowerCase().includes('none scheduled')) {
      continue;
    }

    // Parse event lines - handle both tab-separated and space-separated formats
    // Try tab-separated first (MarketWatch format)
    const tabSeparated = line.split('\t');
    if (tabSeparated.length >= 2 && currentDate) {
      const timeMatch = tabSeparated[0].match(/^(\d{1,2}:\d{2}\s*(?:am|pm))/i);
      if (timeMatch) {
        const time = timeMatch[1];
        const eventName = tabSeparated[1] || '';
        const period = tabSeparated[2] || '';
        const additional = tabSeparated.slice(3).join(' ') || '';
        
        let cleanEventName = eventName.trim();
        let description = [period, additional].filter(Boolean).join(' - ');

        // Handle specific event types
        if (cleanEventName.toLowerCase().includes('consumer price index') || cleanEventName.toLowerCase() === 'cpi') {
          cleanEventName = 'Consumer Price Index (CPI)';
          description = description || 'Monthly inflation data - Major market mover';
        } else if (cleanEventName.toLowerCase().includes('cpi year over year')) {
          cleanEventName = 'Consumer Price Index (CPI) YoY';
          description = description || 'Annual inflation rate - Major market mover';
        } else if (cleanEventName.toLowerCase().includes('producer price index') || cleanEventName.toLowerCase() === 'ppi') {
          cleanEventName = 'Producer Price Index (PPI)';
          description = description || 'Producer inflation data - Inflation pipeline indicator';
        } else if (cleanEventName.toLowerCase().includes('core cpi')) {
          cleanEventName = 'Core Consumer Price Index';
          description = description || 'Core inflation excluding food and energy';
        } else if (cleanEventName.toLowerCase().includes('core ppi')) {
          cleanEventName = 'Core Producer Price Index';
          description = description || 'Core producer inflation excluding food and energy';
        } else if (cleanEventName.toLowerCase().includes('fed beige book') || cleanEventName.toLowerCase() === 'fed beige book') {
          cleanEventName = 'Fed Beige Book';
          description = 'Federal Reserve economic conditions report - Major market mover';
        } else if (cleanEventName.toLowerCase().includes('jobless claims') || cleanEventName.toLowerCase().includes('initial jobless')) {
          cleanEventName = 'Initial Jobless Claims';
          description = description || 'Weekly unemployment claims - Labor market health';
        } else if (cleanEventName.toLowerCase().includes('retail sales')) {
          cleanEventName = 'Retail Sales';
          description = description || 'Monthly consumer spending - Major economic indicator';
        } else if (cleanEventName.toLowerCase().includes('housing starts')) {
          cleanEventName = 'Housing Starts';
          description = description || 'New home construction - Major housing indicator';
        } else if (cleanEventName.toLowerCase().includes('building permits')) {
          cleanEventName = 'Building Permits';
          description = description || 'Future construction activity - Housing pipeline';
        } else if (cleanEventName.toLowerCase().includes('empire state')) {
          cleanEventName = 'Empire State Manufacturing Survey';
          description = description || 'NY regional manufacturing activity';
        } else if (cleanEventName.toLowerCase().includes('philadelphia fed')) {
          cleanEventName = 'Philadelphia Fed Manufacturing Survey';
          description = description || 'Regional manufacturing activity index';
        } else if (cleanEventName.toLowerCase().includes('consumer sentiment')) {
          cleanEventName = 'University of Michigan Consumer Sentiment';
          description = description || 'Consumer confidence and economic outlook';
        } else if (cleanEventName.toLowerCase().includes('industrial production')) {
          cleanEventName = 'Industrial Production';
          description = description || 'Manufacturing output and factory production';
        } else if (cleanEventName.toLowerCase().includes('capacity utilization')) {
          cleanEventName = 'Capacity Utilization';
          description = description || 'Manufacturing capacity usage rate';
        } else if (cleanEventName.toLowerCase().includes('business inventories')) {
          cleanEventName = 'Business Inventories';
          description = description || 'Corporate inventory levels - Supply chain data';
        }

        // Determine importance
        let importance: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        const eventText = `${cleanEventName} ${description}`.toLowerCase();
        
        if (highImportanceKeywords.some(keyword => eventText.includes(keyword.toLowerCase()))) {
          importance = 'HIGH';
        } else if (mediumImportanceKeywords.some(keyword => eventText.includes(keyword.toLowerCase()))) {
          importance = 'MEDIUM';
        }

        events.push({
          date: currentDate,
          time: time.toLowerCase(),
          event_name: cleanEventName,
          description: description || 'Economic indicator release',
          importance
        });
        continue;
      }
    }

    // Fallback to space-separated parsing for other formats
    const spaceMatch = line.match(/^(\d{1,2}:\d{2}\s*(?:am|pm))\s+(.+?)(?:\s+([A-Za-z]+))?\s*(?:\s+(.+))?$/i);
    if (spaceMatch && currentDate) {
      const [, time, eventName, period, additional] = spaceMatch;
      
      let cleanEventName = eventName.trim();
      let description = '';
      
      if (additional) {
        description = `${period || ''} ${additional}`.trim();
      } else if (period) {
        description = period;
      }

      // Apply same event type handling as above
      if (cleanEventName.toLowerCase().includes('consumer price index') || cleanEventName.toLowerCase().includes('cpi')) {
        cleanEventName = 'Consumer Price Index (CPI)';
        description = description || 'Monthly inflation data - Major market mover';
      }
      // ... (same event type handling as tab-separated)

      let importance: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      const eventText = `${cleanEventName} ${description}`.toLowerCase();
      
      if (highImportanceKeywords.some(keyword => eventText.includes(keyword.toLowerCase()))) {
        importance = 'HIGH';
      } else if (mediumImportanceKeywords.some(keyword => eventText.includes(keyword.toLowerCase()))) {
        importance = 'MEDIUM';
      }

      events.push({
        date: currentDate,
        time: time.toLowerCase(),
        event_name: cleanEventName,
        description: description || 'Economic indicator release',
        importance
      });
    }
  }

  return events;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    // Process the text to extract events
    const extractedEvents = parseEconomicEventsText(text);

    if (extractedEvents.length === 0) {
      return NextResponse.json(
        { error: 'No economic events found in the provided text' },
        { status: 400 }
      );
    }

    // Save events to Firebase
    const db = await getFirestore();
    const batch = db.batch();
    let addedCount = 0;
    let skippedCount = 0;

    for (const event of extractedEvents) {
      // Check for duplicates in economic_events collection
      const existingQuery = await db
        .collection('economic_events')
        .where('date', '==', event.date)
        .where('company_name', '==', event.event_name)
        .get();

      if (existingQuery.empty) {
        const docRef = db.collection('economic_events').doc();
        batch.set(docRef, {
          date: event.date,
          ticker: event.event_name.replace(/\s+/g, '_').toUpperCase(),
          company_name: event.event_name,
          event_type: `${event.description} (${event.time})`,
          confirmed: true,
          auto_generated: false, // Manually added via admin
          created_at: new Date(),
          updated_at: new Date(),
          importance: event.importance
        });
        addedCount++;
      } else {
        skippedCount++;
      }
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      events: extractedEvents,
      message: `Successfully processed ${extractedEvents.length} events. Added ${addedCount} new events, skipped ${skippedCount} duplicates.`,
      addedCount,
      skippedCount,
      totalProcessed: extractedEvents.length
    });

  } catch (error) {
    console.error('Error processing economic events:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process economic events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 