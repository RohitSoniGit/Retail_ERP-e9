"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatCurrency,
  calculateGST,
  roundOff,
  INDIAN_STATES,
  PAYMENT_MODES,
  type Item,
  type Customer,
  type BillItem,
} from "@/lib/types";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Check,
  User,
  Loader2,
  X,
} from "lucide-react";
import { ThermalInvoice } from "./thermal-invoice";

export function EnhancedBillForm() {
  const { organizationId, organization } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [discount, setDiscount] = useState("");
  const [customerStateCode, setCustomerStateCode] = useState(organization?.state_code || "07");
  const [showInvoice, setShowInvoice] = useState(false);
  const [isGstBill, setIsGstBill] = useState(true);
  const [savedInvoice, setSavedInvoice] = useState<{
    invoiceNumber: string;
    date: string;
    items: BillItem[];
    totals: ReturnType<typeof calculateTotals>;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = getSupabaseBrowserClient();

  // Fetch items
  const { data: items } = useSWR(
    organizationId ? `items-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("organization_id", organizationId)
        .gt("current_stock", 0)
        .order("name");

      if (error) throw error;
      return data as Item[];
    }
  );

  // Fetch customers
  const { data: customers } = useSWR(
    organizationId ? `customers-billing-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");

      if (error) throw error;
      return data as Customer[];
    }
  );

  // Filter items by search
  const filteredItems = items?.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter customers by search
  const filteredCustomers = customers?.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.phone?.includes(customerSearch)
  );

  // Recalculate all items when GST toggle changes
  useEffect(() => {
    setBillItems(currentItems =>
      currentItems.map(bi => {
        const gstRate = isGstBill ? bi.item.gst_rate : 0;
        const subtotal = bi.unit_price * bi.quantity * (1 - bi.discount_percent / 100);
        const gst = calculateGST(subtotal, gstRate, organization?.state_code || "07", customerStateCode);
        return {
          ...bi,
          gst_rate: gstRate,
          subtotal: subtotal,
          tax_amount: gst.total_tax,
          total: gst.grand_total,
        };
      })
    );
  }, [isGstBill, customerStateCode, organization?.state_code]);


  // Add item to bill
  const addItem = (item: Item) => {
    const existing = billItems.find((bi) => bi.item_id === item.id);
    if (existing) {
      updateQuantity(item.id, existing.quantity + 1);
    } else {
      const price = selectedCustomer?.customer_type === "wholesale" ? item.wholesale_price : item.retail_price;
      const subtotal = price;
      const gstRate = isGstBill ? item.gst_rate : 0;
      const gst = calculateGST(subtotal, gstRate, organization?.state_code || "07", customerStateCode);

      setBillItems([
        ...billItems,
        {
          item_id: item.id,
          item: item,
          quantity: 1,
          unit_price: price,
          discount_percent: 0,
          gst_rate: gstRate,
          subtotal: subtotal,
          tax_amount: gst.total_tax,
          total: gst.grand_total,
        },
      ]);
    }
    setSearchTerm("");
  };

  // Update item quantity
  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }

    setBillItems(
      billItems.map((bi) => {
        if (bi.item_id === itemId) {
          const subtotal = bi.unit_price * newQty * (1 - bi.discount_percent / 100);
          const gst = calculateGST(subtotal, bi.gst_rate, organization?.state_code || "07", customerStateCode);
          return {
            ...bi,
            quantity: newQty,
            subtotal: subtotal,
            tax_amount: gst.total_tax,
            total: gst.grand_total,
          };
        }
        return bi;
      })
    );
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setBillItems(billItems.filter((bi) => bi.item_id !== itemId));
  };

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const subtotal = billItems.reduce((sum, bi) => sum + bi.subtotal, 0);
    const discountAmount = discount ? (subtotal * parseFloat(discount)) / 100 : 0;
    const afterDiscount = subtotal - discountAmount;

    // For Non-GST bills, these will effectively be 0
    const isIGST = customerStateCode !== (organization?.state_code || "07");
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    billItems.forEach((bi) => {
      const itemDiscount = (bi.subtotal / subtotal) * discountAmount;
      const taxableAmount = bi.subtotal - itemDiscount; // Prorate discount
      const tax = (taxableAmount * bi.gst_rate) / 100;

      if (isIGST) {
        igst += tax;
      } else {
        cgst += tax / 2;
        sgst += tax / 2;
      }
    });

    const totalTax = cgst + sgst + igst;
    const grandTotal = afterDiscount + totalTax;
    const { rounded, diff } = roundOff(grandTotal);

    return {
      subtotal,
      discountPercent: parseFloat(discount) || 0,
      discountAmount,
      afterDiscount,
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal,
      roundedTotal: rounded,
      roundOff: diff,
      isIGST,
    };
  }, [billItems, discount, customerStateCode, organization?.state_code]);

  const totals = calculateTotals();

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const prefix = isGstBill ? "INV" : "EST"; // Prefix distinction
    return `${prefix}${year}${month}-${random}`;
  };

  // Save bill
  const saveBill = async () => {
    if (!organizationId || billItems.length === 0) return;

    setIsSubmitting(true);
    const invoiceNumber = generateInvoiceNumber();
    const paidAmount = parseFloat(amountPaid) || (paymentMode === "credit" ? 0 : totals.roundedTotal);
    const creditAmount = paymentMode === "credit" ? totals.roundedTotal : Math.max(0, totals.roundedTotal - paidAmount);

    try {
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          organization_id: organizationId,
          invoice_number: invoiceNumber,
          customer_id: selectedCustomer?.id || null,
          customer_name: selectedCustomer?.name || null,
          customer_phone: selectedCustomer?.phone || null,
          customer_state_code: customerStateCode,
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          discount_percent: totals.discountPercent,
          cgst_amount: totals.cgst,
          sgst_amount: totals.sgst,
          igst_amount: totals.igst,
          round_off: totals.roundOff,
          total_amount: totals.roundedTotal,
          payment_mode: paymentMode,
          amount_paid: paidAmount,
          credit_amount: creditAmount,
          is_credit: paymentMode === "credit" || creditAmount > 0,
          is_paid: creditAmount === 0,
          is_gst_bill: isGstBill,
          sale_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items and update stock (Same logic)
      for (const bi of billItems) {
        await supabase.from("sale_items").insert({
          sale_id: sale.id,
          item_id: bi.item_id,
          item_name: bi.item.name,
          hsn_code: bi.item.hsn_code || null,
          quantity: bi.quantity,
          unit_name: bi.item.unit_type,
          unit_price: bi.unit_price,
          purchase_price: bi.item.purchase_cost,
          discount_percent: bi.discount_percent,
          gst_rate: bi.gst_rate,
          cgst_amount: totals.isIGST ? 0 : bi.tax_amount / 2,
          sgst_amount: totals.isIGST ? 0 : bi.tax_amount / 2,
          igst_amount: totals.isIGST ? bi.tax_amount : 0,
          total_price: bi.total,
        });

        // Update stock
        await supabase
          .from("items")
          .update({
            current_stock: bi.item.current_stock - bi.quantity,
          })
          .eq("id", bi.item_id);

        // Record stock movement
        await supabase.from("stock_movements").insert({
          organization_id: organizationId,
          item_id: bi.item_id,
          movement_type: "sale",
          quantity_change: -bi.quantity,
          reference_id: sale.id,
          notes: `Sale: ${invoiceNumber}`,
        });
      }

      // Update customer balance if credit sale
      if (selectedCustomer && creditAmount > 0) {
        await supabase
          .from("customers")
          .update({
            current_balance: selectedCustomer.current_balance + creditAmount,
          })
          .eq("id", selectedCustomer.id);
      }

      // Save for invoice display
      setSavedInvoice({
        invoiceNumber,
        date: new Date().toISOString(),
        items: billItems,
        totals,
      });
      setShowInvoice(true);

      // Reset form
      setBillItems([]);
      setSelectedCustomer(null);
      setDiscount("");
      setAmountPaid("");
      setPaymentMode("cash");
    } catch (error) {
      console.error("Error saving bill:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update prices when customer type changes
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerStateCode(selectedCustomer.state_code || organization?.state_code || "07");
      setBillItems(
        billItems.map((bi) => {
          const price = selectedCustomer.customer_type === "wholesale" ? bi.item.wholesale_price : bi.item.retail_price;
          const subtotal = price * bi.quantity * (1 - bi.discount_percent / 100);
          const gstRate = isGstBill ? bi.item.gst_rate : 0;
          const gst = calculateGST(subtotal, gstRate, organization?.state_code || "07", selectedCustomer.state_code || "07");
          return {
            ...bi,
            unit_price: price,
            gst_rate: gstRate,
            subtotal,
            tax_amount: gst.total_tax,
            total: gst.grand_total,
          };
        })
      );
    }
  }, [selectedCustomer]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Customer Selection */}
      <div className="p-4 border-b bg-background">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full flex items-center gap-2">
            {selectedCustomer ? (
              <div className="flex-1 flex items-center gap-2 p-2 bg-muted rounded-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCustomer.customer_type} | {selectedCustomer.phone || "No phone"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="flex-1 justify-start text-muted-foreground bg-transparent"
                onClick={() => setShowCustomerDialog(true)}
              >
                <User className="h-4 w-4 mr-2" />
                Select Customer (Optional)
              </Button>
            )}

            <Select value={customerStateCode} onValueChange={setCustomerStateCode}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.code} - {state.name.slice(0, 10)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 border p-2 rounded-lg bg-card">
            <Label htmlFor="gst-mode" className="text-sm font-medium cursor-pointer">
              {isGstBill ? "GST Invoice" : "Bill of Supply"}
            </Label>
            <Switch id="gst-mode" checked={isGstBill} onCheckedChange={setIsGstBill} />
          </div>
        </div>
      </div>

      {/* Item Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Search Results */}
        {searchTerm && filteredItems && filteredItems.length > 0 && (
          <div className="absolute z-10 mt-1 w-[calc(100%-2rem)] bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
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
                    {formatCurrency(selectedCustomer?.customer_type === "wholesale" ? item.wholesale_price : item.retail_price)}
                  </p>
                  <Badge variant="outline" className="text-xs">{item.gst_rate}% GST</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bill Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {billItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No items added</p>
            <p className="text-sm">Search and add items to create a bill</p>
          </div>
        ) : (
          <div className="space-y-2">
            {billItems.map((bi) => (
              <Card key={bi.item_id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{bi.item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(bi.unit_price)} x {bi.quantity} {bi.item.unit_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(bi.total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {isGstBill ? "incl. GST" : "No Tax"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => updateQuantity(bi.item_id, bi.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={bi.quantity}
                        onChange={(e) => updateQuantity(bi.item_id, parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => updateQuantity(bi.item_id, bi.quantity + 1)}
                        disabled={bi.quantity >= bi.item.current_stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => removeItem(bi.item_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Totals & Payment */}
      {billItems.length > 0 && (
        <div className="border-t bg-muted/30 p-4 space-y-3">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <Label className="text-sm w-20">Discount %</Label>
            <Input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              className="w-20 h-8"
            />
            {totals.discountAmount > 0 && (
              <span className="text-sm text-muted-foreground">
                -{formatCurrency(totals.discountAmount)}
              </span>
            )}
          </div>

          {/* Totals Summary */}
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({totals.discountPercent}%)</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
            )}
            {isGstBill && (
              totals.isIGST ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IGST</span>
                  <span>{formatCurrency(totals.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CGST</span>
                    <span>{formatCurrency(totals.cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SGST</span>
                    <span>{formatCurrency(totals.sgst)}</span>
                  </div>
                </>
              )
            )}
            {totals.roundOff !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Round Off</span>
                <span>{totals.roundOff > 0 ? "+" : ""}{totals.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(totals.roundedTotal)}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="flex items-center gap-2">
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {paymentMode === "mixed" && (
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Paid amount"
                className="w-32"
              />
            )}
          </div>

          {/* Save Button */}
          <Button
            className="w-full h-12 text-lg"
            onClick={saveBill}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Check className="h-5 w-5 mr-2" />
            )}
            Save Bill ({formatCurrency(totals.roundedTotal)})
          </Button>
        </div>
      )}

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-sm max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {filteredCustomers?.map((customer) => (
                <button
                  key={customer.id}
                  className="w-full p-3 text-left hover:bg-muted rounded-lg flex items-center justify-between"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerDialog(false);
                    setCustomerSearch("");
                  }}
                >
                  <div>
                    <p className="font-medium text-sm">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.phone || "No phone"} | {customer.customer_type}
                    </p>
                  </div>
                  {customer.current_balance > 0 && (
                    <Badge variant="outline" className="text-red-600">
                      Due: {formatCurrency(customer.current_balance)}
                    </Badge>
                  )}
                </button>
              ))}
              {filteredCustomers?.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  No customers found
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      {savedInvoice && (
        <ThermalInvoice
          open={showInvoice}
          onOpenChange={setShowInvoice}
          organization={organization!}
          invoiceNumber={savedInvoice.invoiceNumber}
          date={savedInvoice.date}
          customer={selectedCustomer}
          items={savedInvoice.items}
          totals={savedInvoice.totals}
        />
      )}
    </div>
  );
}
