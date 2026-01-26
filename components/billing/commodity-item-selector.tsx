"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, type Item, type CommodityPrice, type EnhancedBillItem } from "@/lib/types"
import { Scale, Package } from "lucide-react"

interface CommodityItemSelectorProps {
  item: Item
  commodityPrices: CommodityPrice[]
  onAddItem: (billItem: EnhancedBillItem) => void
  onClose: () => void
  customerType?: "retail" | "wholesale" | "distributor"
}

export function CommodityItemSelector({
  item,
  commodityPrices,
  onAddItem,
  onClose,
  customerType = "retail"
}: CommodityItemSelectorProps) {
  const [weight, setWeight] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [selectedCommodityPrice, setSelectedCommodityPrice] = useState<CommodityPrice | null>(null)
  const [calculatedPrice, setCalculatedPrice] = useState(0)

  // Find matching commodity price based on item category or name
  useEffect(() => {
    if (item.is_commodity && commodityPrices.length > 0) {
      // Try to match by category first, then by name
      let matchedPrice = commodityPrices.find(cp => 
        item.category && cp.category && 
        item.category.toLowerCase().includes(cp.category.toLowerCase())
      )

      if (!matchedPrice) {
        matchedPrice = commodityPrices.find(cp =>
          item.name.toLowerCase().includes(cp.commodity_name.toLowerCase()) ||
          cp.commodity_name.toLowerCase().includes(item.name.toLowerCase())
        )
      }

      if (matchedPrice) {
        setSelectedCommodityPrice(matchedPrice)
      }
    }
  }, [item, commodityPrices])

  // Calculate price when weight or commodity price changes
  useEffect(() => {
    if (selectedCommodityPrice && weight) {
      const weightNum = parseFloat(weight)
      if (!isNaN(weightNum)) {
        setCalculatedPrice(weightNum * selectedCommodityPrice.price_per_unit)
      }
    }
  }, [weight, selectedCommodityPrice])

  const handleAddItem = () => {
    if (item.is_commodity) {
      // Commodity item - requires weight and commodity price
      if (!weight || !selectedCommodityPrice) {
        return
      }

      const weightNum = parseFloat(weight)
      const qtyNum = parseInt(quantity) || 1

      const billItem: EnhancedBillItem = {
        item_id: item.id,
        item: item,
        quantity: qtyNum,
        weight: weightNum,
        commodity_price: selectedCommodityPrice.price_per_unit,
        is_commodity: true,
        unit_price: calculatedPrice, // Total price for the weight
        discount_percent: 0,
        gst_rate: item.gst_rate,
        subtotal: calculatedPrice * qtyNum,
        tax_amount: 0, // Will be calculated in parent
        total: calculatedPrice * qtyNum,
      }

      onAddItem(billItem)
    } else {
      // Regular item
      const qtyNum = parseInt(quantity) || 1
      const price = customerType === "wholesale" ? item.wholesale_price : item.retail_price

      const billItem: EnhancedBillItem = {
        item_id: item.id,
        item: item,
        quantity: qtyNum,
        is_commodity: false,
        unit_price: price,
        discount_percent: 0,
        gst_rate: item.gst_rate,
        subtotal: price * qtyNum,
        tax_amount: 0, // Will be calculated in parent
        total: price * qtyNum,
      }

      onAddItem(billItem)
    }

    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass border-0 shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center gap-2">
            {item.is_commodity ? (
              <Scale className="h-5 w-5" />
            ) : (
              <Package className="h-5 w-5" />
            )}
            {item.is_commodity ? "Add Commodity Item" : "Add Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Info */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
            {item.category && (
              <Badge variant="outline" className="mt-2 bg-white/5 border-white/20">
                {item.category}
              </Badge>
            )}
          </div>

          {item.is_commodity ? (
            <>
              {/* Commodity Price Selection */}
              <div className="space-y-2">
                <Label>Commodity Price</Label>
                <Select
                  value={selectedCommodityPrice?.id || ""}
                  onValueChange={(value) => {
                    const price = commodityPrices.find(cp => cp.id === value)
                    setSelectedCommodityPrice(price || null)
                  }}
                >
                  <SelectTrigger className="glass border-0 shadow-sm">
                    <SelectValue placeholder="Select commodity price" />
                  </SelectTrigger>
                  <SelectContent className="glass border-0">
                    {commodityPrices.map((cp) => (
                      <SelectItem key={cp.id} value={cp.id}>
                        {cp.commodity_name} - {formatCurrency(cp.price_per_unit)}/{cp.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Weight Input */}
              <div className="space-y-2">
                <Label>Weight ({selectedCommodityPrice?.unit || "gram"})</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Enter weight"
                  className="glass border-0 shadow-inner"
                />
              </div>

              {/* Calculated Price Display */}
              {calculatedPrice > 0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-400">Calculated Price:</span>
                    <span className="font-bold text-lg text-green-400">
                      {formatCurrency(calculatedPrice)}
                    </span>
                  </div>
                  <p className="text-xs text-green-400/70 mt-1">
                    {weight} {selectedCommodityPrice?.unit} × {formatCurrency(selectedCommodityPrice?.price_per_unit || 0)}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Regular Item Price Display */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-400">
                    {customerType === "wholesale" ? "Wholesale" : "Retail"} Price:
                  </span>
                  <span className="font-bold text-lg text-blue-400">
                    {formatCurrency(customerType === "wholesale" ? item.wholesale_price : item.retail_price)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="glass border-0 shadow-inner"
            />
          </div>

          {/* Total Calculation */}
          {(calculatedPrice > 0 || !item.is_commodity) && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold text-xl gradient-text">
                  {formatCurrency(
                    item.is_commodity 
                      ? calculatedPrice * (parseInt(quantity) || 1)
                      : (customerType === "wholesale" ? item.wholesale_price : item.retail_price) * (parseInt(quantity) || 1)
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddItem}
            disabled={
              item.is_commodity 
                ? !weight || !selectedCommodityPrice || calculatedPrice <= 0
                : !quantity || parseInt(quantity) <= 0
            }
            className="holographic"
          >
            Add to Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}