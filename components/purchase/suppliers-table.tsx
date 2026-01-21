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
    supplier_type: "regular" as const
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Suppliers</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={formData.gstin}
                      onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier_type">Supplier Type</Label>
                    <Select value={formData.supplier_type} onValueChange={(value: any) => setFormData({...formData, supplier_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="manufacturer">Manufacturer</SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                        <SelectItem value="importer">Importer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                    <Input
                      id="payment_terms"
                      type="number"
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({...formData, payment_terms: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
                    <Input
                      id="credit_limit"
                      type="number"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({...formData, credit_limit: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSupplier ? "Update" : "Create"} Supplier
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Balance</TableHead>
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
                    {supplier.contact_person && (
                      <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>
                    )}
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
                    {supplier.city && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {supplier.city}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {supplier.supplier_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={supplier.current_balance > 0 ? "text-red-600" : "text-green-600"}>
                    ₹{supplier.current_balance.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={supplier.is_active ? "default" : "secondary"}>
                    {supplier.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No suppliers found
          </div>
        )}
      </CardContent>
    </Card>
  );
}