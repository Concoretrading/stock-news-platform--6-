"use client";
import React from "react"
import { useState } from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

interface ScreenshotButtonProps {
  onCatalystAdded?: () => void
  className?: string
}

export default function ScreenshotButton({ onCatalystAdded, className = "" }: ScreenshotButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleScreenshotUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload screenshots",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetchWithAuth('/api/analyze-screenshot', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Screenshot Analyzed",
          description: result.message || "Screenshot processed successfully",
        })
        if (onCatalystAdded) {
          onCatalystAdded()
        }
      } else {
        throw new Error(result.error || 'Failed to analyze screenshot')
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process screenshot",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 ${className}`}>
      <Button
        size="lg"
        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center border-2 border-blue-500 p-0 touch-manipulation"
        onClick={() => document.getElementById('screenshot-upload')?.click()}
        disabled={isLoading}
        title="Upload Screenshot for AI Analysis"
      >
        {isLoading ? (
          <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera className="h-7 w-7 sm:h-8 sm:w-8 text-white" strokeWidth={2} />
        )}
      </Button>
      <input
        id="screenshot-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleScreenshotUpload(file)
          }
        }}
        className="hidden"
      />
    </div>
  )
} 