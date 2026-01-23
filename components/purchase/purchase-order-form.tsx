"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Minus,
  Search,
  Save,
  Send,
  FileText,
  Calculator,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { PurchaseOrder, PurchaseOrderItem, Supplier, Item, calculateGST } from "@/lib/types";
import { toast } from "sonner";
import { useOrganization } from "@/lib/context/organization";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import useSWR from "swr";

interface PurchaseOrderFormProps {
  onSave?: (po: PurchaseOrder) => void;
  existingPO?: PurchaseOrder;
}

export function PurchaseOrderForm({ onSave, existingPO }: PurchaseOrderFormProps) {
  const { organizationId } = useOrganization();
  const supabase = getSupabaseBrowserClient();

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [poItems, setPOItems] = useState<PurchaseOrderItem[]>([]);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    po_number: "",
    supplier_id: "",
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: "",
    discount_percent: 0,
    other_charges: 0,
    advance_paid: 0,
    payment_terms: 30,
    notes: "",
    terms_conditions: "",
  });

  const [dailyRates, setDailyRates] = useState<Map<string, number>>(new Map());

  // Fetch suppliers from Supabase
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
      return (data as Supplier[]) || [];
    }
  );

  // Fetch items from Supabase
  const { data: items } = useSWR(
    organizationId ? `items-po-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");

      if (error) throw error;
      return (data as Item[]) || [];
    }
  );

  // Fetch daily commodity prices
  useEffect(() => {
    if (organizationId) {
      const fetchRates = async () => {
        const { data: prices } = await supabase
          .from("commodity_prices")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("date", new Date().toISOString().split('T')[0])
          .order("created_at", { ascending: false });

        if (prices) {
          const rates = new Map<string, number>();
          prices.forEach((p: any) => {
            if (!rates.has(p.commodity_name)) {
              rates.set(p.commodity_name, p.price);
            }
          });
          setDailyRates(rates);
        }
      };
      fetchRates();
    }
  }, [organizationId, supabase]);

  // Generate PO number on mount
  useEffect(() => {
    if (!existingPO && organizationId) {
      const poNumber = `PO${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-4)}`;
      setFormData(prev => ({ ...prev, po_number: poNumber }));
    }
  }, [existingPO, organizationId]);

  // Load existing PO data
  useEffect(() => {
    if (existingPO && suppliers) { // Ensure suppliers are loaded before trying to find one
      setFormData({
        po_number: existingPO.po_number,
        supplier_id: existingPO.supplier_id,
        po_date: existingPO.po_date.split('T')[0],
        expected_delivery_date: existingPO.expected_delivery_date?.split('T')[0] || "",
        discount_percent: existingPO.discount_percent,
        other_charges: existingPO.other_charges,
        advance_paid: existingPO.advance_paid,
        payment_terms: existingPO.payment_terms,
        notes: existingPO.notes || "",
        terms_conditions: existingPO.terms_conditions || "",
      });
      setPOItems(existingPO.po_items || []);
      const supplier = suppliers.find(s => s.id === existingPO.supplier_id);
      setSelectedSupplier(supplier || null);
    }
  }, [existingPO, suppliers]);

  const addItemToPO = (item: Item, quantity: number = 1, unitPrice?: number) => {
    let price = unitPrice || item.purchase_cost;

    // Check for daily rate if not manually specified
    if (!unitPrice && dailyRates.size > 0) {
      for (const [commodity, rate] of dailyRates.entries()) {
        if (item.name.toLowerCase().includes(commodity.toLowerCase())) {
          price = rate;
          toast.info(`Using daily rate for ${commodity}: ₹${rate}`);
          break;
        }
      }
    }

    const gstCalc = calculateGST(price * quantity, item.gst_rate, "27", selectedSupplier?.state_code);

    const poItem: PurchaseOrderItem = {
      id: Date.now().toString(),
      po_id: "",
      item_id: item.id,
      item_name: item.name,
      hsn_code: item.hsn_code,
      quantity,
      unit_name: item.unit_name,
      unit_price: price,
      discount_percent: 0,
      gst_rate: item.gst_rate,
      cgst_amount: gstCalc.cgst_amount,
      sgst_amount: gstCalc.sgst_amount,
      igst_amount: gstCalc.igst_amount,
      total_price: gstCalc.grand_total,
      received_quantity: 0,
      pending_quantity: quantity,
      created_at: new Date().toISOString(),
      item,
    };

    setPOItems([...poItems, poItem]);
    setShowItemDialog(false);
    toast.success("Item added to purchase order");
  };

  const updatePOItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updatedItems = [...poItems];
    const item = updatedItems[index];

    if (field === 'quantity' || field === 'unit_price' || field === 'discount_percent') {
      const quantity = field === 'quantity' ? value : item.quantity;
      const unitPrice = field === 'unit_price' ? value : item.unit_price;
      const discountPercent = field === 'discount_percent' ? value : item.discount_percent;

      const subtotal = quantity * unitPrice;
      const discountAmount = (subtotal * discountPercent) / 100;
      const discountedAmount = subtotal - discountAmount;

      const gstCalc = calculateGST(discountedAmount, item.gst_rate, "27", selectedSupplier?.state_code);

      updatedItems[index] = {
        ...item,
        [field]: value,
        cgst_amount: gstCalc.cgst_amount,
        sgst_amount: gstCalc.sgst_amount,
        igst_amount: gstCalc.igst_amount,
        total_price: gstCalc.grand_total,
        pending_quantity: quantity,
      };
    } else {
      updatedItems[index] = { ...item, [field]: value };
    }

    setPOItems(updatedItems);
  };

  const removePOItem = (index: number) => {
    setPOItems(poItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = poItems.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      const discountAmount = (itemSubtotal * item.discount_percent) / 100;
      return sum + (itemSubtotal - discountAmount);
    }, 0);

    const discountAmount = (subtotal * formData.discount_percent) / 100;
    const discountedSubtotal = subtotal - discountAmount;

    const cgstAmount = poItems.reduce((sum, item) => sum + item.cgst_amount, 0);
    const sgstAmount = poItems.reduce((sum, item) => sum + item.sgst_amount, 0);
    const igstAmount = poItems.reduce((sum, item) => sum + item.igst_amount, 0);

    const totalAmount = discountedSubtotal + cgstAmount + sgstAmount + igstAmount + formData.other_charges;
    const balanceAmount = totalAmount - formData.advance_paid;

    return {
      subtotal,
      discountAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      balanceAmount,
    };
  };

  const handleSave = async (status: "draft" | "sent" = "draft") => {
    if (!organizationId) {
      toast.error("Organization ID missing");
      return;
    }

    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return;
    }

    if (poItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    try {
      const totals = calculateTotals();

      const poData = {
        organization_id: organizationId,
        po_number: formData.po_number,
        supplier_id: formData.supplier_id,
        po_date: formData.po_date,
        expected_delivery_date: formData.expected_delivery_date || null,
        status,
        subtotal: totals.subtotal,
        discount_percent: formData.discount_percent,
        discount_amount: totals.discountAmount,
        cgst_amount: totals.cgstAmount,
        sgst_amount: totals.sgstAmount,
        igst_amount: totals.igstAmount,
        other_charges: formData.other_charges,
        round_off: 0,
        total_amount: totals.totalAmount,
        advance_paid: formData.advance_paid,
        balance_amount: totals.balanceAmount,
        payment_terms: formData.payment_terms,
        notes: formData.notes,
        terms_conditions: formData.terms_conditions,
        updated_at: new Date().toISOString(),
      };

      let poId = existingPO?.id;

      if (existingPO) {
        // Update PO
        const { error: poError } = await supabase
          .from("purchase_orders")
          .update(poData)
          .eq("id", poId);

        if (poError) throw poError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from("purchase_order_items")
          .delete()
          .eq("po_id", poId);

        if (deleteError) throw deleteError;
      } else {
        // Create new PO
        const { data: newPO, error: poError } = await supabase
          .from("purchase_orders")
          .insert([{ ...poData, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (poError) throw poError;
        poId = newPO.id;
      }

      // Insert Items
      const itemsToInsert = poItems.map(item => ({
        po_id: poId,
        item_id: item.item_id,
        hsn_code: item.hsn_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        gst_rate: item.gst_rate,
        cgst_amount: item.cgst_amount,
        sgst_amount: item.sgst_amount,
        igst_amount: item.igst_amount,
        total_price: item.total_price,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(`Purchase order ${status === 'draft' ? 'saved as draft' : 'sent to supplier'}`);

      if (onSave) {
        onSave({ ...poData, id: poId } as any);
      } else if (!existingPO) {
        // Reset form if creating new
        setFormData({
          po_number: "",
          supplier_id: "",
          po_date: new Date().toISOString().split('T')[0],
          expected_delivery_date: "",
          discount_percent: 0,
          other_charges: 0,
          advance_paid: 0,
          payment_terms: 30,
          notes: "",
          terms_conditions: "",
        });
        setPOItems([]);
        setSelectedSupplier(null);
        // New PO Number
        const poNumber = `PO${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-4)}`;
        setFormData(prev => ({ ...prev, po_number: poNumber }));
      }
    } catch (error: any) {
      console.error("Error saving PO:", error);
      toast.error(error.message || "Failed to save purchase order");
    }
  };

  const filteredItems = (items || []).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div className="space-y-8">
      <Card className="glass border-0 shadow-2xl overflow-hidden">
        <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold gradient-text">
                {existingPO ? "Edit Purchase Order" : "Create Purchase Order"}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Manage your inventory procurement with professional purchase orders
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="po_number" className="font-semibold text-sm">PO Number</Label>
              <Input
                id="po_number"
                value={formData.po_number}
                onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                placeholder="PO202401001"
                className="glass border-0 shadow-inner h-11 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po_date" className="font-semibold text-sm">PO Date</Label>
              <Input
                id="po_date"
                type="date"
                value={formData.po_date}
                onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                className="glass border-0 shadow-inner h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_delivery_date" className="font-semibold text-sm">Expected Delivery</Label>
              <Input
                id="expected_delivery_date"
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                className="glass border-0 shadow-inner h-11"
              />
            </div>
          </div>

          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label htmlFor="supplier_id" className="font-semibold text-sm">Supplier</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => {
                setFormData({ ...formData, supplier_id: value });
                const supplier = (suppliers || []).find(s => s.id === value);
                setSelectedSupplier(supplier || null);
                if (supplier) {
                  setFormData(prev => ({ ...prev, payment_terms: supplier.payment_terms }));
                }
              }}
            >
              <SelectTrigger className="glass border-0 shadow-sm h-12 text-base">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent className="glass border-0 backdrop-blur-xl">
                {(suppliers || []).map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id} className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{supplier.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{supplier.supplier_code}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSupplier && (
            <Card className="bg-white/5 border-white/10 shadow-inner">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Contact Person</span>
                      <span className="font-medium">{selectedSupplier.contact_person}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{selectedSupplier.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{selectedSupplier.email}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">GSTIN</span>
                      <span className="font-mono">{selectedSupplier.gstin}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Payment Terms</span>
                      <span className="font-medium">{selectedSupplier.payment_terms} days</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-medium text-red-400">₹{selectedSupplier.current_balance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator className="bg-white/10" />

          {/* Items Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Items</h3>
              <Button
                onClick={() => setShowItemDialog(true)}
                disabled={!selectedSupplier}
                className="holographic text-white shadow-lg border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {poItems.length > 0 ? (
              <div className="rounded-xl border border-white/10 overflow-hidden glass shadow-md">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="font-bold text-foreground">Item</TableHead>
                      <TableHead className="font-bold text-foreground">HSN</TableHead>
                      <TableHead className="font-bold text-foreground">Qty</TableHead>
                      <TableHead className="font-bold text-foreground">Unit</TableHead>
                      <TableHead className="font-bold text-foreground">Rate</TableHead>
                      <TableHead className="font-bold text-foreground">Disc%</TableHead>
                      <TableHead className="font-bold text-foreground">GST%</TableHead>
                      <TableHead className="font-bold text-foreground text-right w-32">Amount</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poItems.map((item, index) => (
                      <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell>
                          <div className="py-1">
                            <p className="font-semibold text-sm">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{item.item?.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.hsn_code}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updatePOItem(index, 'quantity', Number(e.target.value))}
                            className="w-20 h-9 glass border-0 shadow-inner text-center"
                            min="1"
                          />
                        </TableCell>
                        <TableCell className="text-sm font-medium">{item.unit_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updatePOItem(index, 'unit_price', Number(e.target.value))}
                            className="w-24 h-9 glass border-0 shadow-inner text-right"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.discount_percent}
                            onChange={(e) => updatePOItem(index, 'discount_percent', Number(e.target.value))}
                            className="w-16 h-9 glass border-0 shadow-inner text-center"
                            min="0"
                            max="100"
                          />
                        </TableCell>
                        <TableCell className="text-sm">{item.gst_rate}%</TableCell>
                        <TableCell className="text-right font-bold text-sm">
                          ₹{item.total_price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removePOItem(index)}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground glass rounded-xl border-dashed border-2 border-white/10">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No items added yet</p>
                <p className="text-sm opacity-70">Click "Add Item" to start building your PO</p>
              </div>
            )}
          </div>

          {poItems.length > 0 && (
            <>
              <Separator className="bg-white/10" />

              {/* Calculations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="discount_percent" className="text-sm font-semibold">Overall Discount (%)</Label>
                      <Input
                        id="discount_percent"
                        type="number"
                        value={formData.discount_percent}
                        onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                        min="0"
                        max="100"
                        className="glass border-0 shadow-inner h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="other_charges" className="text-sm font-semibold">Other Charges (₹)</Label>
                      <Input
                        id="other_charges"
                        type="number"
                        value={formData.other_charges}
                        onChange={(e) => setFormData({ ...formData, other_charges: Number(e.target.value) })}
                        min="0"
                        className="glass border-0 shadow-inner h-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="advance_paid" className="text-sm font-semibold">Advance Paid (₹)</Label>
                      <Input
                        id="advance_paid"
                        type="number"
                        value={formData.advance_paid}
                        onChange={(e) => setFormData({ ...formData, advance_paid: Number(e.target.value) })}
                        min="0"
                        className="glass border-0 shadow-inner h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_terms" className="text-sm font-semibold">Payment Terms (Days)</Label>
                      <Input
                        id="payment_terms"
                        type="number"
                        value={formData.payment_terms}
                        onChange={(e) => setFormData({ ...formData, payment_terms: Number(e.target.value) })}
                        min="0"
                        className="glass border-0 shadow-inner h-10"
                      />
                    </div>
                  </div>
                </div>

                <Card className="bg-white/5 border-0 shadow-inner">
                  <CardHeader className="pb-4 pt-6 px-6 border-b border-white/5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3 text-sm">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="text-foreground font-medium">₹{totals.subtotal.toLocaleString()}</span>
                    </div>
                    {formData.discount_percent > 0 && (
                      <div className="flex justify-between items-center text-red-400">
                        <span>Discount ({formData.discount_percent}%)</span>
                        <span>-₹{totals.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {totals.cgstAmount > 0 && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>CGST</span>
                        <span className="text-foreground">₹{totals.cgstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {totals.sgstAmount > 0 && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>SGST</span>
                        <span className="text-foreground">₹{totals.sgstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {totals.igstAmount > 0 && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>IGST</span>
                        <span className="text-foreground">₹{totals.igstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {formData.other_charges > 0 && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Other Charges</span>
                        <span className="text-foreground">₹{formData.other_charges.toLocaleString()}</span>
                      </div>
                    )}

                    <Separator className="bg-white/10 my-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total Amount</span>
                      <span className="text-xl font-bold gradient-text">₹{totals.totalAmount.toLocaleString()}</span>
                    </div>

                    {formData.advance_paid > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="flex justify-between items-center text-emerald-400">
                          <span>Advance Paid</span>
                          <span>-₹{formData.advance_paid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold bg-white/5 p-2 rounded-lg">
                          <span>Balance Due</span>
                          <span>₹{totals.balanceAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator className="bg-white/10" />

              {/* Notes and Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="font-semibold text-sm">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes..."
                    rows={3}
                    className="glass border-0 shadow-inner resize-none focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms_conditions" className="font-semibold text-sm">Terms & Conditions</Label>
                  <Textarea
                    id="terms_conditions"
                    value={formData.terms_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                    placeholder="Terms and conditions..."
                    rows={3}
                    className="glass border-0 shadow-inner resize-none focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => handleSave("draft")} className="hover:bg-white/10">
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button onClick={() => handleSave("sent")} className="holographic text-white shadow-lg border-0 px-8">
                  <Send className="h-4 w-4 mr-2" />
                  Send to Supplier
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass border-0 shadow-2xl p-0 gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold gradient-text">Add Items to Purchase Order</DialogTitle>
            <DialogDescription>
              Select items to add to your purchase order
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search items by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass border-0 shadow-inner h-11"
              />
            </div>

            <div className="rounded-xl border-0 overflow-hidden glass shadow-md">
              <Table>
                <TableHeader className="bg-white/10">
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="font-bold text-foreground">Item</TableHead>
                    <TableHead className="font-bold text-foreground">HSN</TableHead>
                    <TableHead className="font-bold text-foreground">Stock</TableHead>
                    <TableHead className="font-bold text-foreground">Purchase Cost</TableHead>
                    <TableHead className="font-bold text-foreground">GST%</TableHead>
                    <TableHead className="font-bold text-foreground text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{item.hsn_code}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border-0 shadow-sm ${item.current_stock <= item.min_stock_level
                            ? "bg-red-500/10 text-red-500"
                            : "bg-emerald-500/10 text-emerald-500"
                            }`}
                        >
                          {item.current_stock} {item.unit_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">₹{item.purchase_cost.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{item.gst_rate}%</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => addItemToPO(item)}
                          disabled={poItems.some(poItem => poItem.item_id === item.id)}
                          className="holographic text-white shadow-md border-0 h-8 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}