"use client"

import React, { useEffect, useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useOrganization } from "@/lib/context/organization"
import type { Category } from "@/lib/types"
import { GST_RATES } from "@/lib/types"

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddItemDialog({ open, onOpenChange, onSuccess }: AddItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const { organization } = useOrganization()
  const [categories, setCategories] = useState<Category[]>([])
  const [skuReadonly, setSkuReadonly] = useState(false)
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category_id: "none",
    wholesale_price: "",
    retail_price: "",
    purchase_cost: "",
    current_stock: "",
    unit_type: "pcs",
    pieces_per_unit: "1",
    gst_rate: "18",
    is_commodity: false,
  })

  useEffect(() => {
    if (open && organization) {
      const fetchCategoriesAndGenerateSKU = async () => {
        const supabase = getSupabaseBrowserClient()
        
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("*")
          .eq("organization_id", organization.id)
        setCategories(categoriesData || [])

        // Generate next SKU
        await generateNextSKU()
      }
      fetchCategoriesAndGenerateSKU()
    }
  }, [open, organization])

  const generateNextSKU = async () => {
    if (!organization) return

    const supabase = getSupabaseBrowserClient()
    
    try {
      // Get all existing SKUs to find the pattern
      const { data: items } = await supabase
        .from("items")
        .select("sku")
        .eq("organization_id", organization.id)
        .order("sku", { ascending: false })

      if (!items || items.length === 0) {
        // No items exist, make SKU writable and suggest first SKU
        setFormData(prev => ({ ...prev, sku: "SKU001" }))
        setSkuReadonly(false)
        return
      }

      // Find SKUs that match pattern SKU### or similar
      const skuPattern = /^SKU(\d+)$/i
      const numericSKUs = items
        .map(item => {
          const match = item.sku.match(skuPattern)
          return match ? parseInt(match[1], 10) : null
        })
        .filter(num => num !== null)
        .sort((a, b) => b - a) // Sort descending

      if (numericSKUs.length > 0) {
        // Found pattern, generate next SKU and make readonly
        const nextNumber = numericSKUs[0] + 1
        const nextSKU = `SKU${nextNumber.toString().padStart(3, '0')}`
        setFormData(prev => ({ ...prev, sku: nextSKU }))
        setSkuReadonly(true)
      } else {
        // No pattern found, make SKU writable
        setFormData(prev => ({ ...prev, sku: "SKU001" }))
        setSkuReadonly(false)
      }
    } catch (error) {
      console.error('Error generating SKU:', error)
      // Fallback to writable SKU
      setFormData(prev => ({ ...prev, sku: "SKU001" }))
      setSkuReadonly(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return

    setLoading(true)
    const supabase = getSupabaseBrowserClient()

    const categoryName = categories.find(c => c.id === formData.category_id)?.name || undefined;

    const itemData: any = {
      organization_id: organization.id,
      sku: formData.sku,
      name: formData.name,
      category_id: formData.category_id === "none" ? null : formData.category_id,
      category: categoryName, // Keep backward compatibility
      wholesale_price: formData.is_commodity ? 0 : parseFloat(formData.wholesale_price),
      retail_price: formData.is_commodity ? 0 : parseFloat(formData.retail_price),
      purchase_cost: formData.is_commodity ? 0 : parseFloat(formData.purchase_cost),
      current_stock: parseInt(formData.current_stock, 10),
      unit_type: formData.unit_type,
      pieces_per_unit: parseInt(formData.pieces_per_unit, 10),
      gst_rate: parseFloat(formData.gst_rate),
      is_commodity: formData.is_commodity, // Always include this field
    }

    const { error } = await supabase.from("items").insert(itemData)

    if (!error) {
      // Reset form and regenerate SKU for next item
      setFormData({
        sku: "",
        name: "",
        category_id: "none",
        wholesale_price: "",
        retail_price: "",
        purchase_cost: "",
        current_stock: "",
        unit_type: "pcs",
        pieces_per_unit: "1",
        gst_rate: "18",
        is_commodity: false,
      })
      
      // Generate next SKU for the next item
      setTimeout(() => {
        generateNextSKU()
      }, 100)
      
      onSuccess()
    } else {
      console.error(error);
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Add New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-6 px-2 max-h-[60vh] overflow-y-auto scrollbar-none">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-sm font-semibold flex items-center gap-2">
                  SKU
                  {skuReadonly && (
                    <span className="text-xs text-muted-foreground">(Auto-generated)</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SKU001"
                    required
                    readOnly={skuReadonly}
                    className={`glass border-0 shadow-inner h-11 ${skuReadonly ? 'bg-muted/50 cursor-not-allowed' : ''}`}
                  />
                  {skuReadonly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-9 px-2 text-xs"
                      onClick={() => {
                        setSkuReadonly(false)
                        setFormData(prev => ({ ...prev, sku: "" }))
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {skuReadonly && (
                  <p className="text-xs text-muted-foreground">
                    Auto-generated based on existing SKUs. Click "Edit" to customize.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                  Item Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                  required
                  className="glass border-0 shadow-inner h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger className="glass border-0 h-11 shadow-sm">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="glass border-0">
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_commodity"
                checked={formData.is_commodity}
                onCheckedChange={(checked) => setFormData({ ...formData, is_commodity: !!checked })}
                className="border-2"
              />
              <Label htmlFor="is_commodity" className="text-sm font-semibold cursor-pointer">
                Commodity Item
              </Label>
            </div>

            {!formData.is_commodity && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_cost" className="text-sm font-semibold">Cost</Label>
                  <Input
                    id="purchase_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                    placeholder="0"
                    required
                    className="glass border-0 shadow-inner h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wholesale_price" className="text-sm font-semibold">Wholesale</Label>
                  <Input
                    id="wholesale_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.wholesale_price}
                    onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                    placeholder="0"
                    required
                    className="glass border-0 shadow-inner h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retail_price" className="text-sm font-semibold">Retail</Label>
                  <Input
                    id="retail_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.retail_price}
                    onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
                    placeholder="0"
                    required
                    className="glass border-0 shadow-inner h-11"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_type" className="text-sm font-semibold">Unit Type</Label>
                <Select
                  value={formData.unit_type}
                  onValueChange={(value) => setFormData({ ...formData, unit_type: value })}
                >
                  <SelectTrigger className="glass border-0 h-11 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-0">
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="ltr">Liter</SelectItem>
                    <SelectItem value="mtr">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pieces_per_unit" className="text-sm font-semibold">Pcs/Unit</Label>
                <Input
                  id="pieces_per_unit"
                  type="number"
                  min="1"
                  value={formData.pieces_per_unit}
                  onChange={(e) => setFormData({ ...formData, pieces_per_unit: e.target.value })}
                  placeholder="1"
                  className="glass border-0 shadow-inner h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_stock" className="text-sm font-semibold">Stock</Label>
                <Input
                  id="current_stock"
                  type="number"
                  min="0"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                  placeholder="0"
                  required
                  className="glass border-0 shadow-inner h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst_rate" className="text-sm font-semibold">GST Rate (%)</Label>
              <Select
                value={formData.gst_rate}
                onValueChange={(value) => setFormData({ ...formData, gst_rate: value })}
              >
                <SelectTrigger className="glass border-0 h-11 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-0">
                  {GST_RATES.map((rate) => (
                    <SelectItem key={rate} value={rate.toString()}>
                      {rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/10">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="holographic text-white shadow-lg border-0">
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
