const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testEconomicEventsUpload() {
  const testData = `Monday, Jan 15, 2024 8:30 AM	Consumer Price Index	United States	USD	0.3%	0.2%	0.1%
Monday, Jan 15, 2024 10:00 AM	Retail Sales	United States	USD	0.4%	0.3%	0.2%
Tuesday, Jan 16, 2024 8:30 AM	Initial Jobless Claims	United States	USD	210K	215K	218K
Wednesday, Jan 17, 2024 2:00 PM	Fed Beige Book	United States	USD		
Thursday, Jan 18, 2024 8:30 AM	Housing Starts	United States	USD	1.35M	1.32M	1.30M`;

  try {
    console.log('Testing economic events upload...');
    
    const response = await fetch('http://localhost:3001/api/process-economic-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rawData: testData })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload successful!');
      console.log('Message:', result.message);
      console.log('Events processed:', result.events?.length || 0);
      
      if (result.events) {
        console.log('\nProcessed events:');
        result.events.forEach((event, index) => {
          console.log(`${index + 1}. ${event.event} on ${event.date} at ${event.time} (${event.importance})`);
        });
      }
    } else {
      console.log('❌ Upload failed:');
      console.log('Error:', result.error);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testEconomicEventsUpload(); 