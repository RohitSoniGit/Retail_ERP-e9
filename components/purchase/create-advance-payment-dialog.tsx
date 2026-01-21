"use client";

import React from "react";
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
import { type Supplier, type Customer } from "@/lib/types";
import { Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface CreateAdvancePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentType: "supplier_advance" | "customer_advance";
  onSuccess: () => void;
}

export function CreateAdvancePaymentDialog({
  open,
  onOpenChange,
  paymentType,
  onSuccess,
}: CreateAdvancePaymentDialogProps) {
  const { organizationId } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    party_id: "",
    party_name: "",
    advance_amount: "",
    payment_mode: "cash",
    reference_number: "",
    purpose: "",
    notes: "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch suppliers or customers based on payment type
  const { data: parties } = useSWR(
    organizationId && paymentType ? `${paymentType}-parties-${organizationId}` : null,
    async () => {
      if (paymentType === "supplier_advance") {
        const { data, error } = await supabase
          .from("suppliers")
          .select("id, name, supplier_code")
          .eq("organization_id", organizationId)
          .eq("is_active", true)
          .order("name");

        if (error) throw error;
        return data as (Supplier & { supplier_code: string })[];
      } else {
        const { data, error } = await supabase
          .from("customers")
          .select("id, name, phone")
          .eq("organization_id", organizationId)
          .order("name");

        if (error) throw error;
        return data as Customer[];
      }
    }
  );

  // Reset form when dialog opens or payment type changes
  useEffect(() => {
    if (open) {
      setFormData({
        party_id: "",
        party_name: "",
        advance_amount: "",
        payment_mode: "cash",
        reference_number: "",
        purpose: "",
        notes: "",
      });
    }
  }, [open, paymentType]);

  const generatePaymentNumber = () => {
    const prefix = paymentType === "supplier_advance" ? "SA" : "CA";
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}${year}${month}-${random}`;
  };

  const handlePartyChange = (partyId: string) => {
    const party = parties?.find((p) => p.id === partyId);
    setFormData({
      ...formData,
      party_id: partyId,
      party_name: party?.name || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    const amount = parseFloat(formData.advance_amount);
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("advance_payments").insert({
        organization_id: organizationId,
        payment_number: generatePaymentNumber(),
        payment_type: paymentType,
        party_id: formData.party_id,
        party_name: formData.party_name,
        party_type: paymentType === "supplier_advance" ? "supplier" : "customer",
        advance_amount: amount,
        utilized_amount: 0,
        balance_amount: amount,
        payment_mode: formData.payment_mode,
        reference_number: formData.reference_number || null,
        payment_date: new Date().toISOString(),
        purpose: formData.purpose || null,
        notes: formData.notes || null,
        status: "active",
      });

      if (error) throw error;

      // Update party balance if needed
      if (formData.party_id) {
        if (paymentType === "supplier_advance") {
          // For supplier advance, reduce their payable balance
          const supplier = parties?.find((p) => p.id === formData.party_id) as Supplier;
          if (supplier) {
            await supabase
              .from("suppliers")
              .update({
                current_balance: (supplier.current_balance || 0) - amount,
              })
              .eq("id", formData.party_id);
          }
        } else {
          // For customer advance, increase their advance balance
          const customer = parties?.find((p) => p.id === formData.party_id) as Customer;
          if (customer) {
            await supabase
              .from("customers")
              .update({
                current_balance: (customer.current_balance || 0) - amount,
              })
              .eq("id", formData.party_id);
          }
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error creating advance payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSupplierAdvance = paymentType === "supplier_advance";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSupplierAdvance ? (
              <ArrowUpRight className="h-5 w-5 text-red-600" />
            ) : (
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
            )}
            {isSupplierAdvance ? "Supplier Advance" : "Customer Advance"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{isSupplierAdvance ? "Supplier" : "Customer"} *</Label>
            <Select
              value={formData.party_id}
              onValueChange={handlePartyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${isSupplierAdvance ? "supplier" : "customer"}`} />
              </SelectTrigger>
              <SelectContent>
                {parties?.map((party) => (
                  <SelectItem key={party.id} value={party.id}>
                    {party.name}
                    {isSupplierAdvance && " supplier_code" in party && ` (${party.supplier_code})`}
                    {!isSupplierAdvance && "phone" in party && party.phone && ` - ${party.phone}`}
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
            <Label htmlFor="amount">Advance Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.advance_amount}
              onChange={(e) =>
                setFormData({ ...formData, advance_amount: e.target.value })
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
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.payment_mode !== "cash" && (
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
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
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              placeholder={isSupplierAdvance ? "Purchase advance" : "Order advance"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes"
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
                isSupplierAdvance
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Advance
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}