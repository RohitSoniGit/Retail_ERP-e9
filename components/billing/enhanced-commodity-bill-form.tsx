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
  type EnhancedBillItem,
  type CommodityPrice,
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
  Scale,
  Package,
} from "lucide-react";
import { CommodityItemSelector } from "./commodity-item-selector";
import { InvoicePrintDialog } from "./invoice-print-dialog";
import { InvoiceManager } from "./invoice-manager";
import { toast } from "sonner";

export function EnhancedCommodityBillForm() {
  const { organizationId, organization } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [billItems, setBillItems] = useState<EnhancedBillItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [discount, setDiscount] = useState("");
  const [customerStateCode, setCustomerStateCode] = useState(organization?.state_code || "07");
  const [showInvoice, setShowInvoice] = useState(false);
  const [isGstBill, setIsGstBill] = useState(true);
  const [printFormat, setPrintFormat] = useState<"thermal" | "a4">("thermal");
  const [savedInvoice, setSavedInvoice] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItemForCommodity, setSelectedItemForCommodity] = useState<Item | null>(null);

  const supabase = getSupabaseBrowserClient();

  // Fetch commodity prices
  const { data: commodityPrices } = useSWR(
    organizationId ? `daily-rates-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("daily_rates")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("effective_date", new Date().toISOString().split('T')[0])
        .order("category");

      if (error) throw error;
      return data as CommodityPrice[];
    }
  );

  // Define CommodityPrice type to match daily_rates structure
  type CommodityPrice = {
    id: string;
    organization_id: string;
    category: string;
    rate_per_unit: number;
    unit: string;
    effective_date: string;
    created_at: string;
  };

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
  const { data: customers, mutate: mutateCustomers } = useSWR(
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

  // Check if search term could be a new customer name
  const isNewCustomerName = customerSearch.trim().length > 0 && 
    !filteredCustomers?.some(c => c.name.toLowerCase() === customerSearch.toLowerCase().trim());

  // Create new customer function
  const createNewCustomer = async (name: string) => {
    if (!organizationId || !name.trim()) return null;

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          organization_id: organizationId,
          name: name.trim(),
          customer_type: "retail",
          current_balance: 0,
          credit_limit: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh customers list
      mutateCustomers();

      return data as Customer;
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Failed to create customer");
      return null;
    }
  };

  // Handle customer selection or creation
  const handleCustomerSelect = async (customer: Customer | string) => {
    if (typeof customer === "string") {
      // Create new customer
      const newCustomer = await createNewCustomer(customer);
      if (newCustomer) {
        setSelectedCustomer(newCustomer);
        setShowCustomerDialog(false);
        setCustomerSearch("");
        toast.success(`Customer "${newCustomer.name}" created successfully!`);
      }
    } else {
      // Select existing customer
      setSelectedCustomer(customer);
      setShowCustomerDialog(false);
      setCustomerSearch("");
    }
  };

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

  // Handle item selection
  const handleItemSelect = (item: Item) => {
    if (item.is_commodity) {
      // Show commodity selector dialog
      setSelectedItemForCommodity(item);
    } else {
      // Add regular item directly
      addRegularItem(item);
    }
    setSearchTerm("");
  };

  // Add regular item to bill
  const addRegularItem = (item: Item) => {
    const existing = billItems.find((bi) => bi.item_id === item.id && !bi.is_commodity);
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
          is_commodity: false,
          unit_price: price,
          discount_percent: 0,
          gst_rate: gstRate,
          subtotal: subtotal,
          tax_amount: gst.total_tax,
          total: gst.grand_total,
        },
      ]);
    }
  };

  // Add commodity item from selector
  const handleAddCommodityItem = (billItem: EnhancedBillItem) => {
    const gstRate = isGstBill ? billItem.item.gst_rate : 0;
    const gst = calculateGST(billItem.subtotal, gstRate, organization?.state_code || "07", customerStateCode);
    
    setBillItems([
      ...billItems,
      {
        ...billItem,
        gst_rate: gstRate,
        tax_amount: gst.total_tax,
        total: gst.grand_total,
      },
    ]);
    
    setSelectedItemForCommodity(null);
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

    const isIGST = customerStateCode !== (organization?.state_code || "07");
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    billItems.forEach((bi) => {
      const itemDiscount = (bi.subtotal / subtotal) * discountAmount;
      const taxableAmount = bi.subtotal - itemDiscount;
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
    const prefix = isGstBill ? "INV" : "EST";
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

      // Create sale items and update stock
      for (const bi of billItems) {
        const saleItemData: any = {
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
          is_commodity: bi.is_commodity || false,
        };

        // Add commodity-specific fields
        if (bi.is_commodity) {
          saleItemData.weight = bi.weight;
          saleItemData.commodity_price = bi.commodity_price;
        }

        await supabase.from("sale_items").insert(saleItemData);

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
          notes: `Sale: ${invoiceNumber}${bi.is_commodity ? ` (Weight: ${bi.weight})` : ''}`,
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
      
      toast.success("Bill saved successfully!");
    } catch (error) {
      console.error("Error saving bill:", error);
      toast.error("Failed to save bill");
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
          if (!bi.is_commodity) {
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
          }
          return bi;
        })
      );
    }
  }, [selectedCustomer]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] md:h-[calc(100vh-4rem)]">
      {/* Customer Selection */}
      <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full flex items-center gap-2">
            {selectedCustomer ? (
              <div className="flex-1 flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg glass shadow-sm">
                <User className="h-4 w-4 text-indigo-400" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCustomer.customer_type} | {selectedCustomer.phone || "No phone"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)} className="hover:bg-white/10">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex-1 relative">
                <Input
                  placeholder="Type customer name or search existing..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onFocus={() => setShowCustomerDialog(true)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && customerSearch.trim()) {
                      e.preventDefault();
                      const trimmedName = customerSearch.trim();
                      const existingCustomer = customers?.find(c => 
                        c.name.toLowerCase() === trimmedName.toLowerCase()
                      );
                      
                      if (existingCustomer) {
                        setSelectedCustomer(existingCustomer);
                        setCustomerSearch("");
                      } else {
                        // Create new customer
                        const newCustomer = await createNewCustomer(trimmedName);
                        if (newCustomer) {
                          setSelectedCustomer(newCustomer);
                          setCustomerSearch("");
                          toast.success(`Customer "${newCustomer.name}" created successfully!`);
                        }
                      }
                    }
                  }}
                  className="glass border-0 shadow-sm pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10"
                  onClick={() => setShowCustomerDialog(true)}
                >
                  <User className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Select value={customerStateCode} onValueChange={setCustomerStateCode}>
              <SelectTrigger className="w-[120px] glass border-0 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-0 backdrop-blur-xl">
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.code} - {state.name.slice(0, 10)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 border border-white/10 p-2 rounded-lg glass shadow-sm">
            <Label htmlFor="gst-mode" className="text-sm font-medium cursor-pointer">
              {isGstBill ? "GST Invoice" : "Bill of Supply"}
            </Label>
            <Switch id="gst-mode" checked={isGstBill} onCheckedChange={setIsGstBill} />
          </div>
        </div>
      </div>

      {/* Item Search */}
      <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md z-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-0 shadow-inner h-11"
          />
        </div>

        {/* Search Results */}
        {searchTerm && filteredItems && filteredItems.length > 0 && (
          <div className="absolute left-4 right-4 z-50 mt-1 bg-background/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar">
            {filteredItems.slice(0, 10).map((item) => (
              <button
                key={item.id}
                className="w-full p-3 text-left hover:bg-indigo-500/10 transition-colors flex items-center justify-between border-b border-white/5 last:border-0"
                onClick={() => handleItemSelect(item)}
              >
                <div className="flex items-center gap-3">
                  {item.is_commodity ? (
                    <Scale className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Package className="h-4 w-4 text-blue-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.sku} | <span className={item.current_stock > 0 ? "text-emerald-500" : "text-red-500"}>Stock: {item.current_stock}</span> {item.unit_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {item.is_commodity ? (
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/10">
                      Commodity
                    </Badge>
                  ) : (
                    <>
                      <p className="font-bold text-sm font-mono text-foreground">
                        {formatCurrency(selectedCustomer?.customer_type === "wholesale" ? item.wholesale_price : item.retail_price)}
                      </p>
                      <Badge variant="outline" className="text-xs border-0 bg-white/5">{item.gst_rate}% GST</Badge>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bill Items */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {billItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground glass rounded-xl border-dashed border-2 border-white/10 mx-4 my-8">
            <div className="p-6 rounded-full bg-white/5 mb-4">
              <Search className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-lg font-medium">No items added</p>
            <p className="text-sm">Search and add items to create a bill</p>
          </div>
        ) : (
          <div className="space-y-3">
            {billItems.map((bi, index) => (
              <Card key={`${bi.item_id}-${index}`} className="overflow-hidden glass border-0 shadow-md group hover:bg-white/5 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {bi.is_commodity ? (
                        <Scale className="h-5 w-5 text-yellow-500 mt-1" />
                      ) : (
                        <Package className="h-5 w-5 text-blue-500 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base truncate text-foreground">{bi.item.name}</p>
                        <div className="text-xs text-muted-foreground font-mono mt-1 space-y-1">
                          {bi.is_commodity ? (
                            <>
                              <p>Weight: {bi.weight} gram × {formatCurrency(bi.commodity_price || 0)}/gram</p>
                              <p>Qty: {bi.quantity} × {formatCurrency(bi.unit_price)}</p>
                            </>
                          ) : (
                            <p>{formatCurrency(bi.unit_price)} × {bi.quantity} {bi.item.unit_type}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-base font-mono text-foreground">{formatCurrency(bi.total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {isGstBill ? "incl. GST" : "No Tax"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-white/10 hover:text-red-400"
                        onClick={() => updateQuantity(bi.item_id, bi.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={bi.quantity}
                        onChange={(e) => updateQuantity(bi.item_id, parseInt(e.target.value) || 0)}
                        className="w-14 h-7 text-center bg-transparent border-0 focus-visible:ring-0 p-0 font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-white/10 hover:text-emerald-400"
                        onClick={() => updateQuantity(bi.item_id, bi.quantity + 1)}
                        disabled={bi.quantity >= bi.item.current_stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeItem(bi.item_id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
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
        <div className="border-t border-white/10 bg-black/40 backdrop-blur-xl p-4 space-y-4 shadow-2xl z-30">
          {/* Discount */}
          <div className="flex items-center gap-3">
            <Label className="text-sm w-20 text-muted-foreground font-medium">Discount %</Label>
            <Input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              className="w-24 h-9 glass border-0 shadow-inner"
            />
            {totals.discountAmount > 0 && (
              <span className="text-sm font-medium text-emerald-400">
                -{formatCurrency(totals.discountAmount)}
              </span>
            )}
          </div>

          {/* Totals Summary */}
          <div className="text-sm space-y-2 bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({totals.discountPercent}%)</span>
                <span className="font-mono">-{formatCurrency(totals.discountAmount)}</span>
              </div>
            )}
            {isGstBill && (
              totals.isIGST ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>IGST</span>
                  <span className="font-mono">{formatCurrency(totals.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST</span>
                    <span className="font-mono">{formatCurrency(totals.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST</span>
                    <span className="font-mono">{formatCurrency(totals.sgst)}</span>
                  </div>
                </>
              )
            )}
            {totals.roundOff !== 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Round Off</span>
                <span className="font-mono">{totals.roundOff > 0 ? "+" : ""}{totals.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl pt-3 border-t border-white/10">
              <span className="gradient-text">Total Payable</span>
              <span className="gradient-text font-mono">{formatCurrency(totals.roundedTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Print Format Selection */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Print Format</Label>
              <Select value={printFormat} onValueChange={(v: "thermal" | "a4") => setPrintFormat(v)}>
                <SelectTrigger className="h-10 glass border-0 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-0 backdrop-blur-xl">
                  <SelectItem value="thermal">Thermal (80mm)</SelectItem>
                  <SelectItem value="a4">A4 Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Mode */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Payment Mode</Label>
              <div className="flex items-center gap-2">
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className="flex-1 h-10 glass border-0 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-0 backdrop-blur-xl">
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {paymentMode === "mixed" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Paid Amount</Label>
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Paid amount"
                className="h-10 glass border-0 shadow-inner font-mono"
              />
            </div>
          )}

          {/* Save Button */}
          <Button
            className="w-full h-12 text-lg font-bold holographic text-white shadow-lg border-0 hover:scale-[1.02] transition-transform"
            onClick={saveBill}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
            ) : (
              <Check className="h-6 w-6 mr-2" />
            )}
            Save Bill
          </Button>

          {/* Invoice Manager */}
          <div className="pt-2">
            <InvoiceManager organizationId={organizationId} />
          </div>
        </div>
      )}

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-sm max-h-[80vh] glass border-0 shadow-2xl p-0 gap-0">
          <DialogHeader className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md">
            <DialogTitle className="gradient-text text-xl">Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-10 glass border-0 shadow-inner h-11"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {/* Show create new customer option if search doesn't match existing */}
              {isNewCustomerName && (
                <button
                  className="w-full p-4 text-left hover:bg-emerald-500/10 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-between group bg-emerald-500/5"
                  onClick={() => handleCustomerSelect(customerSearch.trim())}
                >
                  <div>
                    <p className="font-bold text-sm text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      Create "{customerSearch.trim()}"
                    </p>
                    <p className="text-xs text-emerald-500/70 mt-1">
                      Create new retail customer
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-emerald-400" />
                </button>
              )}
              
              {filteredCustomers?.map((customer) => (
                <button
                  key={customer.id}
                  className="w-full p-4 text-left hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all flex items-center justify-between group"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div>
                    <p className="font-bold text-sm text-foreground group-hover:text-indigo-400 transition-colors">{customer.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {customer.phone || "No phone"} | {customer.customer_type}
                    </p>
                  </div>
                  {customer.current_balance > 0 && (
                    <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/10">
                      Due: {formatCurrency(customer.current_balance)}
                    </Badge>
                  )}
                </button>
              ))}
              {!isNewCustomerName && filteredCustomers?.length === 0 && (
                <p className="text-center py-8 text-muted-foreground text-sm glass rounded-xl border-dashed border border-white/10">
                  No customers found
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Commodity Item Selector */}
      {selectedItemForCommodity && (
        <CommodityItemSelector
          item={selectedItemForCommodity}
          commodityPrices={commodityPrices || []}
          onAddItem={handleAddCommodityItem}
          onClose={() => setSelectedItemForCommodity(null)}
          customerType={selectedCustomer?.customer_type}
        />
      )}

      {/* Invoice Dialog */}
      {savedInvoice && (
        <InvoicePrintDialog
          open={showInvoice}
          onOpenChange={setShowInvoice}
          organization={organization!}
          invoiceNumber={savedInvoice.invoiceNumber}
          date={savedInvoice.date}
          customer={selectedCustomer}
          items={savedInvoice.items}
          totals={savedInvoice.totals}
          format={printFormat}
        />
      )}
    </div>
  );
}