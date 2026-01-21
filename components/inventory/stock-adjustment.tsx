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
  Search,
  Save,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Trash2,
} from "lucide-react";
import { StockAdjustment as StockAdjustmentType, StockAdjustmentItem, Item } from "@/lib/types";
import { toast } from "sonner";

const ADJUSTMENT_TYPES = [
  { value: "increase", label: "Stock Increase", icon: TrendingUp, color: "text-green-600" },
  { value: "decrease", label: "Stock Decrease", icon: TrendingDown, color: "text-red-600" },
  { value: "damage", label: "Damage/Loss", icon: XCircle, color: "text-red-600" },
  { value: "expired", label: "Expired Items", icon: AlertTriangle, color: "text-orange-600" },
  { value: "physical_count", label: "Physical Count", icon: Package, color: "text-blue-600" },
];

const ADJUSTMENT_REASONS = [
  "Physical count adjustment",
  "Damaged goods",
  "Expired items",
  "Theft/Loss",
  "System error correction",
  "Supplier return",
  "Customer return",
  "Manufacturing adjustment",
  "Other",
];

export function StockAdjustment() {
  const [adjustments, setAdjustments] = useState<StockAdjustmentType[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustmentType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustmentItems, setAdjustmentItems] = useState<StockAdjustmentItem[]>([]);

  const [formData, setFormData] = useState({
    adjustment_number: "",
    adjustment_date: new Date().toISOString().split('T')[0],
    adjustment_type: "physical_count" as const,
    reason: "",
    notes: "",
  });

  // Mock data
  useEffect(() => {
    const mockItems: Item[] = [
      {
        id: "1",
        organization_id: "org1",
        sku: "ITEM001",
        name: "Smartphone XYZ",
        category: "Electronics",
        hsn_code: "8517",
        wholesale_price: 15000,
        retail_price: 18000,
        purchase_cost: 12000,
        current_stock: 50,
        min_stock_level: 10,
        gst_rate: 18,
        unit_type: "piece",
        unit_name: "PCS",
        pieces_per_unit: 1,
        conversion_factor: 1,
        is_rate_variable: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        organization_id: "org1",
        sku: "ITEM002",
        name: "Laptop ABC",
        category: "Electronics",
        hsn_code: "8471",
        wholesale_price: 45000,
        retail_price: 50000,
        purchase_cost: 40000,
        current_stock: 25,
        min_stock_level: 5,
        gst_rate: 18,
        unit_type: "piece",
        unit_name: "PCS",
        pieces_per_unit: 1,
        conversion_factor: 1,
        is_rate_variable: false,
        created_at: new Date().toISOString(),
      },
    ];

    const mockAdjustments: StockAdjustmentType[] = [
      {
        id: "1",
        organization_id: "org1",
        adjustment_number: "ADJ202401001",
        adjustment_date: new Date().toISOString(),
        adjustment_type: "physical_count",
        reason: "Monthly physical count adjustment",
        total_value_impact: -15000,
        status: "approved",
        approved_by: "Admin",
        approved_at: new Date().toISOString(),
        notes: "Physical count revealed discrepancies",
        created_by: "user1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    setItems(mockItems);
    setAdjustments(mockAdjustments);

    // Generate adjustment number
    const adjNumber = `ADJ${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-3)}`;
    setFormData(prev => ({ ...prev, adjustment_number: adjNumber }));
  }, []);

  const addItemToAdjustment = (item: Item) => {
    const adjustmentItem: StockAdjustmentItem = {
      id: Date.now().toString(),
      adjustment_id: "",
      item_id: item.id,
      item_name: item.name,
      current_stock: item.current_stock,
      adjusted_quantity: 0,
      new_stock: item.current_stock,
      unit_cost: item.purchase_cost,
      value_impact: 0,
      reason: formData.reason,
      created_at: new Date().toISOString(),
      item,
    };

    setAdjustmentItems([...adjustmentItems, adjustmentItem]);
    setShowItemDialog(false);
    toast.success("Item added to adjustment");
  };

  const updateAdjustmentItem = (index: number, field: keyof StockAdjustmentItem, value: any) => {
    const updatedItems = [...adjustmentItems];
    const item = updatedItems[index];

    if (field === 'adjusted_quantity') {
      const newStock = item.current_stock + value;
      const valueImpact = value * item.unit_cost;

      updatedItems[index] = {
        ...item,
        adjusted_quantity: value,
        new_stock: newStock,
        value_impact: valueImpact,
      };
    } else {
      updatedItems[index] = { ...item, [field]: value };
    }

    setAdjustmentItems(updatedItems);
  };

  const removeAdjustmentItem = (index: number) => {
    setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index));
  };

  const calculateTotalValueImpact = () => {
    return adjustmentItems.reduce((sum, item) => sum + item.value_impact, 0);
  };

  const handleSave = (status: "draft" | "approved" = "draft") => {
    if (adjustmentItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const totalValueImpact = calculateTotalValueImpact();

    const stockAdjustment: StockAdjustmentType = {
      id: selectedAdjustment?.id || Date.now().toString(),
      organization_id: "org1",
      adjustment_number: formData.adjustment_number,
      adjustment_date: formData.adjustment_date,
      adjustment_type: formData.adjustment_type,
      reason: formData.reason,
      total_value_impact: totalValueImpact,
      status,
      approved_by: status === "approved" ? "Current User" : undefined,
      approved_at: status === "approved" ? new Date().toISOString() : undefined,
      notes: formData.notes,
      created_by: "current_user",
      created_at: selectedAdjustment?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      adjustment_items: adjustmentItems,
    };

    if (selectedAdjustment) {
      setAdjustments(adjustments.map(a => a.id === selectedAdjustment.id ? stockAdjustment : a));
      toast.success("Stock adjustment updated successfully!");
    } else {
      setAdjustments([...adjustments, stockAdjustment]);
      toast.success(`Stock adjustment ${status === 'draft' ? 'saved as draft' : 'approved and applied'}`);
    }

    setIsCreating(false);
    setSelectedAdjustment(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      adjustment_number: `ADJ${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-3)}`,
      adjustment_date: new Date().toISOString().split('T')[0],
      adjustment_type: "physical_count",
      reason: "",
      notes: "",
    });
    setAdjustmentItems([]);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValueImpact = calculateTotalValueImpact();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Stock Adjustments</h3>
          <p className="text-sm text-muted-foreground">
            Manage inventory adjustments and corrections
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="holographic text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Adjustment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{adjustments.length}</p>
                <p className="text-sm text-muted-foreground">Total Adjustments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{adjustments.filter(a => a.status === 'approved').length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{adjustments.filter(a => a.status === 'draft').length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  ₹{Math.abs(adjustments.reduce((sum, a) => sum + a.total_value_impact, 0)).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Value Impact</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adjustments List */}
      <Card className="glass border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Stock Adjustments</CardTitle>
          <CardDescription>
            View and manage all stock adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adjustment #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Value Impact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map((adjustment) => {
                const adjustmentType = ADJUSTMENT_TYPES.find(t => t.value === adjustment.adjustment_type);
                const Icon = adjustmentType?.icon || Package;

                return (
                  <TableRow key={adjustment.id}>
                    <TableCell className="font-mono">{adjustment.adjustment_number}</TableCell>
                    <TableCell>{new Date(adjustment.adjustment_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${adjustmentType?.color}`} />
                        <span>{adjustmentType?.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>{adjustment.reason}</TableCell>
                    <TableCell>
                      <span className={adjustment.total_value_impact >= 0 ? "text-green-600" : "text-red-600"}>
                        {adjustment.total_value_impact >= 0 ? "+" : ""}₹{adjustment.total_value_impact.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={adjustment.status === "approved" ? "default" : "secondary"}>
                        {adjustment.status === "approved" ? "Approved" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        {adjustment.status === "draft" && (
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
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

      {/* Create/Edit Adjustment Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-[98vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Stock Adjustment</DialogTitle>
            <DialogDescription>
              Create a new stock adjustment to correct inventory levels
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adjustment_number">Adjustment Number</Label>
                <Input
                  id="adjustment_number"
                  value={formData.adjustment_number}
                  onChange={(e) => setFormData({ ...formData, adjustment_number: e.target.value })}
                  placeholder="ADJ202401001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment_date">Adjustment Date</Label>
                <Input
                  id="adjustment_date"
                  type="date"
                  value={formData.adjustment_date}
                  onChange={(e) => setFormData({ ...formData, adjustment_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment_type">Adjustment Type</Label>
                <Select
                  value={formData.adjustment_type}
                  onValueChange={(value: any) => setFormData({ ...formData, adjustment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADJUSTMENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Adjustment Items</h3>
                <Button
                  onClick={() => setShowItemDialog(true)}
                  className="holographic text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {adjustmentItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Adjustment Qty</TableHead>
                      <TableHead>New Stock</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Value Impact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustmentItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-muted-foreground">{item.item?.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.current_stock} {item.item?.unit_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.adjusted_quantity}
                            onChange={(e) => updateAdjustmentItem(index, 'adjusted_quantity', Number(e.target.value))}
                            className="w-24"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.new_stock < 0 ? "destructive" : "secondary"}>
                            {item.new_stock} {item.item?.unit_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unit_cost}
                            onChange={(e) => updateAdjustmentItem(index, 'unit_cost', Number(e.target.value))}
                            className="w-24"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <span className={item.value_impact >= 0 ? "text-green-600" : "text-red-600"}>
                            {item.value_impact >= 0 ? "+" : ""}₹{item.value_impact.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAdjustmentItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No items added yet. Click "Add Item" to get started.
                </div>
              )}
            </div>

            {adjustmentItems.length > 0 && (
              <>
                <Separator />

                {/* Summary */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Adjustment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span>{adjustmentItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Quantity Change:</span>
                      <span>{adjustmentItems.reduce((sum, item) => sum + item.adjusted_quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Value Impact:</span>
                      <span className={totalValueImpact >= 0 ? "text-green-600" : "text-red-600"}>
                        {totalValueImpact >= 0 ? "+" : ""}₹{totalValueImpact.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this adjustment..."
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={() => handleSave("draft")}>
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button onClick={() => handleSave("approved")} className="holographic text-white">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Apply
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Items to Adjustment</DialogTitle>
            <DialogDescription>
              Select items to include in this stock adjustment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.current_stock <= item.min_stock_level ? "destructive" : "secondary"}>
                        {item.current_stock} {item.unit_name}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.min_stock_level} {item.unit_name}</TableCell>
                    <TableCell>₹{item.purchase_cost.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => addItemToAdjustment(item)}
                        disabled={adjustmentItems.some(adjItem => adjItem.item_id === item.id)}
                        className="holographic text-white"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}