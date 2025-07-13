"use client"

import React from "react";


import { Card, CardContent } from "./ui/card"

export function StockAlertTab() {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground">
          Price alerts are currently disabled
        </p>
      </CardContent>
    </Card>
  )
}
