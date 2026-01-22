"use client";

import React from "react";
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
import { INDIAN_STATES } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SUPPLIER_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "distributor", label: "Distributor" },
  { value: "importer", label: "Importer" },
];

export function AddSupplierDialog({ open, onOpenChange, onSuccess }: AddSupplierDialogProps) {
  const { organizationId } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    supplier_code: "",
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state_code: "",
    pincode: "",
    gstin: "",
    pan_number: "",
    bank_name: "",
    bank_account: "",
    ifsc_code: "",
    payment_terms: "30",
    credit_limit: "",
    supplier_type: "regular" as "regular" | "manufacturer" | "distributor" | "importer",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const generateSupplierCode = () => {
    const timestamp = Date.now().toString().slice(-4);
    return `SUP${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const supplierCode = formData.supplier_code || generateSupplierCode();

      const { error } = await supabase.from("suppliers").insert({
        organization_id: organizationId,
        supplier_code: supplierCode,
        name: formData.name.trim(),
        contact_person: formData.contact_person || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        city: formData.city || null,
        state_code: formData.state_code || null,
        pincode: formData.pincode || null,
        gstin: formData.gstin || null,
        pan_number: formData.pan_number || null,
        bank_name: formData.bank_name || null,
        bank_account: formData.bank_account || null,
        ifsc_code: formData.ifsc_code || null,
        payment_terms: parseInt(formData.payment_terms) || 30,
        credit_limit: parseFloat(formData.credit_limit) || 0,
        supplier_type: formData.supplier_type,
        current_balance: 0,
        is_active: true,
      });

      if (error) throw error;

      // Reset form
      setFormData({
        supplier_code: "",
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state_code: "",
        pincode: "",
        gstin: "",
        pan_number: "",
        bank_name: "",
        bank_account: "",
        ifsc_code: "",
        payment_terms: "30",
        credit_limit: "",
        supplier_type: "regular",
      });

      onSuccess();
    } catch (error) {
      console.error("Error adding supplier:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto glass border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Add New Supplier</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="supplier_code" className="text-sm font-semibold">Supplier Code</Label>
              <Input
                id="supplier_code"
                value={formData.supplier_code}
                onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })}
                placeholder="Auto-generated if empty"
                className="glass border-0 shadow-inner h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_type" className="text-sm font-semibold">Type</Label>
              <Select
                value={formData.supplier_type}
                onValueChange={(value: "regular" | "manufacturer" | "distributor" | "importer") =>
                  setFormData({ ...formData, supplier_type: value })
                }
              >
                <SelectTrigger className="glass border-0 h-11 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-0">
                  {SUPPLIER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Supplier company name"
              required
              className="glass border-0 shadow-inner h-11 text-lg font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contact_person" className="text-sm font-semibold">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Contact person name"
                className="glass border-0 shadow-inner h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Mobile number"
                className="glass border-0 shadow-inner h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
              className="glass border-0 shadow-inner h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
              rows={2}
              className="glass border-0 shadow-inner min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-semibold">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="glass border-0 shadow-inner h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-semibold">State</Label>
              <Select
                value={formData.state_code}
                onValueChange={(value) => setFormData({ ...formData, state_code: value })}
              >
                <SelectTrigger className="glass border-0 h-11 shadow-sm">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="glass border-0 max-h-[200px]">
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode" className="text-sm font-semibold">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="Pincode"
                className="glass border-0 shadow-inner h-11"
              />
            </div>
          </div>

          {/* Tax Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="gstin" className="text-sm font-semibold">GSTIN</Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="15-digit GST number"
                maxLength={15}
                className="glass border-0 shadow-inner h-11 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan" className="text-sm font-semibold">PAN Number</Label>
              <Input
                id="pan"
                value={formData.pan_number}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                placeholder="10-digit PAN"
                maxLength={10}
                className="glass border-0 shadow-inner h-11 font-mono"
              />
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-2">
            <Label htmlFor="bank_name" className="text-sm font-semibold">Bank Name</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="Bank name"
              className="glass border-0 shadow-inner h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bank_account" className="text-sm font-semibold">Account Number</Label>
              <Input
                id="bank_account"
                value={formData.bank_account}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                placeholder="Bank account number"
                className="glass border-0 shadow-inner h-11 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifsc" className="text-sm font-semibold">IFSC Code</Label>
              <Input
                id="ifsc"
                value={formData.ifsc_code}
                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                placeholder="IFSC code"
                className="glass border-0 shadow-inner h-11 font-mono"
              />
            </div>
          </div>

          {/* Payment Terms */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="payment_terms" className="text-sm font-semibold">Payment Terms (Days)</Label>
              <Input
                id="payment_terms"
                type="number"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="30"
                className="glass border-0 shadow-inner h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit_limit" className="text-sm font-semibold">Credit Limit</Label>
              <Input
                id="credit_limit"
                type="number"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                placeholder="0"
                className="glass border-0 shadow-inner h-11"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 holographic text-white shadow-lg border-0" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Supplier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}