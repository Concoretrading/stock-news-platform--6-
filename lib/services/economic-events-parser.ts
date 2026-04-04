import economicEvents from '../economic_events.json';

export interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  event: string;
  country: string;
  currency: string;
  actual?: string | null;
  forecast?: string | null;
  previous?: string | null;
  iconUrl?: string;
  type: 'economic';
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
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
    
    if (columns.length < 1) continue; // Skip empty lines
    
    try {
      const firstColumn = columns[0];
      
      // Check if this is a day header (e.g., "TUESDAY, JULY 15")
      if (firstColumn.includes(',') && (firstColumn.includes('JULY') || firstColumn.includes('JUNE') || firstColumn.includes('AUGUST') || firstColumn.includes('JANUARY') || firstColumn.includes('FEBRUARY') || firstColumn.includes('MARCH') || firstColumn.includes('APRIL') || firstColumn.includes('MAY') || firstColumn.includes('SEPTEMBER') || firstColumn.includes('OCTOBER') || firstColumn.includes('NOVEMBER') || firstColumn.includes('DECEMBER'))) {
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
        
        // If no event name found in columns, try to extract from the line
        if (!eventName && columns.length > 1) {
          eventName = columns[1]; // Use second column as event name
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
          // Map event to icon
          const iconUrl = mapEventToIcon(eventName);
          
          const economicEvent: EconomicEvent = {
            id: `economic_${Date.now()}_${i}`,
            date: currentDate,
            time: timeStrFormatted,
            event: eventName,
            country: 'US',
            currency: 'USD',
            forecast: expectations || null,
            iconUrl: iconUrl || undefined,
            type: 'economic',
            importance: determineImportance(eventName)
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
    if (dateTimeStr.includes(',') && (dateTimeStr.includes('JULY') || dateTimeStr.includes('JANUARY') || dateTimeStr.includes('FEBRUARY') || dateTimeStr.includes('MARCH') || dateTimeStr.includes('APRIL') || dateTimeStr.includes('MAY') || dateTimeStr.includes('JUNE') || dateTimeStr.includes('AUGUST') || dateTimeStr.includes('SEPTEMBER') || dateTimeStr.includes('OCTOBER') || dateTimeStr.includes('NOVEMBER') || dateTimeStr.includes('DECEMBER'))) {
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
  const highImportanceEvents = [
    'cpi', 'consumer price index', 'fomc', 'federal reserve', 'non-farm payrolls', 'nfp',
    'gdp', 'retail sales', 'unemployment rate', 'fed', 'federal open market committee'
  ];
  
  // Medium importance events
  const mediumImportanceEvents = [
    'ppi', 'producer price index', 'housing starts', 'industrial production', 'consumer confidence',
    'ism', 'pmi', 'beige book', 'minutes', 'speech'
  ];
  
  // Check for high importance events
  for (const highEvent of highImportanceEvents) {
    if (eventLower.includes(highEvent)) {
      return 'HIGH';
    }
  }
  
  // Check for medium importance events
  for (const mediumEvent of mediumImportanceEvents) {
    if (eventLower.includes(mediumEvent)) {
      return 'MEDIUM';
    }
  }
  
  // Default to low importance
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