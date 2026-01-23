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
import { useOrganization } from "@/lib/context/organization";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import useSWR from "swr";

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
  const { organizationId } = useOrganization();
  const supabase = getSupabaseBrowserClient();

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

  // Fetch Suppliers
  const { data: suppliersData } = useSWR(
    organizationId ? `suppliers-${organizationId}` : null,
    async () => {
      const { data } = await supabase.from('suppliers').select('*').eq('organization_id', organizationId);
      return (data as Supplier[]) || [];
    }
  );

  // Fetch POs
  const { data: posData } = useSWR(
    organizationId ? `pos-${organizationId}` : null,
    async () => {
      const { data } = await supabase.from('purchase_orders').select('*').eq('organization_id', organizationId);
      return (data as PurchaseOrder[]) || [];
    }
  );

  // Fetch Payments
  const { data: paymentsData, mutate: mutatePayments } = useSWR(
    organizationId ? `payments-${organizationId}` : null,
    async () => {
      const { data } = await supabase
        .from('supplier_payments')
        .select(`
          *,
          supplier:suppliers(*),
          payment_allocations(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      return (data as SupplierPayment[]) || [];
    }
  );

  const suppliers = suppliersData || [];
  const purchaseOrders = posData || [];
  const payments = paymentsData || [];

  // Generate payment number
  useEffect(() => {
    if (!selectedPayment && organizationId && isCreating) {
      const paymentNumber = `PAY${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-3)}`;
      setFormData(prev => ({ ...prev, payment_number: paymentNumber }));
    }
  }, [selectedPayment, organizationId, isCreating]);

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

  const handleSave = async () => {
    if (!formData.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }

    if (formData.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const netAmount = formData.amount - formData.tds_amount;

    // Validate allocations
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated_amount, 0);
    if (totalAllocated > formData.amount) {
      toast.error("Allocated amount cannot exceed total payment amount");
      return;
    }

    try {
      const paymentData = {
        organization_id: organizationId,
        payment_number: formData.payment_number,
        supplier_id: formData.supplier_id,
        payment_date: formData.payment_date,
        payment_mode: formData.payment_mode,
        reference_number: formData.reference_number,
        amount: formData.amount,
        tds_amount: formData.tds_amount,
        net_amount: netAmount,
        status: "pending", // Default to pending
        notes: formData.notes,
        updated_at: new Date().toISOString(),
      };

      let paymentId = selectedPayment?.id;

      if (selectedPayment) {
        // Update
        const { error: pError } = await supabase
          .from("supplier_payments")
          .update(paymentData)
          .eq("id", paymentId);
        if (pError) throw pError;

        // Delete existing allocations
        const { error: dError } = await supabase
          .from("payment_allocations")
          .delete()
          .eq("payment_id", paymentId);
        if (dError) throw dError;
      } else {
        // Create
        const { data: newPayment, error: pError } = await supabase
          .from("supplier_payments")
          .insert([{ ...paymentData, created_at: new Date().toISOString(), created_by: "current_user" }])
          .select()
          .single();
        if (pError) throw pError;
        paymentId = newPayment.id;
      }

      // Insert Allocations
      if (allocations.length > 0) {
        const allocationsToInsert = allocations.map(a => ({
          payment_id: paymentId,
          reference_type: a.reference_type,
          reference_id: a.reference_id,
          reference_number: a.reference_number,
          allocated_amount: a.allocated_amount,
          created_at: new Date().toISOString()
        }));

        const { error: aError } = await supabase
          .from("payment_allocations")
          .insert(allocationsToInsert);
        if (aError) throw aError;
      }

      toast.success(selectedPayment ? "Payment updated successfully!" : "Payment recorded successfully!");
      mutatePayments();
      setIsCreating(false);
      setSelectedPayment(null);
      resetForm();

    } catch (error: any) {
      console.error("Error saving payment:", error);
      toast.error(error.message || "Failed to save payment");
    }
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
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedPayment(payment);
                          setFormData({
                            payment_number: payment.payment_number,
                            supplier_id: payment.supplier_id,
                            payment_date: payment.payment_date.split('T')[0],
                            payment_mode: payment.payment_mode as any,
                            reference_number: payment.reference_number || "",
                            amount: payment.amount,
                            tds_amount: payment.tds_amount || 0,
                            notes: payment.notes || "",
                          });
                          setAllocations(payment.payment_allocations || []);
                          setIsCreating(true);
                        }}>
                          <Receipt className="h-3 w-3 mr-1" />
                          Edit
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