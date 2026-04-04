// Test the date parsing logic from the admin upload
function tryParseDate(str) {
  // Try ISO, MM/DD/YY, MM/DD/YYYY, YYYY-MM-DD, MMM DD YYYY, etc.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str);
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) {
    const [m, d, y] = str.split('/');
    let year = y.length === 2 ? '20' + y : y;
    return new Date(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  }
  if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[ .-]?\d{1,2}[,]?[ .-]?\d{2,4}?$/i.test(str)) {
    // e.g. Jul 23 2025, July 23, 2025
    return new Date(str);
  }
  // Try Date.parse fallback
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
}

// Test various date formats that might have been used
const testDates = [
  '8/1/25',
  '8/1/2025',
  '08/01/25',
  '08/01/2025',
  'Aug 1 2025',
  'August 1 2025',
  'Aug 1, 2025',
  'August 1, 2025',
  '8-1-25',
  '8-1-2025',
  '2025-08-01',
  '1/8/25',
  '1/8/2025',
  '8/2/25',
  '8/3/25',
  '8/4/25',
  '8/5/25',
  '8/6/25',
  '8/7/25',
  '8/8/25',
  '8/9/25',
  '8/10/25',
  '8/11/25',
  '8/12/25',
  '8/13/25',
  '8/14/25',
  '8/15/25',
  '8/16/25',
  '8/17/25',
  '8/18/25',
  '8/19/25',
  '8/20/25',
  '8/21/25',
  '8/22/25',
  '8/23/25',
  '8/24/25',
  '8/25/25',
  '8/26/25',
  '8/27/25',
  '8/28/25',
  '8/29/25',
  '8/30/25',
  '8/31/25'
];

console.log('Testing date parsing for August 2025:');
testDates.forEach(dateStr => {
  const parsed = tryParseDate(dateStr);
  if (parsed) {
    console.log(`✅ "${dateStr}" -> ${parsed.toISOString().split('T')[0]}`);
  } else {
    console.log(`❌ "${dateStr}" -> FAILED`);
  }
});

// Test some common earnings format examples
console.log('\nTesting earnings format examples:');
const earningsExamples = [
  'AAPL 8/1/25 AMC',
  'MSFT 8/2/25 BMO',
  'GOOGL 8/3/25',
  'NVDA 8/4/25 AMC',
  'TSLA 8/5/25 BMO',
  'META 8/6/25',
  'AMZN 8/7/25 AMC',
  'NFLX 8/8/25 BMO'
];

earningsExamples.forEach(example => {
  const parts = example.split(/\s+/);
  const ticker = parts[0];
  const dateStr = parts[1];
  const timing = parts[2] || 'AMC';
  
  const parsed = tryParseDate(dateStr);
  if (parsed) {
    console.log(`✅ "${example}" -> ${ticker} ${parsed.toISOString().split('T')[0]} ${timing}`);
  } else {
    console.log(`❌ "${example}" -> FAILED`);
  }
}); 