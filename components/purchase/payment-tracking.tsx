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
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Receipt,
  Building2,
} from "lucide-react";
import { SupplierPayment, PaymentAllocation, Supplier, PurchaseOrder } from "@/lib/types";
import { toast } from "sonner";

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

const PAYMENT_STATUS = [
  { value: "pending", label: "Pending", color: "secondary" },
  { value: "cleared", label: "Cleared", color: "default" },
  { value: "bounced", label: "Bounced", color: "destructive" },
  { value: "cancelled", label: "Cancelled", color: "secondary" },
];

export function PaymentTracking() {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<SupplierPayment | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "cleared" | "bounced">("all");
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  
  const [formData, setFormData] = useState({
    payment_number: "",
    supplier_id: "",
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: "bank_transfer" as const,
    reference_number: "",
    amount: 0,
    tds_amount: 0,
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
      {
        id: "2",
        organization_id: "org1",
        supplier_code: "SUP002",
        name: "XYZ Trading Company",
        contact_person: "Priya Sharma",
        phone: "+91 87654 32109",
        email: "priya@xyztrading.com",
        state_code: "07",
        gstin: "07XYZAB5678G2H9",
        payment_terms: 15,
        credit_limit: 200000,
        current_balance: 45000,
        supplier_type: "distributor",
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
        status: "completed",
        subtotal: 100000,
        discount_percent: 0,
        discount_amount: 0,
        cgst_amount: 9000,
        sgst_amount: 9000,
        igst_amount: 0,
        other_charges: 0,
        round_off: 0,
        total_amount: 118000,
        advance_paid: 0,
        balance_amount: 118000,
        payment_terms: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: mockSuppliers[0],
      },
    ];

    const mockPayments: SupplierPayment[] = [
      {
        id: "1",
        organization_id: "org1",
        payment_number: "PAY202401001",
        supplier_id: "1",
        payment_date: "2024-01-25",
        payment_mode: "bank_transfer",
        reference_number: "TXN123456789",
        amount: 118000,
        tds_amount: 2000,
        net_amount: 116000,
        status: "cleared",
        notes: "Payment for PO202401001",
        created_by: "user1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: mockSuppliers[0],
        payment_allocations: [
          {
            id: "1",
            payment_id: "1",
            reference_type: "purchase_order",
            reference_id: "1",
            reference_number: "PO202401001",
            allocated_amount: 118000,
            created_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: "2",
        organization_id: "org1",
        payment_number: "PAY202401002",
        supplier_id: "2",
        payment_date: "2024-01-20",
        payment_mode: "cheque",
        reference_number: "CHQ001234",
        amount: 45000,
        tds_amount: 900,
        net_amount: 44100,
        status: "pending",
        notes: "Advance payment",
        created_by: "user1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: mockSuppliers[1],
        payment_allocations: [
          {
            id: "2",
            payment_id: "2",
            reference_type: "advance",
            reference_id: "2",
            reference_number: "ADV-002",
            allocated_amount: 45000,
            created_at: new Date().toISOString(),
          },
        ],
      },
    ];

    setSuppliers(mockSuppliers);
    setPurchaseOrders(mockPOs);
    setPayments(mockPayments);

    // Generate payment number
    const paymentNumber = `PAY${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-3)}`;
    setFormData(prev => ({ ...prev, payment_number: paymentNumber }));
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const addAllocation = () => {
    const newAllocation: PaymentAllocation = {
      id: Date.now().toString(),
      payment_id: "",
      reference_type: "purchase_order",
      reference_id: "",
      reference_number: "",
      allocated_amount: 0,
      created_at: new Date().toISOString(),
    };
    setAllocations([...allocations, newAllocation]);
  };

  const updateAllocation = (index: number, field: keyof PaymentAllocation, value: any) => {
    const updatedAllocations = [...allocations];
    updatedAllocations[index] = { ...updatedAllocations[index], [field]: value };
    setAllocations(updatedAllocations);
  };

  const removeAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!formData.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }

    if (formData.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const netAmount = formData.amount - formData.tds_amount;
    
    const supplierPayment: SupplierPayment = {
      id: selectedPayment?.id || Date.now().toString(),
      organization_id: "org1",
      payment_number: formData.payment_number,
      supplier_id: formData.supplier_id,
      payment_date: formData.payment_date,
      payment_mode: formData.payment_mode,
      reference_number: formData.reference_number,
      amount: formData.amount,
      tds_amount: formData.tds_amount,
      net_amount: netAmount,
      status: "pending",
      notes: formData.notes,
      created_by: "current_user",
      created_at: selectedPayment?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      supplier: suppliers.find(s => s.id === formData.supplier_id),
      payment_allocations: allocations,
    };

    if (selectedPayment) {
      setPayments(payments.map(p => p.id === selectedPayment.id ? supplierPayment : p));
      toast.success("Payment updated successfully!");
    } else {
      setPayments([...payments, supplierPayment]);
      toast.success("Payment recorded successfully!");
    }

    setIsCreating(false);
    setSelectedPayment(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      payment_number: `PAY${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-3)}`,
      supplier_id: "",
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: "bank_transfer",
      reference_number: "",
      amount: 0,
      tds_amount: 0,
      notes: "",
    });
    setAllocations([]);
  };

  const handleStatusUpdate = (paymentId: string, newStatus: "pending" | "cleared" | "bounced" | "cancelled") => {
    setPayments(payments.map(p => 
      p.id === paymentId 
        ? { ...p, status: newStatus, updated_at: new Date().toISOString() }
        : p
    ));
    toast.success(`Payment status updated to ${newStatus}`);
  };

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingPayments = payments.filter(p => p.status === "pending");
  const clearedPayments = payments.filter(p => p.status === "cleared");
  const bouncedPayments = payments.filter(p => p.status === "bounced");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Payment Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage supplier payments
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="holographic text-white">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">₹{totalPayments.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{clearedPayments.length}</p>
                <p className="text-sm text-muted-foreground">Cleared</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{bouncedPayments.length}</p>
                <p className="text-sm text-muted-foreground">Bounced</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-0 shadow-lg"
          />
        </div>
        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <SelectTrigger className="w-48 glass border-0 shadow-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cleared">Cleared</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card className="glass border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            Track all supplier payments and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>TDS</TableHead>
                <TableHead>Net Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const statusConfig = PAYMENT_STATUS.find(s => s.value === payment.status);
                const modeConfig = PAYMENT_MODES.find(m => m.value === payment.payment_mode);
                
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono">{payment.payment_number}</TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.supplier?.name}</p>
                        <p className="text-sm text-muted-foreground">{payment.supplier?.supplier_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{modeConfig?.label}</TableCell>
                    <TableCell className="font-mono">{payment.reference_number}</TableCell>
                    <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                    <TableCell>₹{payment.tds_amount.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">₹{payment.net_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig?.color as any}>
                        {statusConfig?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Receipt className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {payment.status === "pending" && (
                          <Select onValueChange={(value: any) => handleStatusUpdate(payment.id, value)}>
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue placeholder="Update" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cleared">Clear</SelectItem>
                              <SelectItem value="bounced">Bounce</SelectItem>
                              <SelectItem value="cancelled">Cancel</SelectItem>
                            </SelectContent>
                          </Select>
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

      {/* Record Payment Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Record Supplier Payment
            </DialogTitle>
            <DialogDescription>
              Record a new payment made to supplier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_number">Payment Number</Label>
                <Input
                  id="payment_number"
                  value={formData.payment_number}
                  onChange={(e) => setFormData({ ...formData, payment_number: e.target.value })}
                  placeholder="PAY202401001"
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
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="Transaction/Cheque number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tds_amount">TDS Amount (₹)</Label>
                <Input
                  id="tds_amount"
                  type="number"
                  value={formData.tds_amount}
                  onChange={(e) => setFormData({ ...formData, tds_amount: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <Separator />

            {/* Payment Allocations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Payment Allocation</h3>
                <Button onClick={addAllocation} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Allocation
                </Button>
              </div>

              {allocations.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((allocation, index) => (
                      <TableRow key={allocation.id}>
                        <TableCell>
                          <Select
                            value={allocation.reference_type}
                            onValueChange={(value: any) => updateAllocation(index, 'reference_type', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="purchase_order">Purchase Order</SelectItem>
                              <SelectItem value="advance">Advance</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={allocation.reference_number}
                            onChange={(e) => updateAllocation(index, 'reference_number', e.target.value)}
                            placeholder="Reference number"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={allocation.allocated_amount}
                            onChange={(e) => updateAllocation(index, 'allocated_amount', Number(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAllocation(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Payment notes..."
                rows={3}
              />
            </div>

            {/* Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Payment Amount:</span>
                    <span>₹{formData.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TDS Deducted:</span>
                    <span>₹{formData.tds_amount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Net Amount:</span>
                    <span>₹{(formData.amount - formData.tds_amount).toLocaleString()}</span>
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
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}