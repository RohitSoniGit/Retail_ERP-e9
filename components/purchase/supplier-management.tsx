"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Edit,
  Trash2,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Users,
  TrendingUp,
} from "lucide-react";
import { Supplier, INDIAN_STATES } from "@/lib/types";
import { toast } from "sonner";

import { useOrganization } from "@/lib/context/organization";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import useSWR from "swr";
import { Loader2 } from "lucide-react";

const SUPPLIER_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "distributor", label: "Distributor" },
  { value: "importer", label: "Importer" },
];

export function SupplierManagement() {
  const { organizationId } = useOrganization();
  const supabase = getSupabaseBrowserClient();

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    supplier_code: "",
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state_code: "27",
    pincode: "",
    gstin: "",
    pan_number: "",
    bank_name: "",
    bank_account: "",
    ifsc_code: "",
    payment_terms: 30,
    credit_limit: 0,
    supplier_type: "regular" as "regular" | "manufacturer" | "distributor" | "importer",
  });

  const { data: suppliersData, isLoading, mutate } = useSWR(
    organizationId ? `suppliers-${organizationId}` : null,
    async () => {
      const { data } = await supabase
        .from("suppliers")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      return (data as Supplier[]) || [];
    }
  );

  const suppliers = suppliersData || [];

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!organizationId) return;

    try {
      if (selectedSupplier) {
        // Update
        const { error } = await supabase
          .from("suppliers")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedSupplier.id);

        if (error) throw error;
        toast.success("Supplier updated successfully!");
      } else {
        // Create
        const { error } = await supabase
          .from("suppliers")
          .insert({
            organization_id: organizationId,
            ...formData,
            current_balance: 0,
            is_active: true,
          });

        if (error) throw error;
        toast.success("Supplier created successfully!");
      }

      mutate(); // Refresh list
      setIsEditing(false);
      setSelectedSupplier(null);
      resetForm();
    } catch (error: any) {
      console.error("Error saving supplier:", error);
      toast.error(`Failed to save supplier: ${error.message}`);
    }
  };

  const handleDelete = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierId);

      if (error) throw error;

      toast.success("Supplier deleted successfully!");
      mutate();
    } catch (error: any) {
      console.error("Error deleting supplier:", error);
      toast.error("Failed to delete supplier");
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_code: "",
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state_code: "27",
      pincode: "",
      gstin: "",
      pan_number: "",
      bank_name: "",
      bank_account: "",
      ifsc_code: "",
      payment_terms: 30,
      credit_limit: 0,
      supplier_type: "regular",
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Helper for edit (reuse logic)
  // ... (rest of render)


  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      supplier_code: supplier.supplier_code,
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state_code: supplier.state_code,
      pincode: supplier.pincode || "",
      gstin: supplier.gstin || "",
      pan_number: supplier.pan_number || "",
      bank_name: supplier.bank_name || "",
      bank_account: supplier.bank_account || "",
      ifsc_code: supplier.ifsc_code || "",
      payment_terms: supplier.payment_terms,
      credit_limit: supplier.credit_limit,
      supplier_type: supplier.supplier_type,
    });
    setIsEditing(true);
  };

  const generateSupplierCode = () => {
    const count = suppliers.length + 1;
    return `SUP${count.toString().padStart(3, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Supplier Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage your suppliers and vendor relationships
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ ...formData, supplier_code: generateSupplierCode() });
            setIsEditing(true);
          }}
          className="holographic text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{suppliers.length}</p>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{suppliers.filter(s => s.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Suppliers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  ₹{suppliers.reduce((sum, s) => sum + s.current_balance, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 glass border-0 shadow-lg h-11"
        />
      </div>

      {/* Suppliers Table */}
      <Card className="glass border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Suppliers List</CardTitle>
          <CardDescription>
            Manage your supplier database and track outstanding balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-mono">{supplier.supplier_code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {supplier.phone}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {SUPPLIER_TYPES.find(t => t.value === supplier.supplier_type)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={supplier.current_balance > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                      ₹{supplier.current_balance.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.is_active ? "default" : "secondary"}>
                      {supplier.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
            <DialogDescription>
              Enter supplier details and contact information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_code">Supplier Code</Label>
                <Input
                  id="supplier_code"
                  value={formData.supplier_code}
                  onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })}
                  placeholder="SUP001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_type">Supplier Type</Label>
                <Select
                  value={formData.supplier_type}
                  onValueChange={(value: any) => setFormData({ ...formData, supplier_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@supplier.com"
                />
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-4">
              <h4 className="font-medium">Address</h4>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state_code">State</Label>
                  <Select
                    value={formData.state_code}
                    onValueChange={(value) => setFormData({ ...formData, state_code: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="123456"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Tax & Banking */}
            <div className="space-y-4">
              <h4 className="font-medium">Tax & Banking Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    placeholder="27ABCDE1234F1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    value={formData.pan_number}
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="HDFC Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account">Account Number</Label>
                  <Input
                    id="bank_account"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc_code">IFSC Code</Label>
                  <Input
                    id="ifsc_code"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                    placeholder="HDFC0001234"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Terms */}
            <div className="space-y-4">
              <h4 className="font-medium">Payment Terms</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                  <Input
                    id="payment_terms"
                    type="number"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: Number(e.target.value) })}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                    placeholder="500000"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="holographic text-white">
                {selectedSupplier ? "Update" : "Create"} Supplier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}