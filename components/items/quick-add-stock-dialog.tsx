"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useOrganization } from "@/lib/context/organization"
import type { Item } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface QuickAddStockDialogProps {
  item: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function QuickAddStockDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: QuickAddStockDialogProps) {
  const [quantity, setQuantity] = useState("")
  const [cost, setCost] = useState("")
  const [loading, setLoading] = useState(false)
  const { organizationId } = useOrganization()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !organizationId) return

    const qty = parseInt(quantity)
    const unitCost = parseFloat(cost) || item.purchase_cost

    if (qty <= 0) return

    setLoading(true)
    const supabase = getSupabaseBrowserClient()

    try {
      // Update item stock
      const { error: updateError } = await supabase
        .from("items")
        .update({
          current_stock: item.current_stock + qty,
          purchase_cost: unitCost,
        })
        .eq("id", item.id)

      if (updateError) throw updateError

      // Record stock movement
      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          organization_id: organizationId,
          item_id: item.id,
          movement_type: "purchase",
          quantity_change: qty,
          unit_price: unitCost,
          notes: `Stock added: ${qty} ${item.unit_type}`,
        })

      if (movementError) throw movementError

      setQuantity("")
      setCost("")
      onSuccess()
    } catch (error) {
      console.error("Error adding stock:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            Current: {item.current_stock} {item.unit_type}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Add *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Purchase Cost per {item.unit_type}</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder={`Current: ₹${item.purchase_cost}`}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Stock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}