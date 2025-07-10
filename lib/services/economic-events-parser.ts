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
  let currentDate = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by tabs or multiple spaces
    const columns = line.split(/\t+/).map(col => col.trim()).filter(col => col);
    
    if (columns.length < 2) continue; // Skip invalid lines
    
    try {
      const firstColumn = columns[0];
      
      // Check if this is a day header (e.g., "TUESDAY, JULY 15")
      if (firstColumn.includes(',') && (firstColumn.includes('JULY') || firstColumn.includes('JUNE') || firstColumn.includes('AUGUST'))) {
        const dateTime = parseDateTime(firstColumn);
        if (dateTime) {
          currentDate = dateTime.date;
          console.log(`📅 Set current date to: ${currentDate} from: ${firstColumn}`);
        }
        continue; // Skip day headers as events
      }
      
      // If we have a current date and this looks like an event line
      if (currentDate && (firstColumn.includes('am') || firstColumn.includes('pm'))) {
        console.log(`📊 Processing event: ${firstColumn} for date: ${currentDate}`);
        
        // Parse time
        const timeStr = firstColumn;
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
        let hours = 0, minutes = 0;
        
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          minutes = parseInt(timeMatch[2]);
          const period = timeMatch[3].toLowerCase();
          
          if (period === 'pm' && hours !== 12) hours += 12;
          if (period === 'am' && hours === 12) hours = 0;
        }
        
        const timeStrFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Find event name and expectations
        let eventName = '';
        let expectations = '';
        
        // Look for event name (skip time column)
        for (let j = 1; j < columns.length; j++) {
          const col = columns[j];
          if (col && !col.includes('%') && !col.match(/^-?\d+\.?\d*$/)) {
            eventName = col;
            break;
          }
        }
        
        // Look for expectations (numbers with % or decimal values)
        for (let j = 1; j < columns.length; j++) {
          const col = columns[j];
          if (col && (col.includes('%') || col.match(/^-?\d+\.?\d*$/))) {
            expectations = col;
            break;
          }
        }
        
        if (eventName) {
          // Determine importance based on event type
          const importance = determineImportance(eventName);
          
          // Map event to icon
          const iconUrl = mapEventToIcon(eventName);
          
          const economicEvent: EconomicEvent = {
            id: `economic_${Date.now()}_${i}`,
            date: currentDate,
            time: timeStrFormatted,
            event: eventName,
            country: 'US',
            currency: 'USD',
            importance,
            actual: null,
            forecast: expectations || null,
            previous: null,
            iconUrl,
            type: 'economic'
          };
          
          events.push(economicEvent);
        }
      }
    } catch (error) {
      console.error(`Error parsing line ${i + 1}:`, error);
      continue;
    }
  }
  
  return events;
}

function parseDateTime(dateTimeStr: string): { date: string; time: string } | null {
  try {
    // Handle MarketWatch format: "MONDAY, JULY 14" or "8:30 am"
    let date: Date;
    const currentYear = new Date().getFullYear();
    
    // Check if it's a day header (e.g., "MONDAY, JULY 14")
    if (dateTimeStr.includes(',') && dateTimeStr.includes('JULY')) {
      // Extract month and day from "MONDAY, JULY 14"
      const parts = dateTimeStr.split(',');
      const monthDay = parts[1]?.trim(); // "JULY 14"
      
      if (monthDay) {
        // Create date string with current year
        const dateString = `${monthDay} ${currentYear}`;
        date = new Date(dateString);
      } else {
        return null;
      }
    } else if (dateTimeStr.includes('am') || dateTimeStr.includes('pm')) {
      // This is a time, not a date - we need to get the date from context
      // For now, use today's date
      date = new Date();
      const timeMatch = dateTimeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toLowerCase();
        
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        date.setHours(hours, minutes, 0, 0);
      }
    } else {
      // Try other date formats
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
    
    // Check if this is a day header (e.g., "TUESDAY, JULY 15")
    if (columns.length === 1 && columns[0].includes(',') && (columns[0].includes('JULY') || columns[0].includes('JUNE') || columns[0].includes('AUGUST'))) {
      validLines++;
      continue;
    }
    
    // For event lines, we need at least 1 column (time)
    if (columns.length < 1) {
      errors.push(`Line ${i + 1}: No data found`);
      continue;
    }
    
    // Check if first column is a time (e.g., "8:30 am")
    const timeStr = columns[0];
    if (!timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i)) {
      // Skip lines that don't look like time-based events
      continue;
    }
    
    validLines++;
  }
  
  if (validLines === 0) {
    errors.push('No valid event lines found. Make sure you have time-based events (e.g., "8:30 am")');
  }
  
  return {
    isValid: validLines > 0,
    errors
  };
} 