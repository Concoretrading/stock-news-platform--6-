import economicEvents from '../economic_events.json';

export interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  event: string;
  country: string;
  currency: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  actual?: string | null;
  forecast?: string | null;
  previous?: string | null;
  iconUrl?: string;
  type: 'economic';
}

export function parseMarketWatchData(rawData: string): EconomicEvent[] {
  const lines = rawData.trim().split('\n');
  const events: EconomicEvent[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by tabs or multiple spaces
    const columns = line.split(/\t+/).map(col => col.trim()).filter(col => col);
    
    if (columns.length < 4) continue; // Skip invalid lines
    
    try {
      // Parse date and time
      const dateTimeStr = columns[0];
      const dateTime = parseDateTime(dateTimeStr);
      
      if (!dateTime) continue;
      
      // Parse event details
      const event = columns[1] || '';
      const country = columns[2] || '';
      const currency = columns[3] || '';
      
      // Determine importance based on event type
      const importance = determineImportance(event);
      
      // Parse actual/forecast/previous if available (only include if not empty)
      const actual = columns[4]?.trim() || null;
      const forecast = columns[5]?.trim() || null;
      const previous = columns[6]?.trim() || null;
      
      // Map event to icon
      const iconUrl = mapEventToIcon(event);
      
      const economicEvent: EconomicEvent = {
        id: `economic_${Date.now()}_${i}`,
        date: dateTime.date,
        time: dateTime.time,
        event,
        country,
        currency,
        importance,
        actual,
        forecast,
        previous,
        iconUrl,
        type: 'economic'
      };
      
      events.push(economicEvent);
    } catch (error) {
      console.error(`Error parsing line ${i + 1}:`, error);
      continue;
    }
  }
  
  return events;
}

function parseDateTime(dateTimeStr: string): { date: string; time: string } | null {
  try {
    // Handle various date formats from MarketWatch
    let date: Date;
    
    // Try different date formats
    if (dateTimeStr.includes(',')) {
      // Format: "Monday, Jan 15, 2024 8:30 AM"
      date = new Date(dateTimeStr);
    } else if (dateTimeStr.includes('/')) {
      // Format: "1/15/2024 8:30 AM"
      date = new Date(dateTimeStr);
    } else {
      // Try ISO format or other formats
      date = new Date(dateTimeStr);
    }
    
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];
    
    // Format time as HH:MM
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    return { date: dateStr, time: timeStr };
  } catch (error) {
    console.error('Error parsing date/time:', dateTimeStr, error);
    return null;
  }
}

function determineImportance(event: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const eventLower = event.toLowerCase();
  
  // High importance events
  const highImportance = [
    'non-farm payrolls', 'unemployment rate', 'cpi', 'ppi', 'gdp',
    'fomc', 'federal reserve', 'fed', 'interest rate', 'beige book',
    'retail sales', 'housing starts', 'consumer confidence',
    'ism manufacturing', 'ism services', 'industrial production'
  ];
  
  // Medium importance events
  const mediumImportance = [
    'jobless claims', 'pce', 'trade balance', 'manufacturing',
    'services', 'construction', 'durable goods', 'personal income',
    'personal spending', 'business inventories', 'capacity utilization'
  ];
  
  for (const highEvent of highImportance) {
    if (eventLower.includes(highEvent)) {
      return 'HIGH';
    }
  }
  
  for (const mediumEvent of mediumImportance) {
    if (eventLower.includes(mediumEvent)) {
      return 'MEDIUM';
    }
  }
  
  return 'LOW';
}

function mapEventToIcon(event: string): string | undefined {
  const eventLower = event.toLowerCase();
  
  // Map event types to icons from economic_events.json
  for (const iconData of economicEvents) {
    if (eventLower.includes(iconData.event.toLowerCase())) {
      return iconData.iconUrl;
    }
  }
  
  // Default icon for unmapped events
  return '/images/econ/default.png';
}

export function validateMarketWatchData(rawData: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = rawData.trim().split('\n');
  
  if (lines.length === 0) {
    errors.push('No data provided');
    return { isValid: false, errors };
  }
  
  let validLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(/\t+/).map(col => col.trim()).filter(col => col);
    
    if (columns.length < 4) {
      errors.push(`Line ${i + 1}: Insufficient columns (expected 4+, got ${columns.length})`);
      continue;
    }
    
    const dateTimeStr = columns[0];
    const parsedDateTime = parseDateTime(dateTimeStr);
    
    if (!parsedDateTime) {
      errors.push(`Line ${i + 1}: Invalid date/time format: "${dateTimeStr}"`);
      continue;
    }
    
    validLines++;
  }
  
  if (validLines === 0) {
    errors.push('No valid data lines found');
  }
  
  return {
    isValid: validLines > 0,
    errors
  };
} 