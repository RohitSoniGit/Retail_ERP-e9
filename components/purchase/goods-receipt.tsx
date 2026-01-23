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
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  Truck,
  ClipboardCheck,
  Calculator,
  FileText,
} from "lucide-react";
import { PurchaseReceipt, PurchaseReceiptItem, PurchaseOrder, Supplier, calculateGST } from "@/lib/types";
import { toast } from "sonner";
import { useOrganization } from "@/lib/context/organization";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import useSWR from "swr";

const RECEIPT_STATUS = [
  { value: "draft", label: "Draft", color: "secondary" },
  { value: "received", label: "Received", color: "default" },
  { value: "quality_check", label: "Quality Check", color: "secondary" },
  { value: "accepted", label: "Accepted", color: "default" },
  { value: "rejected", label: "Rejected", color: "destructive" },
];

const QUALITY_STATUS = [
  { value: "pending", label: "Pending", color: "secondary" },
  { value: "passed", label: "Passed", color: "default" },
  { value: "failed", label: "Failed", color: "destructive" },
];

interface GoodsReceiptProps {
  onSave?: (receipt: PurchaseReceipt) => void;
  existingReceipt?: PurchaseReceipt;
}

export function GoodsReceipt({ onSave, existingReceipt }: GoodsReceiptProps) {
  const { organizationId } = useOrganization();
  const supabase = getSupabaseBrowserClient();

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receiptItems, setReceiptItems] = useState<PurchaseReceiptItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    grn_number: "",
    po_id: "",
    supplier_id: "",
    supplier_invoice_number: "",
    supplier_invoice_date: "",
    receipt_date: new Date().toISOString().split('T')[0],
    status: "draft" as "draft" | "received" | "quality_check" | "accepted" | "rejected",
    freight_charges: 0,
    other_charges: 0,
    notes: "",
  });

  // Fetch Purchase Orders
  const { data: purchaseOrdersData } = useSWR(
    organizationId ? `pos-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*),
          po_items:purchase_order_items(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as PurchaseOrder[]) || [];
    }
  );

  // Fetch Receipts
  const { data: receiptsData, mutate: mutateReceipts } = useSWR(
    organizationId ? `receipts-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from('purchase_receipts')
        .select(`
          *,
          supplier:suppliers(*),
          purchase_order:purchase_orders(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as PurchaseReceipt[]) || [];
    }
  );

  const purchaseOrders = purchaseOrdersData || [];
  const receipts = receiptsData || [];

  // Generate GRN number
  useEffect(() => {
    if (!existingReceipt && organizationId && isCreating) {
      const grnNumber = `GRN${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-4)}`;
      setFormData(prev => ({ ...prev, grn_number: grnNumber }));
    }
  }, [existingReceipt, organizationId, isCreating]);

  // Load existing receipt data
  useEffect(() => {
    if (existingReceipt) {
      setFormData({
        grn_number: existingReceipt.grn_number,
        po_id: existingReceipt.po_id || "",
        supplier_id: existingReceipt.supplier_id,
        supplier_invoice_number: existingReceipt.supplier_invoice_number || "",
        supplier_invoice_date: existingReceipt.supplier_invoice_date?.split('T')[0] || "",
        receipt_date: existingReceipt.receipt_date.split('T')[0],
        status: existingReceipt.status,
        freight_charges: existingReceipt.freight_charges,
        other_charges: existingReceipt.other_charges,
        notes: existingReceipt.notes || "",
      });
      setReceiptItems(existingReceipt.receipt_items || []);
      const po = purchaseOrders.find(p => p.id === existingReceipt.po_id);
      setSelectedPO(po || null);
    }
  }, [existingReceipt, purchaseOrders]);

  const handlePOSelection = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    setSelectedPO(po || null);
    setFormData(prev => ({
      ...prev,
      po_id: poId,
      supplier_id: po?.supplier_id || "",
    }));

    if (po?.po_items) {
      const items: PurchaseReceiptItem[] = po.po_items.map(poItem => ({
        id: Date.now().toString() + poItem.id,
        receipt_id: "",
        po_item_id: poItem.id,
        item_id: poItem.item_id,
        item_name: poItem.item_name,
        hsn_code: poItem.hsn_code,
        ordered_quantity: poItem.quantity,
        received_quantity: 0,
        accepted_quantity: 0,
        rejected_quantity: 0,
        unit_name: poItem.unit_name,
        unit_price: poItem.unit_price,
        discount_percent: poItem.discount_percent,
        gst_rate: poItem.gst_rate,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        total_price: 0,
        quality_status: "pending",
        created_at: new Date().toISOString(),
      }));
      setReceiptItems(items);
    }
  };

  const updateReceiptItem = (index: number, field: keyof PurchaseReceiptItem, value: any) => {
    const updatedItems = [...receiptItems];
    const item = updatedItems[index];

    if (field === 'received_quantity' || field === 'accepted_quantity' || field === 'rejected_quantity') {
      const receivedQty = field === 'received_quantity' ? value : item.received_quantity;
      const acceptedQty = field === 'accepted_quantity' ? value : item.accepted_quantity;
      const rejectedQty = field === 'rejected_quantity' ? value : item.rejected_quantity;

      // Validate quantities
      if (acceptedQty + rejectedQty > receivedQty) {
        toast.error("Accepted + Rejected quantity cannot exceed received quantity");
        return;
      }

      // Calculate tax and total
      const subtotal = acceptedQty * item.unit_price;
      const discountAmount = (subtotal * item.discount_percent) / 100;
      const discountedAmount = subtotal - discountAmount;

      const gstCalc = calculateGST(discountedAmount, item.gst_rate, "27", selectedPO?.supplier?.state_code);

      updatedItems[index] = {
        ...item,
        [field]: value,
        cgst_amount: gstCalc.cgst_amount,
        sgst_amount: gstCalc.sgst_amount,
        igst_amount: gstCalc.igst_amount,
        total_price: gstCalc.grand_total,
        quality_status: acceptedQty > 0 && rejectedQty === 0 ? "passed" :
          rejectedQty > 0 ? "failed" : "pending",
      };
    } else {
      updatedItems[index] = { ...item, [field]: value };
    }

    setReceiptItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = receiptItems.reduce((sum, item) => {
      const itemSubtotal = item.accepted_quantity * item.unit_price;
      const discountAmount = (itemSubtotal * item.discount_percent) / 100;
      return sum + (itemSubtotal - discountAmount);
    }, 0);

    const cgstAmount = receiptItems.reduce((sum, item) => sum + item.cgst_amount, 0);
    const sgstAmount = receiptItems.reduce((sum, item) => sum + item.sgst_amount, 0);
    const igstAmount = receiptItems.reduce((sum, item) => sum + item.igst_amount, 0);

    const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount + formData.freight_charges + formData.other_charges;

    return {
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
    };
  };

  const handleSave = async (status: "draft" | "received" | "quality_check" | "accepted" | "rejected" = "draft") => {
    if (!organizationId) {
      toast.error("Organization ID missing");
      return;
    }

    if (!selectedPO) {
      toast.error("Please select a purchase order");
      return;
    }

    if (receiptItems.length === 0) {
      toast.error("No items to receive");
      return;
    }

    try {
      const totals = calculateTotals();

      const receiptData = {
        organization_id: organizationId,
        grn_number: formData.grn_number,
        po_id: formData.po_id,
        supplier_id: formData.supplier_id,
        supplier_invoice_number: formData.supplier_invoice_number,
        supplier_invoice_date: formData.supplier_invoice_date || null,
        receipt_date: formData.receipt_date,
        status,
        subtotal: totals.subtotal,
        discount_amount: 0,
        cgst_amount: totals.cgstAmount,
        sgst_amount: totals.sgstAmount,
        igst_amount: totals.igstAmount,
        freight_charges: formData.freight_charges,
        other_charges: formData.other_charges,
        round_off: 0,
        total_amount: totals.totalAmount,
        payment_status: "pending",
        paid_amount: 0,
        balance_amount: totals.totalAmount,
        notes: formData.notes,
        updated_at: new Date().toISOString(),
      };

      let receiptId = existingReceipt?.id;

      if (existingReceipt) {
        // Update
        const { error: rError } = await supabase
          .from("purchase_receipts")
          .update(receiptData)
          .eq("id", receiptId);
        if (rError) throw rError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from("purchase_receipt_items")
          .delete()
          .eq("receipt_id", receiptId);
        if (deleteError) throw deleteError;

      } else {
        // Create
        const { data: newReceipt, error: rError } = await supabase
          .from("purchase_receipts")
          .insert([{ ...receiptData, created_at: new Date().toISOString() }])
          .select()
          .single();
        if (rError) throw rError;
        receiptId = newReceipt.id;
      }

      // Insert Items
      const itemsToInsert = receiptItems.map(item => ({
        receipt_id: receiptId,
        po_item_id: item.po_item_id,
        item_id: item.item_id,
        hsn_code: item.hsn_code,
        ordered_quantity: item.ordered_quantity,
        received_quantity: item.received_quantity,
        accepted_quantity: item.accepted_quantity,
        rejected_quantity: item.rejected_quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        gst_rate: item.gst_rate,
        cgst_amount: item.cgst_amount,
        sgst_amount: item.sgst_amount,
        igst_amount: item.igst_amount,
        total_price: item.total_price,
        quality_status: item.quality_status,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from("purchase_receipt_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // If accepted, update stock (this typically happens via database trigger or we do it here)
      // For now we assume DB/Trigger handles it or we do nothing (basic implementation)
      // If we need to update stock manually:
      /*
      if (status === 'accepted') {
         // Loop items and update inventory
      }
      */

      toast.success(`Goods receipt ${status === 'draft' ? 'saved as draft' : status === 'received' ? 'marked as received' : 'accepted and stock updated'}`);

      mutateReceipts();
      if (onSave) {
        onSave({ ...receiptData, id: receiptId } as any);
      } else {
        setIsCreating(false);
        // Reset form ...
      }
    } catch (error: any) {
      console.error("Error saving receipt:", error);
      toast.error(error.message || "Failed to save receipt");
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Goods Receipt Note (GRN)</h3>
          <p className="text-sm text-muted-foreground">
            Receive and inspect goods from suppliers
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="holographic text-white">
          <Package className="h-4 w-4 mr-2" />
          New GRN
        </Button>
      </div>

      {/* Existing Receipts */}
      <Card className="glass border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Goods Receipts</CardTitle>
          <CardDescription>
            View and manage goods receipt notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GRN Number</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Receipt Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => {
                const statusConfig = RECEIPT_STATUS.find(s => s.value === receipt.status);
                return (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono">{receipt.grn_number}</TableCell>
                    <TableCell>{receipt.purchase_order?.po_number}</TableCell>
                    <TableCell>{receipt.supplier?.name}</TableCell>
                    <TableCell>{new Date(receipt.receipt_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig?.color as any}>
                        {statusConfig?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{receipt.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {receipt.status === "draft" && (
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create GRN Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-[98vw] w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Create Goods Receipt Note
            </DialogTitle>
            <DialogDescription>
              Receive goods from suppliers and update inventory
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grn_number">GRN Number</Label>
                <Input
                  id="grn_number"
                  value={formData.grn_number}
                  onChange={(e) => setFormData({ ...formData, grn_number: e.target.value })}
                  placeholder="GRN202401001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt_date">Receipt Date</Label>
                <Input
                  id="receipt_date"
                  type="date"
                  value={formData.receipt_date}
                  onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_invoice_number">Supplier Invoice #</Label>
                <Input
                  id="supplier_invoice_number"
                  value={formData.supplier_invoice_number}
                  onChange={(e) => setFormData({ ...formData, supplier_invoice_number: e.target.value })}
                  placeholder="INV-ABC-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_invoice_date">Invoice Date</Label>
                <Input
                  id="supplier_invoice_date"
                  type="date"
                  value={formData.supplier_invoice_date}
                  onChange={(e) => setFormData({ ...formData, supplier_invoice_date: e.target.value })}
                />
              </div>
            </div>

            {/* Purchase Order Selection */}
            <div className="space-y-2">
              <Label htmlFor="po_id">Purchase Order</Label>
              <Select
                value={formData.po_id}
                onValueChange={handlePOSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select purchase order" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      <div className="flex flex-col">
                        <span>{po.po_number}</span>
                        <span className="text-sm text-muted-foreground">
                          {po.supplier?.name} - ₹{po.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPO && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Supplier:</strong> {selectedPO.supplier?.name}</p>
                      <p><strong>PO Date:</strong> {new Date(selectedPO.po_date).toLocaleDateString()}</p>
                      <p><strong>Expected Delivery:</strong> {selectedPO.expected_delivery_date ? new Date(selectedPO.expected_delivery_date).toLocaleDateString() : "Not specified"}</p>
                    </div>
                    <div>
                      <p><strong>PO Amount:</strong> ₹{selectedPO.total_amount.toLocaleString()}</p>
                      <p><strong>Payment Terms:</strong> {selectedPO.payment_terms} days</p>
                      <p><strong>Status:</strong> {selectedPO.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Items Section */}
            {receiptItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Goods Inspection
                </h3>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Accepted</TableHead>
                      <TableHead>Rejected</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiptItems.map((item, index) => {
                      const qualityConfig = QUALITY_STATUS.find(q => q.value === item.quality_status);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              <p className="text-sm text-muted-foreground">HSN: {item.hsn_code}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.ordered_quantity} {item.unit_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.received_quantity}
                              onChange={(e) => updateReceiptItem(index, 'received_quantity', Number(e.target.value))}
                              className="w-20"
                              min="0"
                              max={item.ordered_quantity}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.accepted_quantity}
                              onChange={(e) => updateReceiptItem(index, 'accepted_quantity', Number(e.target.value))}
                              className="w-20"
                              min="0"
                              max={item.received_quantity}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.rejected_quantity}
                              onChange={(e) => updateReceiptItem(index, 'rejected_quantity', Number(e.target.value))}
                              className="w-20"
                              min="0"
                              max={item.received_quantity - item.accepted_quantity}
                            />
                          </TableCell>
                          <TableCell>₹{item.unit_price.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={qualityConfig?.color as any}>
                              {qualityConfig?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{item.total_price.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <Separator />

                {/* Additional Charges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="freight_charges">Freight Charges (₹)</Label>
                        <Input
                          id="freight_charges"
                          type="number"
                          value={formData.freight_charges}
                          onChange={(e) => setFormData({ ...formData, freight_charges: Number(e.target.value) })}
                          min="0"
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
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Notes about the goods receipt..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Receipt Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{totals.subtotal.toLocaleString()}</span>
                      </div>
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
                      {formData.freight_charges > 0 && (
                        <div className="flex justify-between">
                          <span>Freight:</span>
                          <span>₹{formData.freight_charges.toLocaleString()}</span>
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
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={() => handleSave("draft")}>
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button variant="outline" onClick={() => handleSave("received")}>
                    <Truck className="h-4 w-4 mr-2" />
                    Mark as Received
                  </Button>
                  <Button onClick={() => handleSave("accepted")} className="holographic text-white">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept & Update Stock
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}