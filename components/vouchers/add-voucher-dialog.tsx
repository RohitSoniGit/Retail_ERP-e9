"use client";

import React from "react"

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
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
import { type Customer } from "@/lib/types";
import { Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface AddVoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucherType: "receipt" | "payment";
  onSuccess: () => void;
}

export function AddVoucherDialog({
  open,
  onOpenChange,
  voucherType,
  onSuccess,
}: AddVoucherDialogProps) {
  const { organizationId } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    party_id: "",
    party_name: "",
    amount: "",
    payment_mode: "cash",
    reference_number: "",
    narration: "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch customers
  const { data: customers } = useSWR(
    organizationId ? `customers-voucher-${organizationId}` : null,
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

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        party_id: "",
        party_name: "",
        amount: "",
        payment_mode: "cash",
        reference_number: "",
        narration: "",
      });
    }
  }, [open]);

  const generateVoucherNumber = () => {
    const prefix = voucherType === "receipt" ? "RV" : "PV";
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}${year}${month}-${random}`;
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers?.find((c) => c.id === customerId);
    setFormData({
      ...formData,
      party_id: customerId,
      party_name: customer?.name || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    try {
      // Create voucher
      const { error: voucherError } = await supabase.from("vouchers").insert({
        organization_id: organizationId,
        voucher_number: generateVoucherNumber(),
        voucher_type: voucherType,
        party_id: formData.party_id || null,
        party_name: formData.party_name || null,
        amount: amount,
        reference_number: formData.reference_number || null,
        narration: formData.narration || `${voucherType === "receipt" ? "Received" : "Paid"} via ${formData.payment_mode}`,
        voucher_date: new Date().toISOString(),
      });

      if (voucherError) throw voucherError;

      // Update customer balance if party selected
      if (formData.party_id) {
        const customer = customers?.find((c) => c.id === formData.party_id);
        if (customer) {
          const balanceChange = voucherType === "receipt" ? -amount : amount;
          await supabase
            .from("customers")
            .update({
              current_balance: customer.current_balance + balanceChange,
            })
            .eq("id", formData.party_id);
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error creating voucher:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReceipt = voucherType === "receipt";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReceipt ? (
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-red-600" />
            )}
            {isReceipt ? "New Receipt" : "New Payment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Party (Optional)</Label>
            <Select
              value={formData.party_id}
              onValueChange={handleCustomerChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Party</SelectItem>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!formData.party_id && (
            <div className="space-y-2">
              <Label htmlFor="party_name">Party Name</Label>
              <Input
                id="party_name"
                value={formData.party_name}
                onChange={(e) =>
                  setFormData({ ...formData, party_name: e.target.value })
                }
                placeholder="Enter name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="Enter amount"
              required
              autoFocus
            />
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
            <Label htmlFor="narration">Narration</Label>
            <Textarea
              id="narration"
              value={formData.narration}
              onChange={(e) =>
                setFormData({ ...formData, narration: e.target.value })
              }
              placeholder="Notes about this transaction"
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
              className={`flex-1 ${
                isReceipt
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isReceipt ? "Receive" : "Pay"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
