import React from "react";
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface NewsItemProps {
  id: string
  ticker: string
  title: string
  snippet: string
  source: string
  time: string
}

export function NewsItem({ id, ticker, title, snippet, source, time }: NewsItemProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 mb-2">
            {ticker}
          </span>
          <h3 className="font-medium mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{snippet}</p>
        </div>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-muted-foreground">Source: {source}</span>
        <Link href={`/news/${id}`}>
          <Button variant="ghost" size="sm">
            Read More
          </Button>
        </Link>
      </div>
    </div>
  )
}
