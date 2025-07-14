"use client"

import React from "react";

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface OnboardingPopupProps {
  isVisible: boolean
  onClose: () => void
}

export function OnboardingPopup({ isVisible, onClose }: OnboardingPopupProps) {
  if (!isVisible) return null

  return (
    <div className="fixed top-24 left-4 z-50 w-80 max-w-[calc(100vw-2rem)] sm:max-w-80">
      <Card className="border-blue-200 bg-white dark:bg-gray-800 shadow-lg animate-in slide-in-from-left-2 duration-300">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2 flex-1 pr-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to ConcoreNews! 👋
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Click <strong>manage</strong> to customize your watch list. Drop your news on the screen and it will be placed in your stocks history.
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 touch-manipulation flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
