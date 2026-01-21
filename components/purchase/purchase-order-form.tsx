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

interface PurchaseOrderFormProps {
  onSave?: (po: PurchaseOrder) => void;
  existingPO?: PurchaseOrder;
}

export function PurchaseOrderForm({ onSave, existingPO }: PurchaseOrderFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
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
  const { organizationId } = useOrganization();
  const supabase = getSupabaseBrowserClient();

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
  }, [organizationId]);

  // Mock data
  useEffect(() => {
    const mockSuppliers: Supplier[] = [
      {
        id: "1",
        organization_id: "org1",
        supplier_code: "SUP001",
        name: "ABC Electronics Pvt Ltd",
        contact_person: "Rajesh Kumar",
        phone: "+91 98765 43210",
        email: "rajesh@abcelectronics.com",
        state_code: "27",
        gstin: "27ABCDE1234F1Z5",
        payment_terms: 30,
        credit_limit: 500000,
        current_balance: 125000,
        supplier_type: "manufacturer",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockItems: Item[] = [
      {
        id: "1",
        organization_id: "org1",
        sku: "ITEM001",
        name: "Smartphone XYZ",
        category: "Electronics",
        hsn_code: "8517",
        wholesale_price: 15000,
        retail_price: 18000,
        purchase_cost: 12000,
        current_stock: 50,
        min_stock_level: 10,
        gst_rate: 18,
        unit_type: "piece",
        unit_name: "PCS",
        pieces_per_unit: 1,
        conversion_factor: 1,
        is_rate_variable: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        organization_id: "org1",
        sku: "ITEM002",
        name: "Laptop ABC",
        category: "Electronics",
        hsn_code: "8471",
        wholesale_price: 45000,
        retail_price: 50000,
        purchase_cost: 40000,
        current_stock: 25,
        min_stock_level: 5,
        gst_rate: 18,
        unit_type: "piece",
        unit_name: "PCS",
        pieces_per_unit: 1,
        conversion_factor: 1,
        is_rate_variable: false,
        created_at: new Date().toISOString(),
      },
    ];

    setSuppliers(mockSuppliers);
    setItems(mockItems);

    // Generate PO number
    if (!existingPO) {
      const poNumber = `PO${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-4)}`;
      setFormData(prev => ({ ...prev, po_number: poNumber }));
    }
  }, [existingPO]);

  // Load existing PO data
  useEffect(() => {
    if (existingPO) {
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

  const handleSave = (status: "draft" | "sent" = "draft") => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return;
    }

    if (poItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const totals = calculateTotals();

    const purchaseOrder: PurchaseOrder = {
      id: existingPO?.id || Date.now().toString(),
      organization_id: "org1",
      po_number: formData.po_number,
      supplier_id: formData.supplier_id,
      po_date: formData.po_date,
      expected_delivery_date: formData.expected_delivery_date || undefined,
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
      created_at: existingPO?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      supplier: selectedSupplier,
      po_items: poItems,
    };

    onSave?.(purchaseOrder);
    toast.success(`Purchase order ${status === 'draft' ? 'saved as draft' : 'sent to supplier'}`);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <Card className="glass border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {existingPO ? "Edit Purchase Order" : "Create Purchase Order"}
          </CardTitle>
          <CardDescription>
            Create purchase orders to manage your inventory procurement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="po_number">PO Number</Label>
              <Input
                id="po_number"
                value={formData.po_number}
                onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                placeholder="PO202401001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po_date">PO Date</Label>
              <Input
                id="po_date"
                type="date"
                value={formData.po_date}
                onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_delivery_date">Expected Delivery</Label>
              <Input
                id="expected_delivery_date"
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
              />
            </div>
          </div>

          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => {
                setFormData({ ...formData, supplier_id: value });
                const supplier = suppliers.find(s => s.id === value);
                setSelectedSupplier(supplier || null);
                if (supplier) {
                  setFormData(prev => ({ ...prev, payment_terms: supplier.payment_terms }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    <div className="flex flex-col">
                      <span>{supplier.name}</span>
                      <span className="text-sm text-muted-foreground">{supplier.supplier_code}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSupplier && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Contact:</strong> {selectedSupplier.contact_person}</p>
                    <p><strong>Phone:</strong> {selectedSupplier.phone}</p>
                    <p><strong>Email:</strong> {selectedSupplier.email}</p>
                  </div>
                  <div>
                    <p><strong>GSTIN:</strong> {selectedSupplier.gstin}</p>
                    <p><strong>Payment Terms:</strong> {selectedSupplier.payment_terms} days</p>
                    <p><strong>Outstanding:</strong> ₹{selectedSupplier.current_balance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Items</h3>
              <Button
                onClick={() => setShowItemDialog(true)}
                disabled={!selectedSupplier}
                className="holographic text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {poItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>HSN</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Disc%</TableHead>
                    <TableHead>GST%</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-sm text-muted-foreground">{item.item?.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.hsn_code}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updatePOItem(index, 'quantity', Number(e.target.value))}
                          className="w-20"
                          min="1"
                        />
                      </TableCell>
                      <TableCell>{item.unit_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updatePOItem(index, 'unit_price', Number(e.target.value))}
                          className="w-24"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.discount_percent}
                          onChange={(e) => updatePOItem(index, 'discount_percent', Number(e.target.value))}
                          className="w-20"
                          min="0"
                          max="100"
                        />
                      </TableCell>
                      <TableCell>{item.gst_rate}%</TableCell>
                      <TableCell className="font-medium">
                        ₹{item.total_price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePOItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet. Click "Add Item" to get started.
              </div>
            )}
          </div>

          {poItems.length > 0 && (
            <>
              <Separator />

              {/* Calculations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount_percent">Overall Discount (%)</Label>
                      <Input
                        id="discount_percent"
                        type="number"
                        value={formData.discount_percent}
                        onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="other_charges">Other Charges (₹)</Label>
                      <Input
                        id="other_charges"
                        type="number"
                        value={formData.other_charges}
                        onChange={(e) => setFormData({ ...formData, other_charges: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="advance_paid">Advance Paid (₹)</Label>
                      <Input
                        id="advance_paid"
                        type="number"
                        value={formData.advance_paid}
                        onChange={(e) => setFormData({ ...formData, advance_paid: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                      <Input
                        id="payment_terms"
                        type="number"
                        value={formData.payment_terms}
                        onChange={(e) => setFormData({ ...formData, payment_terms: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{totals.subtotal.toLocaleString()}</span>
                    </div>
                    {formData.discount_percent > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount ({formData.discount_percent}%):</span>
                        <span>-₹{totals.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {totals.cgstAmount > 0 && (
                      <div className="flex justify-between">
                        <span>CGST:</span>
                        <span>₹{totals.cgstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {totals.sgstAmount > 0 && (
                      <div className="flex justify-between">
                        <span>SGST:</span>
                        <span>₹{totals.sgstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {totals.igstAmount > 0 && (
                      <div className="flex justify-between">
                        <span>IGST:</span>
                        <span>₹{totals.igstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {formData.other_charges > 0 && (
                      <div className="flex justify-between">
                        <span>Other Charges:</span>
                        <span>₹{formData.other_charges.toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Amount:</span>
                      <span>₹{totals.totalAmount.toLocaleString()}</span>
                    </div>
                    {formData.advance_paid > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Advance Paid:</span>
                          <span>-₹{formData.advance_paid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Balance Amount:</span>
                          <span>₹{totals.balanceAmount.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Notes and Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms_conditions">Terms & Conditions</Label>
                  <Textarea
                    id="terms_conditions"
                    value={formData.terms_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                    placeholder="Terms and conditions..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleSave("draft")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button onClick={() => handleSave("sent")} className="holographic text-white">
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Items to Purchase Order</DialogTitle>
            <DialogDescription>
              Select items to add to your purchase order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>HSN</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Purchase Cost</TableHead>
                  <TableHead>GST%</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.hsn_code}</TableCell>
                    <TableCell>
                      <Badge variant={item.current_stock <= item.min_stock_level ? "destructive" : "secondary"}>
                        {item.current_stock} {item.unit_name}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{item.purchase_cost.toLocaleString()}</TableCell>
                    <TableCell>{item.gst_rate}%</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => addItemToPO(item)}
                        disabled={poItems.some(poItem => poItem.item_id === item.id)}
                        className="holographic text-white"
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
        </DialogContent>
      </Dialog>
    </div>
  );
}