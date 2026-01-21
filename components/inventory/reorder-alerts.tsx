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

export function ReorderAlerts() {
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ReorderAlert | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "ordered" | "dismissed">("all");

  // Mock data
  useEffect(() => {
    const mockSuppliers: Supplier[] = [
      {
        id: "1",
        organization_id: "org1",
        supplier_code: "SUP001",
        name: "ABC Electronics Pvt Ltd",
        contact_person: "Rajesh Kumar",
        phone: "+91 98765 43210",
        email: "rajesh@abcelectronics.com",
        state_code: "27",
        gstin: "27ABCDE1234F1Z5",
        payment_terms: 30,
        credit_limit: 500000,
        current_balance: 125000,
        supplier_type: "manufacturer",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

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
        current_stock: 8, // Below min level
        min_stock_level: 10,
        gst_rate: 18,
        unit_type: "piece",
        unit_name: "PCS",
        pieces_per_unit: 1,
        conversion_factor: 1,
        is_rate_variable: false,
        last_purchase_date: "2024-01-15",
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
        current_stock: 3, // Below min level
        min_stock_level: 5,
        gst_rate: 18,
        unit_type: "piece",
        unit_name: "PCS",
        pieces_per_unit: 1,
        conversion_factor: 1,
        is_rate_variable: false,
        last_purchase_date: "2024-01-10",
        created_at: new Date().toISOString(),
      },
      {
        id: "3",
        organization_id: "org1",
        sku: "ITEM003",
        name: "Tablet DEF",
        category: "Electronics",
        hsn_code: "8471",
        wholesale_price: 25000,
        retail_price: 28000,
        purchase_cost: 22000,
        current_stock: 0, // Out of stock
        min_stock_level: 8,
        gst_rate: 18,
        unit_type: "piece",
        unit_name: "PCS",
        pieces_per_unit: 1,
        conversion_factor: 1,
        is_rate_variable: false,
        last_purchase_date: "2024-01-05",
        created_at: new Date().toISOString(),
      },
    ];

    const mockAlerts: ReorderAlert[] = [
      {
        id: "1",
        organization_id: "org1",
        item_id: "1",
        item_name: "Smartphone XYZ",
        current_stock: 8,
        min_stock_level: 10,
        suggested_order_qty: 50,
        preferred_supplier_id: "1",
        last_purchase_price: 12000,
        alert_date: new Date().toISOString(),
        status: "active",
        created_at: new Date().toISOString(),
        item: mockItems[0],
        supplier: mockSuppliers[0],
      },
      {
        id: "2",
        organization_id: "org1",
        item_id: "2",
        item_name: "Laptop ABC",
        current_stock: 3,
        min_stock_level: 5,
        suggested_order_qty: 20,
        preferred_supplier_id: "1",
        last_purchase_price: 40000,
        alert_date: new Date().toISOString(),
        status: "active",
        created_at: new Date().toISOString(),
        item: mockItems[1],
        supplier: mockSuppliers[0],
      },
      {
        id: "3",
        organization_id: "org1",
        item_id: "3",
        item_name: "Tablet DEF",
        current_stock: 0,
        min_stock_level: 8,
        suggested_order_qty: 30,
        preferred_supplier_id: "1",
        last_purchase_price: 22000,
        alert_date: new Date().toISOString(),
        status: "active",
        created_at: new Date().toISOString(),
        item: mockItems[2],
        supplier: mockSuppliers[0],
      },
    ];

    setSuppliers(mockSuppliers);
    setItems(mockItems);
    setAlerts(mockAlerts);
  }, []);

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
    
    // Update alert status
    setAlerts(alerts.map(a => 
      a.id === alert.id 
        ? { ...a, status: "ordered" as const }
        : a
    ));
    setShowOrderDialog(false);
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(alerts.map(a => 
      a.id === alertId 
        ? { ...a, status: "dismissed" as const }
        : a
    ));
    toast.success("Alert dismissed");
  };

  const handleUpdateMinLevel = (itemId: string, newMinLevel: number) => {
    // Update item min stock level
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, min_stock_level: newMinLevel }
        : item
    ));
    
    // Update alerts
    setAlerts(alerts.map(alert => 
      alert.item_id === itemId 
        ? { ...alert, min_stock_level: newMinLevel }
        : alert
    ));
    
    toast.success("Minimum stock level updated");
  };

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
          <h3 className="text-lg font-semibold">Reorder Level Alerts</h3>
          <p className="text-sm text-muted-foreground">
            Monitor low stock items and manage reorder suggestions
          </p>
        </div>
        <Button 
          onClick={() => {
            // Generate new alerts based on current stock levels
            const newAlerts = items
              .filter(item => item.current_stock <= item.min_stock_level)
              .filter(item => !alerts.some(alert => alert.item_id === item.id && alert.status === "active"))
              .map(item => ({
                id: Date.now().toString() + item.id,
                organization_id: "org1",
                item_id: item.id,
                item_name: item.name,
                current_stock: item.current_stock,
                min_stock_level: item.min_stock_level,
                suggested_order_qty: Math.max(item.min_stock_level * 2, 10),
                preferred_supplier_id: "1",
                last_purchase_price: item.purchase_cost,
                alert_date: new Date().toISOString(),
                status: "active" as const,
                created_at: new Date().toISOString(),
                item,
                supplier: suppliers[0],
              }));
            
            if (newAlerts.length > 0) {
              setAlerts([...alerts, ...newAlerts]);
              toast.success(`${newAlerts.length} new alerts generated`);
            } else {
              toast.info("No new alerts to generate");
            }
          }}
          variant="outline"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Refresh Alerts
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{criticalAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{lowStockAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  ₹{activeAlerts.reduce((sum, alert) => sum + (alert.suggested_order_qty * (alert.last_purchase_price || 0)), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Suggested Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-0 shadow-lg"
          />
        </div>
        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <SelectTrigger className="w-48 glass border-0 shadow-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Alerts</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Table */}
      <Card className="glass border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Stock Alerts</CardTitle>
          <CardDescription>
            Items that need attention due to low stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Suggested Order</TableHead>
                <TableHead>Last Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => {
                const priority = getAlertPriority(alert);
                const stockStatus = getStockStatus(alert.current_stock, alert.min_stock_level);
                const StatusIcon = stockStatus.icon;
                
                return (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{alert.item_name}</p>
                        <p className="text-sm text-muted-foreground">{alert.item?.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${stockStatus.color}`} />
                        <span className={stockStatus.color}>
                          {alert.current_stock} {alert.item?.unit_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{alert.min_stock_level} {alert.item?.unit_name}</TableCell>
                    <TableCell>
                      <Badge variant={priority.color as any}>
                        {priority.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{alert.suggested_order_qty} {alert.item?.unit_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{((alert.last_purchase_price || 0) * alert.suggested_order_qty).toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>₹{(alert.last_purchase_price || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{alert.supplier?.name}</p>
                        <p className="text-sm text-muted-foreground">{alert.supplier?.supplier_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {alert.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAlert(alert);
                                setShowOrderDialog(true);
                              }}
                              className="holographic text-white"
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Order
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDismissAlert(alert.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {alert.status === "ordered" && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ordered
                          </Badge>
                        )}
                        {alert.status === "dismissed" && (
                          <Badge variant="secondary">
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
        </CardContent>
      </Card>

      {/* Create Purchase Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a purchase order for {selectedAlert?.item_name}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-6">
              {/* Item Details */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Item:</strong> {selectedAlert.item_name}</p>
                      <p><strong>SKU:</strong> {selectedAlert.item?.sku}</p>
                      <p><strong>Current Stock:</strong> {selectedAlert.current_stock} {selectedAlert.item?.unit_name}</p>
                    </div>
                    <div>
                      <p><strong>Min Level:</strong> {selectedAlert.min_stock_level} {selectedAlert.item?.unit_name}</p>
                      <p><strong>Last Price:</strong> ₹{(selectedAlert.last_purchase_price || 0).toLocaleString()}</p>
                      <p><strong>Supplier:</strong> {selectedAlert.supplier?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Order Quantity</Label>
                    <Input
                      type="number"
                      defaultValue={selectedAlert.suggested_order_qty}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      defaultValue={selectedAlert.last_purchase_price || 0}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select defaultValue={selectedAlert.preferred_supplier_id || ""}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name} ({supplier.supplier_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expected Delivery Date</Label>
                  <Input
                    type="date"
                    defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Order Summary */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{selectedAlert.suggested_order_qty} {selectedAlert.item?.unit_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unit Price:</span>
                      <span>₹{(selectedAlert.last_purchase_price || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{((selectedAlert.last_purchase_price || 0) * selectedAlert.suggested_order_qty).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST ({selectedAlert.item?.gst_rate}%):</span>
                      <span>₹{(((selectedAlert.last_purchase_price || 0) * selectedAlert.suggested_order_qty * (selectedAlert.item?.gst_rate || 0)) / 100).toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Amount:</span>
                      <span>₹{(((selectedAlert.last_purchase_price || 0) * selectedAlert.suggested_order_qty) * (1 + (selectedAlert.item?.gst_rate || 0) / 100)).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleCreatePurchaseOrder(selectedAlert)} className="holographic text-white">
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