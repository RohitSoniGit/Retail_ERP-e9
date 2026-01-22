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
      <DialogContent className="max-w-sm glass border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Add Stock</DialogTitle>
        </DialogHeader>

        <div className="mb-4 bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
          <p className="font-bold text-lg text-foreground">{item.name}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            Current Stock: <span className="text-foreground font-semibold">{item.current_stock} {item.unit_type}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-semibold">Quantity to Add *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
              autoFocus
              className="glass border-0 shadow-inner h-11 text-lg font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost" className="text-sm font-semibold">Purchase Cost per {item.unit_type}</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder={`Current: ₹${item.purchase_cost}`}
              className="glass border-0 shadow-inner h-11"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 holographic text-white shadow-lg border-0"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Stock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}