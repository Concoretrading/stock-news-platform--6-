import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const { testDates } = await request.json();
    
    if (!testDates || !Array.isArray(testDates)) {
      return NextResponse.json({ error: 'Please provide testDates array' }, { status: 400 });
    }
    
    const results = [];
    
    for (const dateStr of testDates) {
      let parsedDate = null;
      let error = null;
      
      try {
        // Handle MM/DD/YY format specifically to avoid timezone issues
        if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(dateStr)) {
          const [month, day, year] = dateStr.split('/')
          const fullYear = year.length === 2 ? '20' + year : year
          // Create date in local timezone to avoid UTC conversion
          parsedDate = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day))
          
          // Format the result as YYYY-MM-DD
          const formattedYear = parsedDate.getFullYear();
          const formattedMonth = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const formattedDay = String(parsedDate.getDate()).padStart(2, '0');
          const formattedDate = `${formattedYear}-${formattedMonth}-${formattedDay}`;
          
          results.push({
            input: dateStr,
            parsed: parsedDate.toISOString(),
            formatted: formattedDate,
            components: {
              month: formattedMonth,
              day: formattedDay,
              year: formattedYear,
              originalMonth: parseInt(month),
              originalDay: parseInt(day)
            },
            success: true
          });
        } else {
          error = 'Date format not recognized as MM/DD/YY';
          results.push({
            input: dateStr,
            error: error,
            success: false
          });
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        results.push({
          input: dateStr,
          error: error,
          success: false
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      results: results,
      summary: {
        total: testDates.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Test date parsing error:', error)
    return NextResponse.json({ 
      error: 'Failed to test date parsing', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 