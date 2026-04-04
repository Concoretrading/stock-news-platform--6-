# Logo Fetching Script

This script automatically fetches company logos for all tickers in your `lib/tickers.json` file.

## Features

- **Automatic Logo Fetching**: Uses Clearbit's free logo API to fetch high-quality company logos
- **Smart Domain Mapping**: Includes a comprehensive mapping of ticker symbols to company domains
- **Image Optimization**: Resizes and optimizes logos to 64x64px for perfect calendar display
- **Batch Processing**: Processes all tickers efficiently with progress tracking
- **Error Handling**: Gracefully handles failed downloads and continues processing

## Usage

```bash
# Run the script
node scripts/fetch-logos.js

# Or make it executable and run directly
chmod +x scripts/fetch-logos.js
./scripts/fetch-logos.js
```

## What it does

1. **Creates logos directory**: `public/images/logos/`
2. **Downloads logos**: From Clearbit API using company domains
3. **Resizes images**: To 64x64px with white background
4. **Updates tickers.json**: Adds `logoUrl` field to each ticker
5. **Provides summary**: Shows success/error counts

## Output

- **Logos saved**: `public/images/logos/[ticker].png`
- **Updated file**: `lib/tickers.json` with `logoUrl` fields
- **Console output**: Progress and summary statistics

## Dependencies

- `canvas`: For image processing and resizing
- Built-in Node.js modules: `fs`, `path`, `https`

## Notes

- Skips tickers that already have `logoUrl` fields
- Includes 100ms delay between requests to be respectful to the API
- Comprehensive domain mapping for major companies
- Fallback domain generation for companies not in the mapping

## Example Output

```
✅ Created logos directory: /path/to/public/images/logos
📊 Loaded 355 tickers
🚀 Starting logo fetch process...
⏭️  Skipping AAPL (already has logo)
📥 Fetching logo for UNH (UnitedHealth Group Inc.)...
✅ Successfully processed UNH
📥 Fetching logo for HD (Home Depot Inc.)...
✅ Successfully processed HD

📊 Summary:
✅ Successfully processed: 345
❌ Errors: 10
⏭️  Skipped (already had logos): 10
📁 Logos saved to: /path/to/public/images/logos
📄 Updated: /path/to/lib/tickers.json
``` 