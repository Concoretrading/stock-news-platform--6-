"use client"

import React from "react";

import { useState } from "react"
import { PencilIcon, TrashIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface Catalyst {
  id: number
  headline: string
  notes?: string
  price_change?: number
  percentage_change?: number
  source?: string
  image_url?: string
  catalyst_date: string
  created_at: string
}

interface CatalystManagerProps {
  catalyst: Catalyst
  onUpdate: () => void
  onDelete: () => void
}

export function CatalystManager({ catalyst, onUpdate, onDelete }: CatalystManagerProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this catalyst?")) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/catalysts?id=${catalyst.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete catalyst")
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Catalyst Deleted",
          description: "The catalyst has been successfully deleted.",
        })
        onDelete()
      } else {
        throw new Error(result.error || "Failed to delete catalyst")
      }
    } catch (error) {
      console.error("Error deleting catalyst:", error)
      toast({
        title: "Error",
        description: "Failed to delete catalyst. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    toast({
      title: "Coming Soon",
      description: "Edit functionality is currently under development.",
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <EllipsisVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[16rem] p-2">
        <DropdownMenuItem onClick={handleEdit} className="px-3 py-2">
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit (Coming Soon)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600 px-3 py-2">
          <TrashIcon className="mr-2 h-4 w-4" />
          {isDeleting ? "Deleting..." : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
