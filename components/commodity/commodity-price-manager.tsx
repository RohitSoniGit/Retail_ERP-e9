"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useOrganization } from "@/lib/context/organization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatCurrency, type CommodityPrice } from "@/lib/types"
import { Plus, Edit, Trash2, TrendingUp } from "lucide-react"
import { toast } from "sonner"

export function CommodityPriceManager() {
  const { organization } = useOrganization()
  const [prices, setPrices] = useState<CommodityPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState<CommodityPrice | null>(null)
  const [formData, setFormData] = useState({
    commodity_name: "",
    category: "",
    price_per_unit: "",
    unit: "gram",
  })

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (organization) {
      loadPrices()
    }
  }, [organization])

  const loadPrices = async () => {
    if (!organization) return

    const { data, error } = await supabase
      .from("commodity_prices")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("date", new Date().toISOString().split('T')[0])
      .order("commodity_name")

    if (error) {
      console.error("Error loading commodity prices:", error)
      toast.error("Failed to load commodity prices")
    } else {
      setPrices(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return

    const priceData = {
      organization_id: organization.id,
      commodity_name: formData.commodity_name,
      category: formData.category || null,
      price_per_unit: parseFloat(formData.price_per_unit),
      unit: formData.unit,
      date: new Date().toISOString().split('T')[0],
      is_active: true,
    }

    let error
    if (editingPrice) {
      const { error: updateError } = await supabase
        .from("commodity_prices")
        .update(priceData)
        .eq("id", editingPrice.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from("commodity_prices")
        .insert(priceData)
      error = insertError
    }

    if (error) {
      console.error("Error saving commodity price:", error)
      toast.error("Failed to save commodity price")
    } else {
      toast.success(editingPrice ? "Price updated successfully" : "Price added successfully")
      setDialogOpen(false)
      setEditingPrice(null)
      setFormData({
        commodity_name: "",
        category: "",
        price_per_unit: "",
        unit: "gram",
      })
      loadPrices()
    }
  }

  const handleEdit = (price: CommodityPrice) => {
    setEditingPrice(price)
    setFormData({
      commodity_name: price.commodity_name,
      category: price.category || "",
      price_per_unit: price.price_per_unit.toString(),
      unit: price.unit,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("commodity_prices")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting commodity price:", error)
      toast.error("Failed to delete commodity price")
    } else {
      toast.success("Price deleted successfully")
      loadPrices()
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading commodity prices...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commodity Prices</h2>
          <p className="text-muted-foreground">Manage daily commodity rates for weight-based pricing</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="holographic">
          <Plus className="h-4 w-4 mr-2" />
          Add Price
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prices.map((price) => (
          <Card key={price.id} className="glass border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{price.commodity_name}</CardTitle>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              {price.category && (
                <p className="text-sm text-muted-foreground">{price.category}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text">
                  {formatCurrency(price.price_per_unit)}
                </p>
                <p className="text-sm text-muted-foreground">per {price.unit}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 glass border-0"
                  onClick={() => handleEdit(price)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 glass border-0 text-red-500 hover:text-red-400"
                  onClick={() => handleDelete(price.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {prices.length === 0 && (
        <div className="text-center py-12">
          <div className="p-6 rounded-full bg-white/5 mb-4 inline-block">
            <TrendingUp className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-lg font-medium">No commodity prices set</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add commodity prices to enable weight-based pricing in sales
          </p>
          <Button onClick={() => setDialogOpen(true)} className="holographic">
            <Plus className="h-4 w-4 mr-2" />
            Add First Price
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="gradient-text">
              {editingPrice ? "Edit Commodity Price" : "Add Commodity Price"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="commodity_name">Commodity Name</Label>
                <Input
                  id="commodity_name"
                  value={formData.commodity_name}
                  onChange={(e) => setFormData({ ...formData, commodity_name: e.target.value })}
                  placeholder="e.g., Gold, Silver, Copper"
                  required
                  className="glass border-0 shadow-inner"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., 22K Gold, 925 Silver"
                  className="glass border-0 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_per_unit">Price per Unit</Label>
                  <Input
                    id="price_per_unit"
                    type="number"
                    step="0.01"
                    value={formData.price_per_unit}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                    placeholder="0.00"
                    required
                    className="glass border-0 shadow-inner"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger className="glass border-0 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-0">
                      <SelectItem value="gram">Gram</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="tola">Tola</SelectItem>
                      <SelectItem value="ounce">Ounce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="holographic">
                {editingPrice ? "Update Price" : "Add Price"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}