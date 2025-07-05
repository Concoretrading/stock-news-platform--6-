"use client"

import { useState, useEffect } from "react"
import { Twitter, Heart, MessageCircle, Repeat2, ExternalLink, TrendingUp, Clock, Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TwitterHandleManager } from "./twitter-handle-manager"

interface Tweet {
  id: string
  tweetId: string
  content: string
  authorHandle: string
  authorName: string
  authorProfileImage: string
  tweetUrl: string
  likeCount: number
  retweetCount: number
  replyCount: number
  postedAt: string
  mentionedTickers: string[]
  sentiment: "positive" | "negative" | "neutral"
}

export function LiveTwitterFeed() {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showManager, setShowManager] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Mock data - would be replaced with actual API calls
  useEffect(() => {
    const loadTweets = () => {
      const mockTweets: Tweet[] = [
        {
          id: "1",
          tweetId: "1234567890",
          content:
            "🚀 $TSLA breaking through resistance levels! The weekly chart looks incredibly bullish. This could be the start of a major leg up. #Tesla #StockAnalysis",
          authorHandle: "@elonmusk",
          authorName: "Elon Musk",
          authorProfileImage: "/placeholder.svg?height=40&width=40",
          tweetUrl: "https://twitter.com/elonmusk/status/1234567890",
          likeCount: 45230,
          retweetCount: 12540,
          replyCount: 3240,
          postedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          mentionedTickers: ["TSLA"],
          sentiment: "positive",
        },
        {
          id: "2",
          tweetId: "1234567891",
          content:
            "Just published our Q4 outlook. We're seeing massive disruption in AI space. $NVDA $AMD positioning well, but watch for new entrants. Innovation cycles accelerating. 🧵",
          authorHandle: "@cathiedwood",
          authorName: "Cathie Wood",
          authorProfileImage: "/placeholder.svg?height=40&width=40",
          tweetUrl: "https://twitter.com/cathiedwood/status/1234567891",
          likeCount: 23400,
          retweetCount: 5600,
          replyCount: 1800,
          postedAt: new Date(Date.now() - 720000).toISOString(), // 12 minutes ago
          mentionedTickers: ["NVDA", "AMD"],
          sentiment: "positive",
        },
        {
          id: "3",
          tweetId: "1234567892",
          content:
            "Market volatility ahead. Fed signals more hawkish than expected. $SPY $QQQ facing headwinds. Cash is a position. Patience required in these markets.",
          authorHandle: "@chamath",
          authorName: "Chamath Palihapitiya",
          authorProfileImage: "/placeholder.svg?height=40&width=40",
          tweetUrl: "https://twitter.com/chamath/status/1234567892",
          likeCount: 18750,
          retweetCount: 4320,
          replyCount: 2100,
          postedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          mentionedTickers: ["SPY", "QQQ"],
          sentiment: "negative",
        },
        {
          id: "4",
          tweetId: "1234567893",
          content:
            "BREAKING: Major tech earnings beat across the board. $AAPL $MSFT $GOOGL all reporting strong numbers. Cloud growth accelerating. #TechEarnings",
          authorHandle: "@DeItaone",
          authorName: "Walter Bloomberg",
          authorProfileImage: "/placeholder.svg?height=40&width=40",
          tweetUrl: "https://twitter.com/DeItaone/status/1234567893",
          likeCount: 32100,
          retweetCount: 8900,
          replyCount: 1200,
          postedAt: new Date(Date.now() - 2700000).toISOString(), // 45 minutes ago
          mentionedTickers: ["AAPL", "MSFT", "GOOGL"],
          sentiment: "positive",
        },
        {
          id: "5",
          tweetId: "1234567894",
          content:
            "The everything bubble continues. Asset prices disconnected from fundamentals. $BTC $TSLA $NVDA showing signs of euphoria. History doesn't repeat but it rhymes. 📉",
          authorHandle: "@zerohedge",
          authorName: "zerohedge",
          authorProfileImage: "/placeholder.svg?height=40&width=40",
          tweetUrl: "https://twitter.com/zerohedge/status/1234567894",
          likeCount: 15600,
          retweetCount: 7800,
          replyCount: 3400,
          postedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          mentionedTickers: ["BTC", "TSLA", "NVDA"],
          sentiment: "negative",
        },
      ]
      setTweets(mockTweets)
      setIsLoading(false)
      setLastUpdate(new Date())
    }

    // Load initial tweets
    loadTweets()

    // Set up polling for new tweets every 30 seconds
    const interval = setInterval(loadTweets, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const posted = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - posted.getTime()) / 60000)

    if (diffInMinutes < 1) return "now"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${typeof count === 'number' ? (count / 1000000).toFixed(1) : 'N/A'}M`
    } else if (count >= 1000) {
      return `${typeof count === 'number' ? (count / 1000).toFixed(1) : 'N/A'}K`
    }
    return count.toString()
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-200"
      case "negative":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "📈"
      case "negative":
        return "📉"
      default:
        return "➡️"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <Twitter className="h-5 w-5 text-blue-500" />
              Live Twitter Feed
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="text-sm text-blue-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {formatTimeAgo(lastUpdate.toISOString())}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManager(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Settings className="mr-2 h-4 w-4" />
                Manage Handles
              </Button>
            </div>
          </div>
          <p className="text-blue-700 text-sm">
            Real-time tweets from your selected Twitter handles with automatic stock ticker detection
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tweets...</p>
            </CardContent>
          </Card>
        ) : tweets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Twitter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tweets found</p>
              <p className="text-sm text-gray-500 mb-4">Add Twitter handles to start seeing live updates</p>
              <Button onClick={() => setShowManager(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Twitter Handles
              </Button>
            </CardContent>
          </Card>
        ) : (
          tweets.map((tweet) => (
            <Card key={tweet.id} className="hover:shadow-lg transition-shadow bg-white border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={tweet.authorProfileImage || "/placeholder.svg"} alt={tweet.authorName} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {tweet.authorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-black">{tweet.authorName}</span>
                      <span className="text-gray-500 text-sm">{tweet.authorHandle}</span>
                      <span className="text-gray-400 text-sm">•</span>
                      <span className="text-gray-500 text-sm">{formatTimeAgo(tweet.postedAt)}</span>
                      <Badge className={`text-xs ${getSentimentColor(tweet.sentiment)}`}>
                        {getSentimentIcon(tweet.sentiment)} {tweet.sentiment}
                      </Badge>
                    </div>

                    <p className="text-gray-900 mb-3 leading-relaxed">{tweet.content}</p>

                    {tweet.mentionedTickers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tweet.mentionedTickers.map((ticker) => (
                          <Badge key={ticker} className="bg-blue-100 text-blue-800 border-blue-200">
                            <TrendingUp className="h-3 w-3 mr-1" />${ticker}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-gray-500 text-sm">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{formatCount(tweet.replyCount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Repeat2 className="h-4 w-4" />
                          <span>{formatCount(tweet.retweetCount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{formatCount(tweet.likeCount)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => window.open(tweet.tweetUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More Button */}
      {tweets.length > 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <Button variant="outline" className="hover:bg-gray-50">
              Load More Tweets
            </Button>
            <p className="text-sm text-gray-500 mt-2">Showing latest tweets from your followed handles</p>
          </CardContent>
        </Card>
      )}

      <TwitterHandleManager isOpen={showManager} onClose={() => setShowManager(false)} />
    </div>
  )
}
