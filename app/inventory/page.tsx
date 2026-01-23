"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockAdjustment } from "@/components/inventory/stock-adjustment";
import { ReorderAlerts } from "@/components/inventory/reorder-alerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/lib/context/organization";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Activity,
  Loader2,
} from "lucide-react";

// Mock inventory data
const mockInventoryItems = [
  {
    id: "1",
    sku: "ITEM001",
    name: "Smartphone XYZ",
    category: "Electronics",
    current_stock: 8,
    min_stock_level: 10,
    unit_name: "PCS",
    purchase_cost: 12000,
    retail_price: 18000,
    last_movement: "2024-01-20",
    movement_type: "sale",
  },
  {
    id: "2",
    sku: "ITEM002",
    name: "Laptop ABC",
    category: "Electronics",
    current_stock: 3,
    min_stock_level: 5,
    unit_name: "PCS",
    purchase_cost: 40000,
    retail_price: 50000,
    last_movement: "2024-01-19",
    movement_type: "sale",
  },
  {
    id: "3",
    sku: "ITEM003",
    name: "Tablet DEF",
    category: "Electronics",
    current_stock: 0,
    min_stock_level: 8,
    unit_name: "PCS",
    purchase_cost: 22000,
    retail_price: 28000,
    last_movement: "2024-01-18",
    movement_type: "sale",
  },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const { organizationId } = useOrganization();
  const supabase = getSupabaseBrowserClient();

  const { data: inventoryItems, isLoading } = useSWR(
    organizationId ? `inventory-${organizationId}` : null,
    async () => {
      const { data } = await supabase
        .from("items")
        .select(`
          *,
          category:categories(name)
        `)
        .eq("organization_id", organizationId)
        .order("name");
      return data || [];
    }
  );

  const items = inventoryItems || [];
  const totalItems = items.length;
  const lowStockItems = items.filter((item: any) => item.current_stock <= (item.low_stock_threshold || 5));
  const outOfStockItems = items.filter((item: any) => item.current_stock === 0);
  const totalValue = items.reduce((sum: number, item: any) => sum + (item.current_stock * (item.purchase_price || 0)), 0);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Inventory Management</h1>
        <p className="text-sm text-muted-foreground">Monitor stock levels, adjustments, and reorder alerts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="adjustments" className="flex-1">Stock Adjustments</TabsTrigger>
          <TabsTrigger value="alerts" className="flex-1">Reorder Alerts</TabsTrigger>
          <TabsTrigger value="valuation" className="flex-1">Valuation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalItems}</p>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{lowStockItems.length}</p>
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{outOfStockItems.length}</p>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Inventory Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Stock Levels */}
          <Card className="glass border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Current Stock Levels</CardTitle>
              <CardDescription>
                Monitor your inventory levels and identify items that need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <Package className="h-10 w-10 mb-2 opacity-50" />
                  <p>No items in inventory.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Min Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Last Movement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => {
                        const getStockStatus = () => {
                          if (item.current_stock === 0) return { label: "Out of Stock", variant: "destructive" };
                          if (item.current_stock <= (item.low_stock_threshold || 5)) return { label: "Low Stock", variant: "secondary" };
                          return { label: "In Stock", variant: "default" };
                        };

                        const status = getStockStatus();

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.sku || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.category?.name || '-'}</TableCell>
                            <TableCell>
                              <span className={item.current_stock <= (item.low_stock_threshold || 5) ? "text-red-600 font-medium" : ""}>
                                {item.current_stock} {item.unit_type || 'PCS'}
                              </span>
                            </TableCell>
                            <TableCell>{item.low_stock_threshold || 5} {item.unit_type || 'PCS'}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant as any}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>₹{(item.current_stock * (item.purchase_price || 0)).toLocaleString()}</TableCell>
                            <TableCell>
                              <span className="text-sm">-</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments" className="mt-0">
          <StockAdjustment />
        </TabsContent>

        <TabsContent value="alerts" className="mt-0">
          <ReorderAlerts />
        </TabsContent>

        <TabsContent value="valuation" className="mt-0">
          <Card className="glass border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Inventory Valuation
              </CardTitle>
              <CardDescription>
                Track inventory value using different valuation methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">FIFO Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">First In, First Out</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">LIFO Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">₹{(totalValue * 0.95).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Last In, First Out</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Weighted Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">₹{(totalValue * 0.97).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Average Cost Method</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-4">Valuation Summary</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>FIFO Value</TableHead>
                      <TableHead>LIFO Value</TableHead>
                      <TableHead>Avg Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Electronics</TableCell>
                      <TableCell>{mockInventoryItems.length}</TableCell>
                      <TableCell>{mockInventoryItems.reduce((sum, item) => sum + item.current_stock, 0)} PCS</TableCell>
                      <TableCell>₹{totalValue.toLocaleString()}</TableCell>
                      <TableCell>₹{(totalValue * 0.95).toLocaleString()}</TableCell>
                      <TableCell>₹{(totalValue * 0.97).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}