"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Phone, Mail, MapPin } from "lucide-react";
import { Supplier } from "@/lib/types";
import { toast } from "sonner";

// Demo suppliers data
const demoSuppliers: Supplier[] = [
  {
    id: "1",
    organization_id: "demo-org",
    supplier_code: "SUP001",
    name: "ABC Distributors",
    contact_person: "Rajesh Kumar",
    phone: "+91 9876543210",
    email: "rajesh@abcdist.com",
    address: "123 Market Street, Mumbai",
    city: "Mumbai",
    state_code: "27",
    pincode: "400001",
    gstin: "27ABCDE1234F1Z5",
    payment_terms: 30,
    credit_limit: 500000,
    current_balance: 25000,
    supplier_type: "distributor",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    organization_id: "demo-org",
    supplier_code: "SUP002",
    name: "XYZ Manufacturers",
    contact_person: "Priya Sharma",
    phone: "+91 9876543211",
    email: "priya@xyzmfg.com",
    address: "456 Industrial Area, Delhi",
    city: "Delhi",
    state_code: "07",
    pincode: "110001",
    gstin: "07FGHIJ5678K2L9",
    payment_terms: 15,
    credit_limit: 1000000,
    current_balance: 0,
    supplier_type: "manufacturer",
    is_active: true,
    created_at: "2024-01-10T10:00:00Z",
    updated_at: "2024-01-10T10:00:00Z"
  }
];

export function SuppliersTable() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(demoSuppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
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

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSupplier) {
      // Update existing supplier
      setSuppliers(prev => prev.map(s =>
        s.id === editingSupplier.id
          ? { ...s, ...formData, updated_at: new Date().toISOString() }
          : s
      ));
      toast.success("Supplier updated successfully");
    } else {
      // Create new supplier
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        organization_id: "demo-org",
        supplier_code: `SUP${String(suppliers.length + 1).padStart(3, '0')}`,
        ...formData,
        current_balance: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSuppliers(prev => [...prev, newSupplier]);
      toast.success("Supplier created successfully");
    }

    setIsDialogOpen(false);
    setEditingSupplier(null);
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

  // ... (keeping imports and state)

  // NOTE: Replace the inline Dialog with the imported AddSupplierDialog component in the final integration
  // For now, I will enhance the existing structure as requested, maintaining current functionality but polishing UI.

  return (
    <Card className="glass border-0 shadow-2xl overflow-hidden">
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl gradient-text">Suppliers</CardTitle>
            <p className="text-sm text-muted-foreground">Manage your vendor relationships</p>
          </div>
          {/* The actual Dialog implementation should be replaced by the dedicated component later if needed, 
                but for now we style the trigger button to match the theme. */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="holographic text-white shadow-lg border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            {/* Inline Dialog Content Styling - mirroring AddSupplierDialog */}
            <DialogContent className="max-w-2xl glass border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl gradient-text">
                  {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4 h-[60vh] overflow-y-auto scrollbar-none">
                {/* Styled form inputs matching glass theme */}
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
                      ₹{supplier.current_balance.toLocaleString()}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                      className="hover:bg-indigo-500/20 hover:text-indigo-600 rounded-full h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
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
  );
}