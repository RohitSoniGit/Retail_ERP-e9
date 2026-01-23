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
  AlertTriangle,
  ShoppingCart,
  X,
  Eye,
  TrendingDown,
  Package,
  Clock,
  CheckCircle,
  Search,
} from "lucide-react";
import { ReorderAlert, Item, Supplier } from "@/lib/types";
import { toast } from "sonner";

import { useOrganization } from "@/lib/context/organization";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import useSWR from "swr";

export function ReorderAlerts() {
  const { organizationId } = useOrganization();
  const supabase = getSupabaseBrowserClient();

  const [selectedAlert, setSelectedAlert] = useState<ReorderAlert | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "ordered" | "dismissed">("all");
  const [localAlertState, setLocalAlertState] = useState<Record<string, string>>({}); // Track status changes

  // Fetch Items
  const { data: itemsData } = useSWR(
    organizationId ? `items-${organizationId}` : null,
    async () => {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("organization_id", organizationId);
      return (data as Item[]) || [];
    }
  );

  // Fetch Suppliers
  const { data: suppliersData } = useSWR(
    organizationId ? `suppliers-${organizationId}` : null,
    async () => {
      const { data } = await supabase
        .from("suppliers")
        .select("*")
        .eq("organization_id", organizationId);
      return (data as Supplier[]) || [];
    }
  );

  const items = itemsData || [];
  const suppliers = suppliersData || [];

  // Generate Alerts from Items
  const alerts: ReorderAlert[] = items
    .filter(item => item.current_stock <= (item.low_stock_threshold || 5)) // Use min_stock_level from DB if exists
    .map((item) => {
      const alertId = `alert-${item.id}`;
      const status = (localAlertState[alertId] as any) || "active";

      return {
        id: alertId,
        organization_id: item.organization_id,
        item_id: item.id,
        item_name: item.name,
        current_stock: item.current_stock,
        min_stock_level: item.low_stock_threshold || 5,
        suggested_order_qty: Math.max((item.low_stock_threshold || 5) * 2, 10),
        preferred_supplier_id: "", // TODO: Add preferred_supplier to item schema
        last_purchase_price: item.purchase_price || 0,
        alert_date: new Date().toISOString(),
        status: status,
        created_at: new Date().toISOString(),
        item: item,
        supplier: suppliers[0], // Fallback
      };
    });


  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.item?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || alert.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePurchaseOrder = (alert: ReorderAlert) => {
    // This would typically navigate to the purchase order creation page
    // or open a purchase order creation dialog with pre-filled data
    toast.success(`Purchase order created for ${alert.item_name}`);

    // Update alert status locally
    setLocalAlertState(prev => ({ ...prev, [alert.id]: "ordered" }));
    setShowOrderDialog(false);
  };

  const handleDismissAlert = (alertId: string) => {
    setLocalAlertState(prev => ({ ...prev, [alertId]: "dismissed" }));
    toast.success("Alert dismissed");
  };

  // Removed handleUpdateMinLevel for now as it requires updating the Item record directly via API


  const getAlertPriority = (alert: ReorderAlert) => {
    if (alert.current_stock === 0) return { level: "critical", color: "destructive", label: "Out of Stock" };
    if (alert.current_stock < alert.min_stock_level * 0.5) return { level: "high", color: "destructive", label: "Critical Low" };
    if (alert.current_stock < alert.min_stock_level) return { level: "medium", color: "secondary", label: "Low Stock" };
    return { level: "low", color: "outline", label: "Normal" };
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { color: "text-red-600", icon: AlertTriangle, label: "Out of Stock" };
    if (current < min * 0.5) return { color: "text-red-500", icon: TrendingDown, label: "Critical" };
    if (current < min) return { color: "text-orange-500", icon: AlertTriangle, label: "Low" };
    return { color: "text-green-500", icon: CheckCircle, label: "Normal" };
  };

  const activeAlerts = alerts.filter(a => a.status === "active");
  const criticalAlerts = activeAlerts.filter(a => a.current_stock === 0);
  const lowStockAlerts = activeAlerts.filter(a => a.current_stock > 0 && a.current_stock < a.min_stock_level);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold gradient-text">Reorder Level Alerts</h3>
          <p className="text-sm text-muted-foreground">
            Monitor low stock items and manage reorder suggestions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-0 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent group-hover:from-red-500/20 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 shadow-inner">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">{activeAlerts.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Active Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent group-hover:from-rose-500/20 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 shadow-inner">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">{criticalAlerts.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent group-hover:from-orange-500/20 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 shadow-inner">
                <TrendingDown className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">{lowStockAlerts.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 shadow-inner">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold font-mono">
                  ₹{activeAlerts.reduce((sum, alert) => sum + (alert.suggested_order_qty * (alert.last_purchase_price || 0)), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground font-medium">Suggested Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-0 shadow-inner h-11"
          />
        </div>
        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <SelectTrigger className="w-48 glass border-0 shadow-sm h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass border-0 backdrop-blur-xl">
            <SelectItem value="all">All Alerts</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Table */}
      <Card className="glass border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10">
          <CardTitle className="gradient-text text-xl">Stock Alerts</CardTitle>
          <CardDescription>
            Items that need attention due to low stock levels
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-responsive">
            <Table>
              <TableHeader className="bg-white/5 backdrop-blur-md">
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="font-bold text-foreground pl-6">Item</TableHead>
                  <TableHead className="font-bold text-foreground">Current Stock</TableHead>
                  <TableHead className="font-bold text-foreground">Min Level</TableHead>
                  <TableHead className="font-bold text-foreground">Status</TableHead>
                  <TableHead className="font-bold text-foreground">Suggested Order</TableHead>
                  <TableHead className="font-bold text-foreground">Last Price</TableHead>
                  <TableHead className="font-bold text-foreground">Supplier</TableHead>
                  <TableHead className="text-right font-bold text-foreground pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => {
                  const priority = getAlertPriority(alert);
                  const stockStatus = getStockStatus(alert.current_stock, alert.min_stock_level);
                  const StatusIcon = stockStatus.icon;

                  return (
                    <TableRow key={alert.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="pl-6">
                        <div>
                          <p className="font-medium text-foreground">{alert.item_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{alert.item?.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${stockStatus.color}`} />
                          <span className={`font-medium ${stockStatus.color}`}>
                            {alert.current_stock} {alert.item?.unit_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{alert.min_stock_level} {alert.item?.unit_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border-0 shadow-sm ${priority.level === "critical" ? "bg-red-500/10 text-red-500" :
                          priority.level === "high" ? "bg-orange-500/10 text-orange-500" :
                            "bg-yellow-500/10 text-yellow-500"
                          }`}>
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{alert.suggested_order_qty} {alert.item?.unit_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            ₹{((alert.last_purchase_price || 0) * alert.suggested_order_qty).toLocaleString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">₹{(alert.last_purchase_price || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{alert.supplier?.name}</p>
                          <p className="text-xs text-muted-foreground">{alert.supplier?.supplier_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end gap-2">
                          {alert.status === "active" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedAlert(alert);
                                  setShowOrderDialog(true);
                                }}
                                className="holographic text-white shadow-md border-0 h-8 text-xs"
                              >
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                Order
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDismissAlert(alert.id)}
                                className="h-8 w-8 p-0 rounded-full hover:bg-white/10"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {alert.status === "ordered" && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-0 shadow-sm">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ordered
                            </Badge>
                          )}
                          {alert.status === "dismissed" && (
                            <Badge variant="secondary" className="bg-white/10 text-muted-foreground">
                              <X className="h-3 w-3 mr-1" />
                              Dismissed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Purchase Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl glass border-0 shadow-2xl p-0 gap-0">
          <DialogHeader className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md">
            <DialogTitle className="text-xl gradient-text">Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a purchase order for {selectedAlert?.item_name}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-6 p-6">
              {/* Item Details */}
              <Card className="bg-white/5 border border-white/5 shadow-inner">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="mb-1"><strong className="text-muted-foreground">Item:</strong> <span className="text-foreground font-medium">{selectedAlert.item_name}</span></p>
                      <p className="mb-1"><strong className="text-muted-foreground">SKU:</strong> <span className="font-mono text-xs text-muted-foreground">{selectedAlert.item?.sku}</span></p>
                      <p><strong className="text-muted-foreground">Current Stock:</strong> <span className={selectedAlert.current_stock === 0 ? "text-red-500 font-bold" : "text-foreground"}>{selectedAlert.current_stock} {selectedAlert.item?.unit_name}</span></p>
                    </div>
                    <div>
                      <p className="mb-1"><strong className="text-muted-foreground">Min Level:</strong> <span className="text-foreground">{selectedAlert.min_stock_level} {selectedAlert.item?.unit_name}</span></p>
                      <p className="mb-1"><strong className="text-muted-foreground">Last Price:</strong> <span className="font-mono text-foreground">₹{(selectedAlert.last_purchase_price || 0).toLocaleString()}</span></p>
                      <p><strong className="text-muted-foreground">Supplier:</strong> <span className="text-foreground">{selectedAlert.supplier?.name}</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-semibold text-xs uppercase">Order Quantity</Label>
                    <Input
                      type="number"
                      defaultValue={selectedAlert.suggested_order_qty}
                      min="1"
                      className="glass border-0 shadow-inner h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-semibold text-xs uppercase">Unit Price</Label>
                    <Input
                      type="number"
                      defaultValue={selectedAlert.last_purchase_price || 0}
                      min="0"
                      step="0.01"
                      className="glass border-0 shadow-inner h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground font-semibold text-xs uppercase">Supplier</Label>
                  <Select defaultValue={selectedAlert.preferred_supplier_id || ""}>
                    <SelectTrigger className="glass border-0 shadow-sm h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-0 backdrop-blur-xl">
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name} ({supplier.supplier_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground font-semibold text-xs uppercase">Expected Delivery Date</Label>
                  <Input
                    type="date"
                    defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="glass border-0 shadow-inner h-11"
                  />
                </div>
              </div>

              {/* Order Summary */}
              <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-white/10 shadow-lg">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{selectedAlert.suggested_order_qty} {selectedAlert.item?.unit_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit Price:</span>
                      <span className="font-mono">₹{(selectedAlert.last_purchase_price || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-mono">₹{((selectedAlert.last_purchase_price || 0) * selectedAlert.suggested_order_qty).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST ({selectedAlert.item?.gst_rate}%):</span>
                      <span className="font-mono">₹{(((selectedAlert.last_purchase_price || 0) * selectedAlert.suggested_order_qty * (selectedAlert.item?.gst_rate || 0)) / 100).toLocaleString()}</span>
                    </div>

                    <div className="pt-2 mt-2 border-t border-white/10 flex justify-between font-bold text-base">
                      <span className="gradient-text">Total Amount:</span>
                      <span className="gradient-text">₹{(((selectedAlert.last_purchase_price || 0) * selectedAlert.suggested_order_qty) * (1 + (selectedAlert.item?.gst_rate || 0) / 100)).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowOrderDialog(false)} className="hover:bg-white/10">
                  Cancel
                </Button>
                <Button onClick={() => handleCreatePurchaseOrder(selectedAlert)} className="holographic text-white shadow-lg border-0 px-6">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Purchase Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}