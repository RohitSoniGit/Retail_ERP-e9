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
          <h3 className="text-2xl font-bold gradient-text">Stock Adjustments</h3>
          <p className="text-sm text-muted-foreground">
            Manage inventory adjustments and corrections
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="holographic text-white shadow-lg border-0 hover:scale-105 transition-transform">
          <Plus className="h-4 w-4 mr-2" />
          New Adjustment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-0 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 shadow-inner">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">{adjustments.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Total Adjustments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent group-hover:from-green-500/20 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-green-500/10 text-green-500 shadow-inner">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">{adjustments.filter(a => a.status === 'approved').length}</p>
                <p className="text-sm text-muted-foreground font-medium">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent group-hover:from-orange-500/20 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 shadow-inner">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">{adjustments.filter(a => a.status === 'draft').length}</p>
                <p className="text-sm text-muted-foreground font-medium">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent group-hover:from-red-500/20 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 shadow-inner">
                <TrendingDown className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold font-mono">
                  ₹{Math.abs(adjustments.reduce((sum, a) => sum + a.total_value_impact, 0)).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground font-medium">Value Impact</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adjustments List */}
      <Card className="glass border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10">
          <CardTitle className="gradient-text text-xl">Stock Adjustments</CardTitle>
          <CardDescription>
            View and manage all stock adjustments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5 backdrop-blur-md">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="font-bold text-foreground pl-6">Adjustment #</TableHead>
                <TableHead className="font-bold text-foreground">Date</TableHead>
                <TableHead className="font-bold text-foreground">Type</TableHead>
                <TableHead className="font-bold text-foreground">Reason</TableHead>
                <TableHead className="font-bold text-foreground">Value Impact</TableHead>
                <TableHead className="font-bold text-foreground">Status</TableHead>
                <TableHead className="text-right font-bold text-foreground pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map((adjustment) => {
                const adjustmentType = ADJUSTMENT_TYPES.find(t => t.value === adjustment.adjustment_type);
                const Icon = adjustmentType?.icon || Package;

                return (
                  <TableRow key={adjustment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono pl-6">{adjustment.adjustment_number}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(adjustment.adjustment_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${adjustment.adjustment_type === 'increase' ? 'bg-green-500/10 text-green-500' :
                          adjustment.adjustment_type === 'decrease' ? 'bg-red-500/10 text-red-500' :
                            adjustment.adjustment_type === 'damage' ? 'bg-red-500/10 text-red-500' :
                              adjustment.adjustment_type === 'expired' ? 'bg-orange-500/10 text-orange-500' :
                                'bg-blue-500/10 text-blue-500'
                          }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{adjustmentType?.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{adjustment.reason}</TableCell>
                    <TableCell>
                      <span className={`font-mono font-medium ${adjustment.total_value_impact >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {adjustment.total_value_impact >= 0 ? "+" : ""}₹{adjustment.total_value_impact.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-0 shadow-sm ${adjustment.status === "approved" ? "bg-green-500/10 text-green-500" : "bg-secondary/50 text-secondary-foreground"
                        }`}>
                        {adjustment.status === "approved" ? "Approved" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedAdjustment(adjustment);
                            // TODO: Add view dialog
                            toast.info('View functionality coming soon');
                          }}
                          className="h-8 px-2 hover:bg-white/10"
                        >
                          View
                        </Button>
                        {adjustment.status === "draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedAdjustment(adjustment);
                              setFormData({
                                adjustment_number: adjustment.adjustment_number,
                                adjustment_date: adjustment.adjustment_date.split('T')[0],
                                adjustment_type: adjustment.adjustment_type,
                                reason: adjustment.reason,
                                notes: adjustment.notes || '',
                              });
                              setAdjustmentItems(adjustment.adjustment_items || []);
                              setIsCreating(true);
                            }}
                            className="h-8 px-2 hover:bg-white/10 text-indigo-400"
                          >
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass border-0 shadow-2xl p-0 gap-0">
          <DialogHeader className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-10">
            <DialogTitle className="text-xl gradient-text">Create Stock Adjustment</DialogTitle>
            <DialogDescription>
              Create a new stock adjustment to correct inventory levels
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="adjustment_number">Adjustment Number</Label>
                <Input
                  id="adjustment_number"
                  value={formData.adjustment_number}
                  onChange={(e) => setFormData({ ...formData, adjustment_number: e.target.value })}
                  placeholder="ADJ202401001"
                  className="glass border-0 shadow-inner h-11 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment_date">Adjustment Date</Label>
                <Input
                  id="adjustment_date"
                  type="date"
                  value={formData.adjustment_date}
                  onChange={(e) => setFormData({ ...formData, adjustment_date: e.target.value })}
                  className="glass border-0 shadow-inner h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment_type">Adjustment Type</Label>
                <Select
                  value={formData.adjustment_type}
                  onValueChange={(value: any) => setFormData({ ...formData, adjustment_type: value })}
                >
                  <SelectTrigger className="glass border-0 shadow-sm h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-0 backdrop-blur-xl">
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
                <SelectTrigger className="glass border-0 shadow-sm h-11">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent className="glass border-0 backdrop-blur-xl">
                  {ADJUSTMENT_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-white/10" />

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold gradient-text">Adjustment Items</h3>
                <Button
                  onClick={() => setShowItemDialog(true)}
                  className="holographic text-white shadow-md border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {adjustmentItems.length > 0 ? (
                <div className="rounded-xl border border-white/10 overflow-hidden glass shadow-sm">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-b border-white/10 hover:bg-transparent">
                        <TableHead className="font-bold text-foreground pl-4">Item</TableHead>
                        <TableHead className="font-bold text-foreground">Current Stock</TableHead>
                        <TableHead className="font-bold text-foreground">Adjustment Qty</TableHead>
                        <TableHead className="font-bold text-foreground">New Stock</TableHead>
                        <TableHead className="font-bold text-foreground">Unit Cost</TableHead>
                        <TableHead className="font-bold text-foreground">Value Impact</TableHead>
                        <TableHead className="text-right font-bold text-foreground pr-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adjustmentItems.map((item, index) => (
                        <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="pl-4">
                            <div>
                              <p className="font-medium text-foreground">{item.item_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{item.item?.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.current_stock} {item.item?.unit_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.adjusted_quantity}
                              onChange={(e) => updateAdjustmentItem(index, 'adjusted_quantity', Number(e.target.value))}
                              className="w-24 glass border-0 shadow-inner h-9"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`border-0 shadow-sm ${item.new_stock < 0 ? "bg-red-500/10 text-red-500" : "bg-secondary/50 text-secondary-foreground"}`}>
                              {item.new_stock} {item.item?.unit_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unit_cost}
                              onChange={(e) => updateAdjustmentItem(index, 'unit_cost', Number(e.target.value))}
                              className="w-24 glass border-0 shadow-inner h-9"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${item.value_impact >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {item.value_impact >= 0 ? "+" : ""}₹{item.value_impact.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeAdjustmentItem(index)}
                              className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground glass rounded-xl border border-dashed border-white/10">
                  <Package className="h-10 w-10 mb-2 opacity-50" />
                  <p>No items added yet. Click "Add Item" to get started.</p>
                </div>
              )}
            </div>

            {adjustmentItems.length > 0 && (
              <>
                <Separator className="bg-white/10" />

                {/* Summary */}
                <Card className="bg-white/5 border border-white/10 shadow-inner">
                  <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-base font-semibold">Adjustment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span className="font-medium">{adjustmentItems.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Quantity Change:</span>
                      <span className="font-medium">{adjustmentItems.reduce((sum, item) => sum + item.adjusted_quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-white/5">
                      <span>Total Value Impact:</span>
                      <span className={totalValueImpact >= 0 ? "text-green-500" : "text-red-500"}>
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
                    className="glass border-0 shadow-inner resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button variant="ghost" onClick={() => setIsCreating(false)} className="hover:bg-white/10">
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={() => handleSave("draft")} className="glass border-0 shadow-sm hover:bg-white/10">
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button onClick={() => handleSave("approved")} className="holographic text-white shadow-lg border-0 px-6">
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass border-0 shadow-2xl p-0 gap-0">
          <DialogHeader className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-10">
            <DialogTitle className="text-xl gradient-text">Add Items to Adjustment</DialogTitle>
            <DialogDescription>
              Select items to include in this stock adjustment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass border-0 shadow-inner h-11"
              />
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden glass shadow-md">
              <Table>
                <TableHeader className="bg-white/10">
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="font-bold text-foreground pl-4">Item</TableHead>
                    <TableHead className="font-bold text-foreground">Current Stock</TableHead>
                    <TableHead className="font-bold text-foreground">Min Level</TableHead>
                    <TableHead className="font-bold text-foreground">Unit Cost</TableHead>
                    <TableHead className="text-right font-bold text-foreground pr-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="pl-4">
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border-0 shadow-sm ${item.current_stock <= item.min_stock_level ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                          {item.current_stock} {item.unit_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.min_stock_level} {item.unit_name}</TableCell>
                      <TableCell className="font-mono">₹{item.purchase_cost.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          size="sm"
                          onClick={() => addItemToAdjustment(item)}
                          disabled={adjustmentItems.some(adjItem => adjItem.item_id === item.id)}
                          className="holographic text-white shadow-md border-0 h-8 px-4 disabled:opacity-50"
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}