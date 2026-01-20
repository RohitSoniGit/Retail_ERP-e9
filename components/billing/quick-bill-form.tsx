"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Plus } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useOrganization } from "@/lib/context/organization"
import type { Item } from "@/lib/types"
import { INDIAN_STATES } from "@/lib/types"

interface BillItem {
  item: Item
  quantity: number
  unitPrice: number
  total: number
}

interface QuickBillFormProps {
  items: Item[]
  onSuccess: () => void
}

export function QuickBillForm({ items, onSuccess }: QuickBillFormProps) {
  const { organization } = useOrganization()
  const [customerName, setCustomerName] = useState("")
  const [customerState, setCustomerState] = useState(organization?.state_code || "27")
  const [isCredit, setIsCredit] = useState(false)
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [loading, setLoading] = useState(false)

  const isInterstate = organization?.state_code !== customerState

  const addItem = () => {
    const item = items.find((i) => i.id === selectedItemId)
    if (!item) return

    const qty = parseInt(quantity, 10)
    if (qty <= 0 || qty > item.current_stock) return

    const existing = billItems.find((bi) => bi.item.id === item.id)
    if (existing) {
      setBillItems(
        billItems.map((bi) =>
          bi.item.id === item.id
            ? {
                ...bi,
                quantity: bi.quantity + qty,
                total: (bi.quantity + qty) * bi.unitPrice,
              }
            : bi
        )
      )
    } else {
      setBillItems([
        ...billItems,
        {
          item,
          quantity: qty,
          unitPrice: item.retail_price,
          total: qty * item.retail_price,
        },
      ])
    }

    setSelectedItemId("")
    setQuantity("1")
  }

  const removeItem = (itemId: string) => {
    setBillItems(billItems.filter((bi) => bi.item.id !== itemId))
  }

  const calculations = useMemo(() => {
    const subtotal = billItems.reduce((sum, bi) => sum + bi.total, 0)
    
    // Calculate GST based on each item's rate
    let totalCgst = 0
    let totalSgst = 0
    let totalIgst = 0

    billItems.forEach((bi) => {
      const gstAmount = (bi.total * bi.item.gst_rate) / 100
      if (isInterstate) {
        totalIgst += gstAmount
      } else {
        totalCgst += gstAmount / 2
        totalSgst += gstAmount / 2
      }
    })

    const total = subtotal + totalCgst + totalSgst + totalIgst

    return {
      subtotal,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      total,
    }
  }, [billItems, isInterstate])

  const handleSubmit = async () => {
    if (!organization || billItems.length === 0) return

    setLoading(true)
    const supabase = getSupabaseBrowserClient()

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        organization_id: organization.id,
        invoice_number: invoiceNumber,
        customer_name: customerName || null,
        customer_state_code: customerState,
        subtotal: calculations.subtotal,
        cgst_amount: calculations.cgst,
        sgst_amount: calculations.sgst,
        igst_amount: calculations.igst,
        total_amount: calculations.total,
        is_credit: isCredit,
        is_paid: !isCredit,
      })
      .select()
      .single()

    if (saleError || !sale) {
      setLoading(false)
      return
    }

    // Create sale items
    const saleItems = billItems.map((bi) => ({
      sale_id: sale.id,
      item_id: bi.item.id,
      quantity: bi.quantity,
      unit_price: bi.unitPrice,
      total_price: bi.total,
    }))

    await supabase.from("sale_items").insert(saleItems)

    // Update stock for each item
    for (const bi of billItems) {
      await supabase
        .from("items")
        .update({ current_stock: bi.item.current_stock - bi.quantity })
        .eq("id", bi.item.id)
        .eq("organization_id", organization.id)

      // Record stock movement
      await supabase.from("stock_movements").insert({
        item_id: bi.item.id,
        organization_id: organization.id,
        quantity_change: -bi.quantity,
        movement_type: "sale",
        reference_id: sale.id,
        notes: `Sold ${bi.quantity} units - Invoice: ${invoiceNumber}`,
      })
    }

    // Reset form
    setBillItems([])
    setCustomerName("")
    setIsCredit(false)
    setLoading(false)
    onSuccess()
  }

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    })

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quick Bill</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer Name</Label>
            <Input
              id="customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in customer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Customer State</Label>
            <Select value={customerState} onValueChange={setCustomerState}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add Item */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {items
                .filter((item) => item.current_stock > 0)
                .map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - {formatCurrency(item.retail_price)} ({item.current_stock} in stock)
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20"
            placeholder="Qty"
          />
          <Button onClick={addItem} disabled={!selectedItemId}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Bill Items */}
        {billItems.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billItems.map((bi) => (
                  <TableRow key={bi.item.id}>
                    <TableCell className="font-medium">{bi.item.name}</TableCell>
                    <TableCell className="text-right">{bi.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bi.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bi.total)}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(bi.item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Totals */}
        {billItems.length > 0 && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(calculations.subtotal)}</span>
            </div>
            {!isInterstate ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST</span>
                  <span>{formatCurrency(calculations.cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST</span>
                  <span>{formatCurrency(calculations.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGST</span>
                <span>{formatCurrency(calculations.igst)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(calculations.total)}</span>
            </div>
          </div>
        )}

        {/* Credit Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-0.5">
            <Label htmlFor="credit" className="text-sm font-medium">
              Udhari (Credit)
            </Label>
            <p className="text-xs text-muted-foreground">Mark as unpaid credit sale</p>
          </div>
          <Switch
            id="credit"
            checked={isCredit}
            onCheckedChange={setIsCredit}
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={loading || billItems.length === 0}
        >
          {loading ? "Processing..." : `Create Bill ${billItems.length > 0 ? formatCurrency(calculations.total) : ""}`}
        </Button>
      </CardContent>
    </Card>
  )
}
