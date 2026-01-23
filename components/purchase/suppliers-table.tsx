"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Users,
  Building2,
  CreditCard
} from "lucide-react";
import { Supplier } from "@/lib/types";
import { toast } from "sonner";
import { useOrganization } from "@/lib/context/organization";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import useSWR from "swr";

export function SuppliersTable() {
  const { organizationId } = useOrganization();
  const supabase = getSupabaseBrowserClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state_code: "27",
    pincode: "",
    gstin: "",
    payment_terms: 30,
    credit_limit: 0,
    supplier_type: "regular" as "regular" | "manufacturer" | "distributor" | "importer"
  });

  // Fetch suppliers from Supabase
  const { data: suppliers, mutate } = useSWR(
    organizationId ? `suppliers-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as Supplier[]) || [];
    }
  );

  const supplierList = suppliers || [];

  const filteredSuppliers = supplierList.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculations
  const totalSuppliers = supplierList.length;
  const activeSuppliers = supplierList.filter(s => s.is_active).length;
  const totalOutstanding = supplierList.reduce((sum, s) => sum + (s.current_balance || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organizationId) {
      toast.error("Organization ID is required");
      return;
    }

    try {
      if (editingSupplier) {
        // Update existing supplier
        const { error } = await supabase
          .from("suppliers")
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingSupplier.id);

        if (error) throw error;
        toast.success("Supplier updated successfully");
      } else {
        // Create new supplier - generate supplier code
        const supplierCount = supplierList.length;
        const supplierCode = `SUP${String(supplierCount + 1).padStart(3, '0')}`;

        const { error } = await supabase
          .from("suppliers")
          .insert({
            organization_id: organizationId,
            supplier_code: supplierCode,
            ...formData,
            current_balance: 0,
            is_active: true
          });

        if (error) throw error;
        toast.success("Supplier created successfully");
      }

      // Refresh data
      mutate();

      setIsDialogOpen(false);
      setEditingSupplier(null);
      resetForm();
    } catch (error: any) {
      console.error('Supplier save error:', error);
      toast.error(error.message || "Failed to save supplier");
    }
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;

    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierToDelete);

      if (error) throw error;

      toast.success("Supplier deleted successfully");
      mutate();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast.error("Failed to delete supplier");
    } finally {
      setSupplierToDelete(null);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state_code: supplier.state_code,
      pincode: supplier.pincode || "",
      gstin: supplier.gstin || "",
      payment_terms: supplier.payment_terms,
      credit_limit: supplier.credit_limit,
      supplier_type: supplier.supplier_type
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state_code: "27",
      pincode: "",
      gstin: "",
      payment_terms: 30,
      credit_limit: 0,
      supplier_type: "regular"
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalSuppliers}</p>
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
                <p className="text-2xl font-bold">{activeSuppliers}</p>
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
                  ₹{totalOutstanding.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-0 shadow-2xl overflow-hidden">
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl gradient-text">Suppliers</CardTitle>
              <p className="text-sm text-muted-foreground">Manage your vendor relationships</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingSupplier(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="holographic text-white shadow-lg border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl glass border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl gradient-text">
                    {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 h-[60vh] overflow-y-auto scrollbar-none">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-semibold">Supplier Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="glass border-0 shadow-inner"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_person" className="text-sm font-semibold">Contact Person</Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        className="glass border-0 shadow-inner"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-semibold">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="glass border-0 shadow-inner"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="glass border-0 shadow-inner"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address" className="text-sm font-semibold">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="glass border-0 shadow-inner"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-sm font-semibold">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="glass border-0 shadow-inner"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode" className="text-sm font-semibold">Pincode</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="glass border-0 shadow-inner"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gstin" className="text-sm font-semibold">GSTIN</Label>
                      <Input
                        id="gstin"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        className="glass border-0 shadow-inner"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier_type" className="text-sm font-semibold">Supplier Type</Label>
                      <Select value={formData.supplier_type} onValueChange={(value: any) => setFormData({ ...formData, supplier_type: value })}>
                        <SelectTrigger className="glass border-0 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass border-0">
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="importer">Importer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="payment_terms" className="text-sm font-semibold">Payment Terms (Days)</Label>
                      <Input
                        id="payment_terms"
                        type="number"
                        value={formData.payment_terms}
                        onChange={(e) => setFormData({ ...formData, payment_terms: Number(e.target.value) })}
                        className="glass border-0 shadow-inner"
                      />
                    </div>
                    <div>
                      <Label htmlFor="credit_limit" className="text-sm font-semibold">Credit Limit (₹)</Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        value={formData.credit_limit}
                        onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                        className="glass border-0 shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-white/10">
                      Cancel
                    </Button>
                    <Button type="submit" className="holographic text-white shadow-lg border-0">
                      {editingSupplier ? "Update" : "Create"} Supplier
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 glass border-0 shadow-sm"
              />
            </div>
          </div>

          <div className="rounded-xl border-0 overflow-hidden glass shadow-inner">
            <Table>
              <TableHeader className="bg-white/10 backdrop-blur-md">
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="font-bold text-foreground">Code</TableHead>
                  <TableHead className="font-bold text-foreground">Name</TableHead>
                  <TableHead className="font-bold text-foreground">Contact</TableHead>
                  <TableHead className="font-bold text-foreground">Type</TableHead>
                  <TableHead className="font-bold text-foreground">Balance</TableHead>
                  <TableHead className="font-bold text-foreground">Status</TableHead>
                  <TableHead className="font-bold text-foreground text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs opacity-70">{supplier.supplier_code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-base">{supplier.name}</p>
                        {supplier.contact_person && (
                          <p className="text-xs text-muted-foreground">{supplier.contact_person}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.city && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {supplier.city}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize glass border-0 shadow-sm">
                        {supplier.supplier_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono font-medium ${supplier.current_balance > 0 ? "text-red-500" : "text-emerald-500"}`}>
                        ₹{supplier.current_balance?.toLocaleString() || '0'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={supplier.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"}
                      >
                        {supplier.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                          className="hover:bg-indigo-500/20 hover:text-indigo-600 rounded-full h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSupplierToDelete(supplier.id)}
                          className="hover:bg-red-500/20 hover:text-red-600 rounded-full h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-muted/20">
                  <Search className="h-8 w-8 opacity-50" />
                </div>
                <p>No suppliers found</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] glass border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the supplier and remove them from your database.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setSupplierToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}