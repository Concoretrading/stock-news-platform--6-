const fetch = require('node-fetch');
const readline = require('readline');

// List of earnings events to upload
const events = [
  { stockTicker: 'FAST', companyName: 'Fastenal', earningsDate: '2024-07-14', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'JPM', companyName: 'JP Morgan Chase & Co.', earningsDate: '2024-07-15', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'BLK', companyName: 'BlackRock', earningsDate: '2024-07-15', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'C', companyName: 'Citi', earningsDate: '2024-07-15', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'BK', companyName: 'BNY Mellon', earningsDate: '2024-07-15', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'ASML', companyName: 'ASML', earningsDate: '2024-07-16', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'JNJ', companyName: 'Johnson & Johnson', earningsDate: '2024-07-16', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'GS', companyName: 'Goldman Sachs', earningsDate: '2024-07-16', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'BAC', companyName: 'Bank of America', earningsDate: '2024-07-16', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'TMUS', companyName: 'T-Mobile', earningsDate: '2024-07-16', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'MS', companyName: 'Morgan Stanley', earningsDate: '2024-07-16', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'UAL', companyName: 'United Airlines', earningsDate: '2024-07-16', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'NFLX', companyName: 'Netflix', earningsDate: '2024-07-17', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'IBKR', companyName: 'Interactive Brokers', earningsDate: '2024-07-17', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'ABT', companyName: 'Abbott', earningsDate: '2024-07-17', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'CTAS', companyName: 'Cintas', earningsDate: '2024-07-17', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'ELV', companyName: 'Elevance Health', earningsDate: '2024-07-17', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'USB', companyName: 'US Bank', earningsDate: '2024-07-17', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'TRV', companyName: 'Travelers', earningsDate: '2024-07-17', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'AXP', companyName: 'American Express', earningsDate: '2024-07-18', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'SCHW', companyName: 'Charles Schwab', earningsDate: '2024-07-18', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'MMM', companyName: '3M', earningsDate: '2024-07-18', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'SLB', companyName: 'Schlumberger', earningsDate: '2024-07-18', earningsType: 'BMO', isConfirmed: true },
  { stockTicker: 'ALLY', companyName: 'Ally Financial', earningsDate: '2024-07-18', earningsType: 'BMO', isConfirmed: true },
];

const API_URL = 'http://localhost:3000/api/save-earnings'; // Change to your deployed URL if needed

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Enter your Firebase ID token: ', async (token) => {
    rl.close();
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ events })
      });
      const data = await res.json();
      if (res.ok) {
        console.log('✅ Successfully uploaded earnings events:', data);
      } else {
        console.error('❌ Failed to upload:', data);
      }
    } catch (err) {
      console.error('❌ Error:', err);
    }
  });
}

main(); 