"use client"

import { isDemoMode } from "@/lib/demo-data"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"

export function DemoBanner() {
  if (!isDemoMode()) return null

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-blue-700">
        <Info className="h-4 w-4" />
        <span className="text-sm font-medium">Demo Mode</span>
        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
          Sample Data
        </Badge>
      </div>
    </div>
  )
}