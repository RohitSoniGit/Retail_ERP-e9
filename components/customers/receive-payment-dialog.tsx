"use client";

import React from "react"

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
import { Loader2 } from "lucide-react";

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
    amount: "",
    payment_mode: "cash",
    reference_number: "",
    narration: "",
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
        narration: formData.narration || `Payment received via ${formData.payment_mode}`,
        voucher_date: new Date().toISOString(),
      });

      if (voucherError) throw voucherError;

      // Update customer balance
      const { error: updateError } = await supabase
        .from("customers")
        .update({
          current_balance: customer.current_balance - amount,
        })
        .eq("id", customer.id);

      if (updateError) throw updateError;

      setFormData({
        amount: "",
        payment_mode: "cash",
        reference_number: "",
        narration: "",
      });
      onSuccess();
    } catch (error) {
      console.error("Error recording payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Receive Payment</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-muted-foreground">Receiving from</p>
          <p className="font-medium">{customer.name}</p>
          <p className="text-sm">
            Current Due: <span className="text-red-600 font-medium">{formatCurrency(customer.current_balance)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
              required
              autoFocus
            />
            {customer.current_balance > 0 && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setFormData({ ...formData, amount: customer.current_balance.toString() })}
              >
                Receive full amount ({formatCurrency(customer.current_balance)})
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_mode">Payment Mode</Label>
            <Select
              value={formData.payment_mode}
              onValueChange={(value) => setFormData({ ...formData, payment_mode: value })}
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
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="Transaction reference"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="narration">Narration (Optional)</Label>
            <Textarea
              id="narration"
              value={formData.narration}
              onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
              placeholder="Notes about this payment"
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
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Receive
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
