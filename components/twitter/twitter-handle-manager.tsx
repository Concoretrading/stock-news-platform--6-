"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Twitter, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TwitterHandle {
  id: string
  handle: string
  displayName: string
  profileImageUrl?: string
  followerCount: number
  isActive: boolean
}

interface TwitterHandleManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function TwitterHandleManager({ isOpen, onClose }: TwitterHandleManagerProps) {
  const [handles, setHandles] = useState<TwitterHandle[]>([])
  const [newHandle, setNewHandle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load existing handles
  useEffect(() => {
    if (isOpen) {
      loadHandles()
    }
  }, [isOpen])

  const loadHandles = async () => {
    try {
      // Mock data - would be replaced with actual API call
      const mockHandles: TwitterHandle[] = [
        {
          id: "1",
          handle: "@elonmusk",
          displayName: "Elon Musk",
          profileImageUrl: "/placeholder.svg?height=40&width=40",
          followerCount: 150000000,
          isActive: true,
        },
        {
          id: "2",
          handle: "@cathiedwood",
          displayName: "Cathie Wood",
          profileImageUrl: "/placeholder.svg?height=40&width=40",
          followerCount: 1200000,
          isActive: true,
        },
        {
          id: "3",
          handle: "@chamath",
          displayName: "Chamath Palihapitiya",
          profileImageUrl: "/placeholder.svg?height=40&width=40",
          followerCount: 1500000,
          isActive: true,
        },
        {
          id: "4",
          handle: "@DeItaone",
          displayName: "Walter Bloomberg",
          profileImageUrl: "/placeholder.svg?height=40&width=40",
          followerCount: 500000,
          isActive: false,
        },
        {
          id: "5",
          handle: "@zerohedge",
          displayName: "zerohedge",
          profileImageUrl: "/placeholder.svg?height=40&width=40",
          followerCount: 2000000,
          isActive: true,
        },
      ]
      setHandles(mockHandles)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load Twitter handles",
        variant: "destructive",
      })
    }
  }

  const addHandle = async () => {
    if (!newHandle || handles.length >= 10) return

    setIsLoading(true)
    try {
      // Clean up the handle input
      const cleanHandle = newHandle.startsWith("@") ? newHandle : `@${newHandle}`

      // Check if handle already exists
      if (handles.some((h) => h.handle.toLowerCase() === cleanHandle.toLowerCase())) {
        toast({
          title: "Handle Already Added",
          description: "This Twitter handle is already in your list",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Mock API call to verify and add handle
      const newHandleData: TwitterHandle = {
        id: Math.random().toString(36).substring(2, 9),
        handle: cleanHandle,
        displayName: cleanHandle.replace("@", ""),
        profileImageUrl: "/placeholder.svg?height=40&width=40",
        followerCount: Math.floor(Math.random() * 1000000),
        isActive: true,
      }

      setHandles([...handles, newHandleData])
      setNewHandle("")

      toast({
        title: "Handle Added",
        description: `${cleanHandle} has been added to your live news feed`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add Twitter handle",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeHandle = async (id: string) => {
    try {
      setHandles(handles.filter((h) => h.id !== id))
      toast({
        title: "Handle Removed",
        description: "Twitter handle has been removed from your feed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove Twitter handle",
        variant: "destructive",
      })
    }
  }

  const toggleHandle = async (id: string) => {
    try {
      setHandles(handles.map((h) => (h.id === id ? { ...h, isActive: !h.isActive } : h)))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update handle status",
        variant: "destructive",
      })
    }
  }

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${typeof count === 'number' ? (count / 1000000).toFixed(1) : 'N/A'}M`
    } else if (count >= 1000) {
      return `${typeof count === 'number' ? (count / 1000).toFixed(1) : 'N/A'}K`
    }
    return count.toString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="text-black flex items-center gap-2">
            <Twitter className="h-5 w-5 text-blue-500" />
            Twitter Live News Manager
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto p-6">
          {/* Add New Handle */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-black mb-4">Add Twitter Handle</h3>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Twitter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                <Input
                  placeholder="Enter Twitter handle (e.g., @elonmusk)"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                  onKeyPress={(e) => e.key === "Enter" && addHandle()}
                />
              </div>
              <Button
                onClick={addHandle}
                disabled={!newHandle || handles.length >= 10 || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isLoading ? "Adding..." : "Add"}
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              You can add up to 10 Twitter handles. Currently: {handles.length}/10
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{handles.length}</div>
                <div className="text-sm text-blue-700">Total Handles</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{handles.filter((h) => h.isActive).length}</div>
                <div className="text-sm text-green-700">Active Handles</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatFollowerCount(handles.reduce((sum, h) => sum + h.followerCount, 0))}
                </div>
                <div className="text-sm text-purple-700">Total Reach</div>
              </CardContent>
            </Card>
          </div>

          {/* Handles List */}
          <div>
            <h3 className="text-lg font-bold text-black mb-4">Your Twitter Handles</h3>
            <div className="space-y-3">
              {handles.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Twitter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No Twitter handles added yet</p>
                    <p className="text-sm text-gray-500">
                      Add up to 10 Twitter handles to get live updates in your news feed
                    </p>
                  </CardContent>
                </Card>
              ) : (
                handles.map((handle) => (
                  <Card
                    key={handle.id}
                    className={`${handle.isActive ? "border-gray-200" : "border-gray-100 bg-gray-50"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={handle.profileImageUrl || "/placeholder.svg"} alt={handle.displayName} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {handle.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-black">{handle.displayName}</span>
                              <Badge variant="outline" className="text-xs">
                                {handle.handle}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="h-3 w-3" />
                              <span>{formatFollowerCount(handle.followerCount)} followers</span>
                              {handle.isActive && <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={handle.isActive} onCheckedChange={() => toggleHandle(handle.id)} />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHandle(handle.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips for Better Results:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Add influential traders and analysts for market insights</li>
              <li>• Include company executives for insider perspectives</li>
              <li>• Mix both retail and institutional voices for balanced coverage</li>
              <li>• Tweets mentioning stock tickers ($AAPL, $TSLA) are automatically highlighted</li>
              <li>• You can temporarily disable handles without removing them</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
