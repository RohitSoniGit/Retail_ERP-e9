"use client";

import React from "react";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, calculateGST, type Supplier, type Item } from "@/lib/types";
import { Loader2, Plus, Trash2, Search } from "lucide-react";

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface POItem {
  item_id: string;
  item: Item;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  gst_rate: number;
  subtotal: number;
  tax_amount: number;
  total: number;
}

export function CreatePurchaseOrderDialog({ open, onOpenChange, onSuccess }: CreatePurchaseOrderDialogProps) {
  const { organizationId, organization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [showItemSearch, setShowItemSearch] = useState(false);
  
  const [formData, setFormData] = useState({
    po_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    payment_terms: "30",
    discount_percent: "",
    other_charges: "",
    notes: "",
    terms_conditions: "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch suppliers
  const { data: suppliers } = useSWR(
    organizationId ? `suppliers-po-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Supplier[];
    }
  );

  // Fetch items
  const { data: items } = useSWR(
    organizationId ? `items-po-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");

      if (error) throw error;
      return data as Item[];
    }
  );

  const filteredItems = items?.filter(
    (item) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const generatePONumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `PO${year}${month}-${random}`;
  };

  const addItem = (item: Item) => {
    const existing = poItems.find((pi) => pi.item_id === item.id);
    if (existing) {
      updateQuantity(item.id, existing.quantity + 1);
    } else {
      const unitPrice = item.purchase_cost || item.wholesale_price * 0.8;
      const subtotal = unitPrice;
      const gst = calculateGST(subtotal, item.gst_rate, organization?.state_code || "07", selectedSupplier?.state_code || "07");
      
      setPOItems([
        ...poItems,
        {
          item_id: item.id,
          item: item,
          quantity: 1,
          unit_price: unitPrice,
          discount_percent: 0,
          gst_rate: item.gst_rate,
          subtotal: subtotal,
          tax_amount: gst.total_tax,
          total: gst.grand_total,
        },
      ]);
    }
    setItemSearch("");
    setShowItemSearch(false);
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }

    setPOItems(
      poItems.map((pi) => {
        if (pi.item_id === itemId) {
          const subtotal = pi.unit_price * newQty * (1 - pi.discount_percent / 100);
          const gst = calculateGST(subtotal, pi.gst_rate, organization?.state_code || "07", selectedSupplier?.state_code || "07");
          return {
            ...pi,
            quantity: newQty,
            subtotal: subtotal,
            tax_amount: gst.total_tax,
            total: gst.grand_total,
          };
        }
        return pi;
      })
    );
  };

  const removeItem = (itemId: string) => {
    setPOItems(poItems.filter((pi) => pi.item_id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = poItems.reduce((sum, pi) => sum + pi.subtotal, 0);
    const discountAmount = formData.discount_percent ? (subtotal * parseFloat(formData.discount_percent)) / 100 : 0;
    const afterDiscount = subtotal - discountAmount;
    const otherCharges = parseFloat(formData.other_charges) || 0;
    
    const isIGST = selectedSupplier?.state_code !== (organization?.state_code || "07");
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    poItems.forEach((pi) => {
      const itemDiscount = (pi.subtotal / subtotal) * discountAmount;
      const taxableAmount = pi.subtotal - itemDiscount;
      const tax = (taxableAmount * pi.gst_rate) / 100;
      
      if (isIGST) {
        igst += tax;
      } else {
        cgst += tax / 2;
        sgst += tax / 2;
      }
    });

    const totalTax = cgst + sgst + igst;
    const grandTotal = afterDiscount + totalTax + otherCharges;

    return {
      subtotal,
      discountPercent: parseFloat(formData.discount_percent) || 0,
      discountAmount,
      afterDiscount,
      cgst,
      sgst,
      igst,
      totalTax,
      otherCharges,
      grandTotal,
      isIGST,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !selectedSupplier || poItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const poNumber = generatePONumber();
      
      // Create purchase order
      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          organization_id: organizationId,
          po_number: poNumber,
          supplier_id: selectedSupplier.id,
          po_date: formData.po_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          status: "draft",
          subtotal: totals.subtotal,
          discount_percent: totals.discountPercent,
          discount_amount: totals.discountAmount,
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          igst_amount: totals.igst,
          other_charges: totals.otherCharges,
          round_off: 0,
          total_amount: totals.grandTotal,
          advance_paid: 0,
          balance_amount: totals.grandTotal,
          payment_terms: parseInt(formData.payment_terms) || 30,
          notes: formData.notes || null,
          terms_conditions: formData.terms_conditions || null,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Create purchase order items
      for (const pi of poItems) {
        await supabase.from("purchase_order_items").insert({
          po_id: po.id,
          item_id: pi.item_id,
          item_name: pi.item.name,
          hsn_code: pi.item.hsn_code || null,
          quantity: pi.quantity,
          unit_name: pi.item.unit_type,
          unit_price: pi.unit_price,
          discount_percent: pi.discount_percent,
          gst_rate: pi.gst_rate,
          cgst_amount: totals.isIGST ? 0 : pi.tax_amount / 2,
          sgst_amount: totals.isIGST ? 0 : pi.tax_amount / 2,
          igst_amount: totals.isIGST ? pi.tax_amount : 0,
          total_price: pi.total,
          received_quantity: 0,
          pending_quantity: pi.quantity,
        });
      }

      // Reset form
      setSelectedSupplier(null);
      setPOItems([]);
      setFormData({
        po_date: new Date().toISOString().split("T")[0],
        expected_delivery_date: "",
        payment_terms: "30",
        discount_percent: "",
        other_charges: "",
        notes: "",
        terms_conditions: "",
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating purchase order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Supplier Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select
                value={selectedSupplier?.id || ""}
                onValueChange={(value) => {
                  const supplier = suppliers?.find((s) => s.id === value);
                  setSelectedSupplier(supplier || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.supplier_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="po_date">PO Date</Label>
              <Input
                id="po_date"
                type="date"
                value={formData.po_date}
                onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_delivery">Expected Delivery</Label>
              <Input
                id="expected_delivery"
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
              <Input
                id="payment_terms"
                type="number"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              />
            </div>
          </div>

          {/* Item Selection */}
          <div className="space-y-2">
            <Label>Add Items</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={itemSearch}
                onChange={(e) => {
                  setItemSearch(e.target.value);
                  setShowItemSearch(e.target.value.length > 0);
                }}
                className="pl-9"
              />
            </div>
            
            {/* Search Results */}
            {showItemSearch && filteredItems && filteredItems.length > 0 && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full p-3 text-left hover:bg-muted flex items-center justify-between"
                    onClick={() => addItem(item)}
                  >
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku} | Stock: {item.current_stock} {item.unit_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(item.purchase_cost || item.wholesale_price * 0.8)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PO Items */}
          {poItems.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Item</TableHead>
                    <TableHead className="w-[100px]">Qty</TableHead>
                    <TableHead className="w-[120px]">Rate</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poItems.map((pi) => (
                    <TableRow key={pi.item_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{pi.item.name}</p>
                          <p className="text-xs text-muted-foreground">{pi.item.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={pi.quantity}
                          onChange={(e) => updateQuantity(pi.item_id, parseInt(e.target.value) || 0)}
                          className="w-full"
                          min="1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={pi.unit_price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            setPOItems(poItems.map(item => 
                              item.item_id === pi.item_id 
                                ? { ...item, unit_price: newPrice, subtotal: newPrice * item.quantity }
                                : item
                            ));
                          }}
                          className="w-full"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(pi.total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(pi.item_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals */}
          {poItems.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount %</Label>
                <Input
                  id="discount"
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_charges">Other Charges</Label>
                <Input
                  id="other_charges"
                  type="number"
                  value={formData.other_charges}
                  onChange={(e) => setFormData({ ...formData, other_charges: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Summary */}
          {poItems.length > 0 && (
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount ({totals.discountPercent}%):</span>
                  <span>-{formatCurrency(totals.discountAmount)}</span>
                </div>
              )}
              {totals.isIGST ? (
                <div className="flex justify-between text-sm">
                  <span>IGST:</span>
                  <span>{formatCurrency(totals.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span>CGST:</span>
                    <span>{formatCurrency(totals.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>SGST:</span>
                    <span>{formatCurrency(totals.sgst)}</span>
                  </div>
                </>
              )}
              {totals.otherCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Other Charges:</span>
                  <span>{formatCurrency(totals.otherCharges)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isSubmitting || !selectedSupplier || poItems.length === 0}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Purchase Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}