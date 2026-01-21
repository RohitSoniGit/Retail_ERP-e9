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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  CreditCard,
  DollarSign,
  Receipt,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
} from "lucide-react";
import { AdvancePayment, Supplier, PurchaseOrder } from "@/lib/types";
import { toast } from "sonner";

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

interface AdvancePaymentFormProps {
  purchaseOrder?: PurchaseOrder;
  onSave?: (advance: AdvancePayment) => void;
}

export function AdvancePaymentForm({ purchaseOrder, onSave }: AdvancePaymentFormProps) {
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    payment_number: "",
    supplier_id: purchaseOrder?.supplier_id || "",
    po_id: purchaseOrder?.id || "",
    advance_amount: 0,
    payment_mode: "bank_transfer" as const,
    reference_number: "",
    payment_date: new Date().toISOString().split('T')[0],
    purpose: "",
    notes: "",
  });

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

    const mockPOs: PurchaseOrder[] = [
      {
        id: "1",
        organization_id: "org1",
        po_number: "PO202401001",
        supplier_id: "1",
        po_date: "2024-01-15",
        status: "confirmed",
        subtotal: 100000,
        discount_percent: 0,
        discount_amount: 0,
        cgst_amount: 9000,
        sgst_amount: 9000,
        igst_amount: 0,
        other_charges: 0,
        round_off: 0,
        total_amount: 118000,
        advance_paid: 25000,
        balance_amount: 93000,
        payment_terms: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: mockSuppliers[0],
      },
    ];

    const mockAdvances: AdvancePayment[] = [
      {
        id: "1",
        organization_id: "org1",
        payment_number: "ADV202401001",
        payment_type: "supplier_advance",
        party_id: "1",
        party_name: "ABC Electronics Pvt Ltd",
        party_type: "supplier",
        po_id: "1",
        advance_amount: 25000,
        utilized_amount: 0,
        balance_amount: 25000,
        payment_mode: "bank_transfer",
        reference_number: "TXN123456",
        payment_date: "2024-01-16",
        purpose: "Advance for PO202401001",
        notes: "Advance payment for purchase order",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: mockSuppliers[0],
        purchase_order: mockPOs[0],
      },
    ];

    setSuppliers(mockSuppliers);
    setPurchaseOrders(mockPOs);
    setAdvances(mockAdvances);

    // Generate payment number
    const paymentNumber = `ADV${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-3)}`;
    setFormData(prev => ({ ...prev, payment_number: paymentNumber }));
  }, []);

  const handleSave = () => {
    if (!formData.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }

    if (formData.advance_amount <= 0) {
      toast.error("Please enter a valid advance amount");
      return;
    }

    const supplier = suppliers.find(s => s.id === formData.supplier_id);
    const po = purchaseOrders.find(p => p.id === formData.po_id);

    const advancePayment: AdvancePayment = {
      id: Date.now().toString(),
      organization_id: "org1",
      payment_number: formData.payment_number,
      payment_type: "supplier_advance",
      party_id: formData.supplier_id,
      party_name: supplier?.name || "",
      party_type: "supplier",
      po_id: formData.po_id || undefined,
      advance_amount: formData.advance_amount,
      utilized_amount: 0,
      balance_amount: formData.advance_amount,
      payment_mode: formData.payment_mode,
      reference_number: formData.reference_number,
      payment_date: formData.payment_date,
      purpose: formData.purpose,
      notes: formData.notes,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      supplier,
      purchase_order: po,
    };

    setAdvances([...advances, advancePayment]);
    onSave?.(advancePayment);
    toast.success("Advance payment recorded successfully!");
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      payment_number: `ADV${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-3)}`,
      supplier_id: purchaseOrder?.supplier_id || "",
      po_id: purchaseOrder?.id || "",
      advance_amount: 0,
      payment_mode: "bank_transfer",
      reference_number: "",
      payment_date: new Date().toISOString().split('T')[0],
      purpose: "",
      notes: "",
    });
  };

  const totalAdvances = advances.reduce((sum, adv) => sum + adv.advance_amount, 0);
  const activeAdvances = advances.filter(adv => adv.status === "active");
  const utilizedAdvances = advances.filter(adv => adv.utilized_amount > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Advance Payments</h3>
          <p className="text-sm text-muted-foreground">
            Manage supplier advance payments and track utilization
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="holographic text-white">
          <Plus className="h-4 w-4 mr-2" />
          Record Advance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">₹{totalAdvances.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Advances</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeAdvances.length}</p>
                <p className="text-sm text-muted-foreground">Active Advances</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{utilizedAdvances.length}</p>
                <p className="text-sm text-muted-foreground">Utilized</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  ₹{activeAdvances.reduce((sum, adv) => sum + adv.balance_amount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Available Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advances Table */}
      <Card className="glass border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Advance Payment Records</CardTitle>
          <CardDescription>
            Track all supplier advance payments and their utilization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Utilized</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances.map((advance) => (
                <TableRow key={advance.id}>
                  <TableCell className="font-mono">{advance.payment_number}</TableCell>
                  <TableCell>{new Date(advance.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{advance.party_name}</p>
                      <p className="text-sm text-muted-foreground">{advance.supplier?.supplier_code}</p>
                    </div>
                  </TableCell>
                  <TableCell>{advance.purchase_order?.po_number || "N/A"}</TableCell>
                  <TableCell>₹{advance.advance_amount.toLocaleString()}</TableCell>
                  <TableCell>₹{advance.utilized_amount.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">
                    ₹{advance.balance_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={advance.status === "active" ? "default" : "secondary"}>
                      {advance.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {advance.balance_amount > 0 && (
                        <Button size="sm" variant="outline">
                          Utilize
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record Advance Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Record Advance Payment
            </DialogTitle>
            <DialogDescription>
              Record an advance payment made to supplier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_number">Payment Number</Label>
                <Input
                  id="payment_number"
                  value={formData.payment_number}
                  onChange={(e) => setFormData({ ...formData, payment_number: e.target.value })}
                  placeholder="ADV202401001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <div>
                          <p>{supplier.name}</p>
                          <p className="text-sm text-muted-foreground">{supplier.supplier_code}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="po_id">Purchase Order (Optional)</Label>
              <Select
                value={formData.po_id}
                onValueChange={(value) => setFormData({ ...formData, po_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select purchase order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific PO</SelectItem>
                  {purchaseOrders
                    .filter(po => po.supplier_id === formData.supplier_id)
                    .map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        <div>
                          <p>{po.po_number}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{po.total_amount.toLocaleString()} - {po.status}
                          </p>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="advance_amount">Advance Amount (₹)</Label>
                <Input
                  id="advance_amount"
                  type="number"
                  value={formData.advance_amount}
                  onChange={(e) => setFormData({ ...formData, advance_amount: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_mode">Payment Mode</Label>
                <Select
                  value={formData.payment_mode}
                  onValueChange={(value: any) => setFormData({ ...formData, payment_mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder-mode" disabled className="hidden">Select mode</SelectItem>
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="Transaction/Cheque number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Purpose of advance"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            {/* Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Advance Amount:</span>
                    <span className="font-medium">₹{formData.advance_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Mode:</span>
                    <span>{PAYMENT_MODES.find(m => m.value === formData.payment_mode)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span>{formData.reference_number || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="holographic text-white">
                <CreditCard className="h-4 w-4 mr-2" />
                Record Advance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}