import { polygonDataProvider } from '../lib/services/polygon-data-provider';
import { localDBService } from '../lib/services/local-db-service';
import { format, subYears, addDays, isBefore } from 'date-fns';

/**
 * SPX Historical Harvest (Day 1)
 * Downloads 2 years of 1m bars into the Local SSD Library.
 * Logic: "The high-fidelity fuel for the Predator's brain."
 */
async function harvest() {
    const symbol = 'SPY'; // Using SPY to map price action (Hybrid Method)
    const endDate = new Date();
    const startDate = addDays(endDate, -30);

    console.log(`🚀 STARTING 1-MONTH HARVEST FOR ${symbol}...`);
    console.log(`📅 Range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}\n`);

    try {
        await localDBService.connect();

        let currentStart = startDate;
        let totalBars = 0;

        // Polygon API for aggregates has limits per call, so we loop monthly or weekly
        while (isBefore(currentStart, endDate)) {
            const batchEnd = addDays(currentStart, 30);
            const fromStr = format(currentStart, 'yyyy-MM-dd');
            const toStr = format(isBefore(batchEnd, endDate) ? batchEnd : endDate, 'yyyy-MM-dd');

            console.log(`📡 Fetching batch: ${fromStr} -> ${toStr}...`);

            // Note: 1 minute bars for 2 years is roughly 200k-500k data points
            const bars = await polygonDataProvider.getHistoricalData(symbol, '1', fromStr, toStr);

            if (bars && bars.length > 0) {
                console.log(`📥 Received ${bars.length} bars. Saving to Local SSD...`);

                await localDBService.transaction(async (tx) => {
                    for (const bar of bars) {
                        await tx.query(`
                            INSERT INTO historical_bars (ticker, timeframe, timestamp, open, high, low, close, volume, vwap)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                            ON CONFLICT (ticker, timeframe, timestamp) DO UPDATE SET
                                open = EXCLUDED.open,
                                high = EXCLUDED.high,
                                low = EXCLUDED.low,
                                close = EXCLUDED.close,
                                volume = EXCLUDED.volume,
                                vwap = EXCLUDED.vwap
                        `, [
                            'SPX',
                            '1m',
                            new Date(bar.t).toISOString(),
                            bar.o, bar.h, bar.l, bar.c, bar.v, bar.vw || null
                        ]);
                    }
                });

                totalBars += bars.length;
                console.log(`✅ Batch complete. Cumulative: ${totalBars} bars.`);
            } else {
                console.log(`⚠️ No bars returned for this batch.`);
            }

            // Move to next batch (overlap by 1 day to ensure no gaps)
            currentStart = addDays(batchEnd, 1);

            // Rate limit breathing room (Polygon Free has 5/min, Paid is much higher)
            // If the user has a paid key, we can go much faster.
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`\n🏆 HARVEST COMPLETE! Total Bars Captured: ${totalBars}`);
        console.log(`📂 Your Local Library is now populated.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ HARVEST FAILED:', error);
        process.exit(1);
    }
}

harvest();
