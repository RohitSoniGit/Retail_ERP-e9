"use client"

import React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useOrganization } from "@/lib/context/organization"
import type { Item } from "@/lib/types"

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
  const [loading, setLoading] = useState(false)
  const { organization } = useOrganization()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !organization || !quantity) return

    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    const qty = parseInt(quantity, 10)

    // Update item stock
    const { error: updateError } = await supabase
      .from("items")
      .update({ current_stock: item.current_stock + qty })
      .eq("id", item.id)
      .eq("organization_id", organization.id)

    if (!updateError) {
      // Record stock movement
      await supabase.from("stock_movements").insert({
        item_id: item.id,
        organization_id: organization.id,
        quantity_change: qty,
        movement_type: "purchase",
        notes: `Added ${qty} ${item.unit_type}(s) to stock`,
      })

      setQuantity("")
      onSuccess()
    }

    setLoading(false)
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Stock - {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              Current Stock: <span className="font-medium text-foreground">{item.current_stock} {item.unit_type}</span>
            </div>
            {item.pieces_per_unit > 1 && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                1 {item.unit_type} = {item.pieces_per_unit} pieces
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Add ({item.unit_type})</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                autoFocus
              />
            </div>
            {quantity && item.pieces_per_unit > 1 && (
              <div className="text-sm text-muted-foreground">
                = {parseInt(quantity, 10) * item.pieces_per_unit} pieces total
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !quantity}>
              {loading ? "Adding..." : "Add Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
