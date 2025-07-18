"use client"

import { useState, useEffect } from "react"
import { Search, X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addStockToWatchlist, getUserStocks, deleteStock } from '@/lib/firebase-services'

// Comprehensive stocks list with all categories
const ALL_STOCKS = [
  // Technology - FAANG & Mega Cap
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft Corporation" },
  { ticker: "GOOGL", name: "Alphabet Inc. (Class A)" },
  { ticker: "GOOG", name: "Alphabet Inc. (Class C)" },
  { ticker: "AMZN", name: "Amazon.com Inc." },
  { ticker: "META", name: "Meta Platforms Inc." },
  { ticker: "TSLA", name: "Tesla Inc." },
  { ticker: "NVDA", name: "NVIDIA Corporation" },
  { ticker: "NFLX", name: "Netflix Inc." },

  // Enterprise Software & Cloud
  { ticker: "CRM", name: "Salesforce Inc." },
  { ticker: "ORCL", name: "Oracle Corporation" },
  { ticker: "ADBE", name: "Adobe Inc." },
  { ticker: "NOW", name: "ServiceNow Inc." },
  { ticker: "SNOW", name: "Snowflake Inc." },
  { ticker: "WDAY", name: "Workday Inc." },
  { ticker: "VEEV", name: "Veeva Systems Inc." },
  { ticker: "DDOG", name: "Datadog Inc." },
  { ticker: "MDB", name: "MongoDB Inc." },
  { ticker: "SPLK", name: "Splunk Inc." },

  // AI & Machine Learning
  { ticker: "PLTR", name: "Palantir Technologies" },
  { ticker: "AI", name: "C3.ai Inc." },
  { ticker: "PATH", name: "UiPath Inc." },
  { ticker: "SMCI", name: "Super Micro Computer" },
  { ticker: "SOUN", name: "SoundHound AI Inc." },

  // Semiconductors
  { ticker: "AMD", name: "Advanced Micro Devices" },
  { ticker: "INTC", name: "Intel Corporation" },
  { ticker: "QCOM", name: "Qualcomm Inc." },
  { ticker: "AVGO", name: "Broadcom Inc." },
  { ticker: "TXN", name: "Texas Instruments Inc." },
  { ticker: "MU", name: "Micron Technology Inc." },
  { ticker: "TSM", name: "Taiwan Semiconductor" },
  { ticker: "ASML", name: "ASML Holding NV" },

  // Cybersecurity
  { ticker: "CRWD", name: "CrowdStrike Holdings" },
  { ticker: "PANW", name: "Palo Alto Networks" },
  { ticker: "FTNT", name: "Fortinet Inc." },
  { ticker: "ZS", name: "Zscaler Inc." },
  { ticker: "OKTA", name: "Okta Inc." },

  // Fintech & Digital Payments
  { ticker: "SQ", name: "Block Inc." },
  { ticker: "PYPL", name: "PayPal Holdings" },
  { ticker: "SHOP", name: "Shopify Inc." },
  { ticker: "AFRM", name: "Affirm Holdings" },
  { ticker: "SOFI", name: "SoFi Technologies" },
  { ticker: "COIN", name: "Coinbase Global Inc." },
  { ticker: "HOOD", name: "Robinhood Markets Inc." },

  // Cryptocurrency & Blockchain
  { ticker: "MSTR", name: "MicroStrategy Inc." },
  { ticker: "RIOT", name: "Riot Platforms Inc." },
  { ticker: "MARA", name: "Marathon Digital Holdings" },

  // Electric Vehicles & Clean Energy
  { ticker: "RIVN", name: "Rivian Automotive Inc." },
  { ticker: "LCID", name: "Lucid Group Inc." },
  { ticker: "NIO", name: "NIO Inc." },
  { ticker: "XPEV", name: "XPeng Inc." },
  { ticker: "LI", name: "Li Auto Inc." },

  // Healthcare & Biotech
  { ticker: "JNJ", name: "Johnson & Johnson" },
  { ticker: "PFE", name: "Pfizer Inc." },
  { ticker: "UNH", name: "UnitedHealth Group" },
  { ticker: "ABBV", name: "AbbVie Inc." },
  { ticker: "MRK", name: "Merck & Co Inc." },
  { ticker: "MRNA", name: "Moderna Inc." },
  { ticker: "BNTX", name: "BioNTech SE" },

  // Consumer & Retail
  { ticker: "WMT", name: "Walmart Inc." },
  { ticker: "HD", name: "Home Depot Inc." },
  { ticker: "COST", name: "Costco Wholesale Corp" },
  { ticker: "TGT", name: "Target Corporation" },
  { ticker: "SBUX", name: "Starbucks Corporation" },
  { ticker: "MCD", name: "McDonald's Corporation" },
  { ticker: "NKE", name: "Nike Inc." },
  { ticker: "DIS", name: "Walt Disney Company" },

  // Energy
  { ticker: "XOM", name: "Exxon Mobil Corporation" },
  { ticker: "CVX", name: "Chevron Corporation" },
  { ticker: "COP", name: "ConocoPhillips" },
  { ticker: "SLB", name: "Schlumberger NV" },

  // Industrial
  { ticker: "BA", name: "Boeing Company" },
  { ticker: "CAT", name: "Caterpillar Inc." },
  { ticker: "GE", name: "General Electric Company" },
  { ticker: "MMM", name: "3M Company" },
  { ticker: "HON", name: "Honeywell International" },

  // Communication
  { ticker: "VZ", name: "Verizon Communications" },
  { ticker: "T", name: "AT&T Inc." },
  { ticker: "TMUS", name: "T-Mobile US Inc." },
  { ticker: "CMCSA", name: "Comcast Corporation" },

  // Automotive
  { ticker: "F", name: "Ford Motor Company" },
  { ticker: "GM", name: "General Motors Company" },

  // Financial
  { ticker: "JPM", name: "JPMorgan Chase & Co." },
  { ticker: "BAC", name: "Bank of America Corp" },
  { ticker: "WFC", name: "Wells Fargo & Company" },
  { ticker: "GS", name: "Goldman Sachs Group" },
  { ticker: "MS", name: "Morgan Stanley" },
  { ticker: "V", name: "Visa Inc." },
  { ticker: "MA", name: "Mastercard Inc." },

  // ETFs
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust" },
  { ticker: "QQQ", name: "Invesco QQQ Trust" },
  { ticker: "IWM", name: "iShares Russell 2000 ETF" },
  { ticker: "VTI", name: "Vanguard Total Stock Market" },
  { ticker: "ARKK", name: "ARK Innovation ETF" },
]

// Add more tech, business, and trending stocks not already in the list
const ADDITIONAL_STOCKS = [
  { ticker: "UBER", name: "Uber Technologies Inc." },
  { ticker: "LYFT", name: "Lyft Inc." },
  { ticker: "SNAP", name: "Snap Inc." },
  { ticker: "PINS", name: "Pinterest Inc." },
  { ticker: "SQSP", name: "Squarespace Inc." },
  { ticker: "COUP", name: "Coupa Software Inc." },
  { ticker: "DOCU", name: "DocuSign Inc." },
  { ticker: "ROKU", name: "Roku Inc." },
  { ticker: "TWLO", name: "Twilio Inc." },
  { ticker: "ZM", name: "Zoom Video Communications" },
  { ticker: "PLUG", name: "Plug Power Inc." },
  { ticker: "FSLY", name: "Fastly Inc." },
  { ticker: "NET", name: "Cloudflare Inc." },
  { ticker: "CRSP", name: "CRISPR Therapeutics" },
  { ticker: "BILL", name: "Bill.com Holdings Inc." },
  { ticker: "ROBIN", name: "Robinhood Markets Inc." },
  { ticker: "AFRM", name: "Affirm Holdings Inc." },
  { ticker: "COIN", name: "Coinbase Global Inc." },
  { ticker: "SHOP", name: "Shopify Inc." },
  { ticker: "SPOT", name: "Spotify Technology S.A." },
  { ticker: "DDOG", name: "Datadog Inc." },
  { ticker: "ASAN", name: "Asana Inc." },
  { ticker: "MELI", name: "MercadoLibre Inc." },
  { ticker: "SE", name: "Sea Limited" },
  { ticker: "TEAM", name: "Atlassian Corporation" },
  { ticker: "MDB", name: "MongoDB Inc." },
  { ticker: "OKTA", name: "Okta Inc." },
  { ticker: "ZS", name: "Zscaler Inc." },
  { ticker: "SPLK", name: "Splunk Inc." },
  { ticker: "ESTC", name: "Elastic N.V." },
  { ticker: "HUBS", name: "HubSpot Inc." },
  { ticker: "APPN", name: "Appian Corporation" },
  { ticker: "CFLT", name: "Confluent Inc." },
  { ticker: "PATH", name: "UiPath Inc." },
  { ticker: "SNOW", name: "Snowflake Inc." },
  { ticker: "FVRR", name: "Fiverr International Ltd." },
  { ticker: "UPWK", name: "Upwork Inc." },
  { ticker: "RBLX", name: "Roblox Corporation" },
  { ticker: "COUP", name: "Coupa Software Inc." },
  { ticker: "DOCN", name: "DigitalOcean Holdings Inc." },
  { ticker: "GTLB", name: "GitLab Inc." },
  { ticker: "PLTR", name: "Palantir Technologies Inc." },
  { ticker: "BMBL", name: "Bumble Inc." },
  { ticker: "COUR", name: "Coursera Inc." },
  { ticker: "DUOL", name: "Duolingo Inc." },
  { ticker: "WIX", name: "Wix.com Ltd." },
  { ticker: "ZI", name: "ZoomInfo Technologies Inc." },
  { ticker: "DOCS", name: "Doximity Inc." },
  { ticker: "S", name: "SentinelOne Inc." },
  { ticker: "CLOU", name: "Global X Cloud Computing ETF" },
  { ticker: "ARKG", name: "ARK Genomic Revolution ETF" },
  { ticker: "ARKF", name: "ARK Fintech Innovation ETF" },
  { ticker: "ARKW", name: "ARK Next Generation Internet ETF" },
  { ticker: "ARKQ", name: "ARK Autonomous Technology & Robotics ETF" },
];

// Merge and deduplicate by ticker
const ALL_TICKERS = new Set(ALL_STOCKS.map(s => s.ticker));
const EXTENDED_STOCKS = [...ALL_STOCKS, ...ADDITIONAL_STOCKS.filter(s => !ALL_TICKERS.has(s.ticker))];

interface Stock {
  ticker: string
  name: string
  category?: string
  isHot?: boolean
  isNew?: boolean
}

interface StockSelectorProps {
  currentStocks: Stock[]
  onUpdate: (stocks: Stock[]) => void
  onClose: () => void
}

export function StockSelector({ currentStocks, onUpdate, onClose }: StockSelectorProps) {
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>(currentStocks || [])
  const [searchQuery, setSearchQuery] = useState("")

  const getFilteredStocks = () => {
    const stocks = EXTENDED_STOCKS || []
    let filteredStocks = stocks

    if (searchQuery) {
      filteredStocks = filteredStocks.filter(
        (stock) =>
          stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    filteredStocks = filteredStocks.filter(
      (stock) => !selectedStocks.some((selected) => selected.ticker === stock.ticker),
    )

    return filteredStocks.slice(0, 20)
  }

  const addStock = (stock: Stock) => {
    if (selectedStocks.length < 10) {
      setSelectedStocks([...selectedStocks, stock])
    }
  }

  const removeStock = (ticker: string) => {
    setSelectedStocks(selectedStocks.filter((stock) => stock.ticker !== ticker))
  }

  const handleSave = async () => {
    // Delete all previous stocks for the user
    const prevStocks = await getUserStocks();
    // Add each selected stock
    for (const stock of selectedStocks) {
      await addStockToWatchlist(stock.ticker, stock.name);
    }
    onUpdate(selectedStocks);
    onClose();
  }

  // Add debug log after loading watchlist
  useEffect(() => {
    async function loadWatchlist() {
      const stocks = await getUserStocks();
    }
    loadWatchlist();
  }, []);

  const filteredStocks = getFilteredStocks()

  const handleStockSelect = (symbol: string) => {
    window.location.href = `/stocks/${symbol}`
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center z-50 p-0"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && selectedStocks.length > 0 && selectedStocks.length <= 10) {
          handleSave();
        }
      }}>
      <Card className="bg-card border rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col p-0 m-0">
        {/* Header */}
        <CardHeader className="flex items-center justify-between py-4 border-b relative">
          <div className="flex items-center justify-center w-full gap-6 mb-2">
            <img src="/images/concore-logo.png" alt="ConcoreTrading" className="h-10 w-10 md:h-12 md:w-12" />
            <span className="font-extrabold text-2xl md:text-4xl text-foreground whitespace-nowrap tracking-tight text-center mb-1">Manage Your Stock Watchlist</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-accent absolute right-4 top-4 md:right-8 md:top-4">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        {/* Make CardContent scrollable and flex-1 */}
        <CardContent className="flex-1 overflow-y-auto p-12 flex flex-row gap-2 items-start">
          {/* Remove Section (Selected Stocks) */}
          <div className="flex-1 p-6 flex flex-col min-h-0 items-center">
            <h3 className="text-xl font-semibold mb-4 text-foreground text-center">Remove</h3>
            <div className="text-base text-muted-foreground mb-4 text-center">Remove stocks from your watchlist below.</div>
            <div className="space-y-3 flex-1 rounded-lg bg-background border w-full p-4">
              {selectedStocks.map((stock) => (
                <div key={stock.ticker} className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg text-foreground">{stock.ticker}</div>
                    <div className="text-muted-foreground">{stock.name}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStock(stock.ticker)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {selectedStocks.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No stocks selected</p>
              )}
            </div>
            {selectedStocks.length > 0 && (
              <div className="flex justify-end mt-4 w-full">
                <Button onClick={handleSave} className="min-w-[120px]">Save</Button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px bg-border h-full mx-0" />

          {/* Add Section (Search/Add Stocks) */}
          <div className="flex-1 p-6 flex flex-col min-h-0 items-center">
            <h3 className="text-xl font-semibold mb-4 text-foreground text-center">Add</h3>
            <div className="text-base text-muted-foreground mb-4 text-center">Add new stocks to your watchlist below.</div>
            {/* Search with Real-time Results */}
            <div className="flex-1 min-h-0 w-full">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Type to search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-muted"
                />
              </div>
              {/* Real-time Search Results */}
              {searchQuery && (
                <div className="flex-1 border rounded-lg bg-background w-full p-4">
                  {filteredStocks.slice(0, 15).map((stock) => (
                    <div
                      key={stock.ticker}
                      className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                      onClick={() => {
                        addStock(stock)
                        setSearchQuery("")
                      }}
                    >
                      <div>
                        <div className="font-bold text-foreground">{stock.ticker}</div>
                        <div className="text-sm text-muted-foreground">{stock.name}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          addStock(stock)
                          setSearchQuery("")
                        }}
                        disabled={selectedStocks.length >= 10}
                        className="hover:bg-primary/10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {filteredStocks.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No stocks found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
              {/* Popular Stocks when no search */}
              {!searchQuery && (
                <div className="flex-1 w-full">
                  <h4 className="font-medium mb-3 text-foreground text-center">Popular Stocks</h4>
                  <div className="grid gap-2 flex-1 border rounded-lg bg-background w-full p-4">
                    {EXTENDED_STOCKS.slice(0, 20)
                      .filter((stock) => !selectedStocks.some((selected) => selected.ticker === stock.ticker))
                      .map((stock) => (
                        <div
                          key={stock.ticker}
                          className="p-3 hover:bg-muted/50 cursor-pointer border rounded-lg flex items-center justify-between"
                          onClick={() => addStock(stock)}
                        >
                          <div>
                            <div className="font-bold text-foreground">{stock.ticker}</div>
                            <div className="text-sm text-muted-foreground">{stock.name}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              addStock(stock)
                            }}
                            disabled={selectedStocks.length >= 10}
                            className="hover:bg-primary/10"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="flex justify-between items-center p-12 border-t bg-background sticky bottom-0 z-10">
          <div className="text-sm text-muted-foreground">
            {selectedStocks.length < 10 && <span>You can select up to {10 - selectedStocks.length} more stocks</span>}
            {selectedStocks.length === 10 && <span>Maximum stocks selected</span>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="min-w-[120px]">
              Save Watch List
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
