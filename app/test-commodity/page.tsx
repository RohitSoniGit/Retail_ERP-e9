"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function TestCommodityPage() {
  const [isCommodity, setIsCommodity] = useState(false)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Commodity Feature</h1>
      
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_commodity"
            checked={isCommodity}
            onCheckedChange={(checked) => setIsCommodity(!!checked)}
          />
          <Label htmlFor="is_commodity" className="text-sm font-semibold cursor-pointer">
            Commodity Item
          </Label>
        </div>

        <div className="text-sm text-gray-600">
          Status: {isCommodity ? 'Commodity item - pricing fields hidden' : 'Regular item - pricing fields visible'}
        </div>

        {!isCommodity && (
          <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-sm font-semibold">Cost</Label>
              <Input
                id="cost"
                type="number"
                placeholder="0"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wholesale" className="text-sm font-semibold">Wholesale</Label>
              <Input
                id="wholesale"
                type="number"
                placeholder="0"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retail" className="text-sm font-semibold">Retail</Label>
              <Input
                id="retail"
                type="number"
                placeholder="0"
                className="h-11"
              />
            </div>
          </div>
        )}

        {isCommodity && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              ✓ Commodity mode active - pricing fields are hidden and will be set to 0
            </p>
          </div>
        )}
      </div>
    </div>
  )
}