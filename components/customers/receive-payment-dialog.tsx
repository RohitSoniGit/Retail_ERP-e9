"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
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
import { formatCurrency, type Customer } from "@/lib/types";
import { Loader2, DollarSign } from "lucide-react";

interface ReceivePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onSuccess: () => void;
}

export function ReceivePaymentDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: ReceivePaymentDialogProps) {
  const { organizationId } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: customer.current_balance.toString(),
    payment_mode: "cash",
    reference_number: "",
    notes: "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const generateVoucherNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `RV${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    try {
      // Create receipt voucher
      const { error: voucherError } = await supabase.from("vouchers").insert({
        organization_id: organizationId,
        voucher_number: generateVoucherNumber(),
        voucher_type: "receipt",
        party_id: customer.id,
        party_name: customer.name,
        amount: amount,
        reference_number: formData.reference_number || null,
        narration: formData.notes || `Payment received from ${customer.name}`,
        voucher_date: new Date().toISOString(),
      });

      if (voucherError) throw voucherError;

      // Update customer balance
      const newBalance = Math.max(0, customer.current_balance - amount);
      const { error: customerError } = await supabase
        .from("customers")
        .update({
          current_balance: newBalance,
        })
        .eq("id", customer.id);

      if (customerError) throw customerError;

      // Reset form
      setFormData({
        amount: "",
        payment_mode: "cash",
        reference_number: "",
        notes: "",
      });

      onSuccess();
    } catch (error) {
      console.error("Error receiving payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxAmount = customer.current_balance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Receive Payment
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Customer</p>
          <p className="font-medium">{customer.name}</p>
          <p className="text-sm text-red-600">
            Outstanding: {formatCurrency(customer.current_balance)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Receive *</Label>
            <Input
              id="amount"
              type="number"
              max={maxAmount}
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="Enter amount"
              required
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, amount: (maxAmount / 2).toString() })}
              >
                Half
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, amount: maxAmount.toString() })}
              >
                Full Amount
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Select
              value={formData.payment_mode}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_mode: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.payment_mode !== "cash" && (
            <div className="space-y-2">
              <Label htmlFor="reference">Reference / UTR No.</Label>
              <Input
                id="reference"
                value={formData.reference_number}
                onChange={(e) =>
                  setFormData({ ...formData, reference_number: e.target.value })
                }
                placeholder="Transaction reference"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Payment notes"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Receive Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}