"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DollarSign,
  AlertTriangle,
  FileText,
  Calculator,
  BarChart3
} from "lucide-react";
import { useOrganization } from "@/lib/context/organization";
import { inventoryCostingService, InventoryValuation } from "@/lib/inventory-costing";

export function InventoryCostingIntegration() {
  const { organizationId } = useOrganization();
  const [valuationData, setValuationData] = useState<InventoryValuation[]>([]);
  const [summary, setSummary] = useState({
    total_items: 0,
    total_quantity: 0,
    total_value: 0,
    items: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      loadInventoryData();
    }
  }, [organizationId]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const report = await inventoryCostingService.generateValuationReport(organizationId!);
      setSummary(report);
      setValuationData(report.items);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Costing System</h1>
          <p className="text-muted-foreground">
            Integrated with Purchase Workflow for Accurate Valuation
          </p>
        </div>
        <Button onClick={loadInventoryData} variant="outline">
          <Calculator className="h-4 w-4 mr-2" />
          Refresh Valuation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{summary.total_items}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{summary.total_quantity.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">₹{summary.total_value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  ₹{summary.total_quantity > 0 ? (summary.total_value / summary.total_quantity).toFixed(2) : '0'}
                </p>
                <p className="text-sm text-muted-foreground">Avg Cost/Unit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="valuation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="valuation">Current Valuation</TabsTrigger>
          <TabsTrigger value="workflow">Purchase Integration</TabsTrigger>
          <TabsTrigger value="methods">Costing Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="valuation" className="space-y-4">
          <Card className="glass border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Inventory Valuation Report</CardTitle>
              <CardDescription>
                Real-time inventory values based on purchase costs and chosen costing method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Item Name</TableHead>
                      <TableHead className="min-w-[100px]">SKU</TableHead>
                      <TableHead className="min-w-[100px]">Stock</TableHead>
                      <TableHead className="min-w-[120px]">Avg Cost</TableHead>
                      <TableHead className="min-w-[120px]">Total Value</TableHead>
                      <TableHead className="min-w-[120px]">Last Purchase</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {valuationData.map((item) => (
                      <TableRow key={item.item_id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                        <TableCell>{item.current_stock.toLocaleString()}</TableCell>
                        <TableCell>₹{item.average_cost.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">₹{item.total_value.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>₹{item.last_purchase_cost.toFixed(2)}</div>
                            {item.last_purchase_date && (
                              <div className="text-muted-foreground">
                                {new Date(item.last_purchase_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.current_stock > 0 ? "default" : "destructive"}>
                            {item.current_stock > 0 ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Purchase Workflow Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-medium">Create Purchase Order</h4>
                      <p className="text-sm text-muted-foreground">Request items from suppliers with expected costs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-medium">Receive Goods (GRN)</h4>
                      <p className="text-sm text-muted-foreground">Record actual received quantities and costs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-medium">Auto Cost Calculation</h4>
                      <p className="text-sm text-muted-foreground">System calculates landed cost including freight & charges</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">4</div>
                    <div>
                      <h4 className="font-medium">Update Inventory</h4>
                      <p className="text-sm text-muted-foreground">Stock and costing layers updated automatically</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Cost Calculation Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Landed Cost</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Purchase Price + Freight + Other Charges allocated per item
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100">Weighted Average</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Automatic calculation of average cost per unit
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">FIFO/LIFO Support</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Cost layers for First-In-First-Out costing
                    </p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h4 className="font-medium text-orange-900 dark:text-orange-100">Real-time Valuation</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Instant inventory value updates for accounting
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <Card className="glass border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Costing Methods Available</CardTitle>
              <CardDescription>
                Choose the appropriate costing method for your business needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Weighted Average (Recommended)</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Calculates average cost of all units in stock. Best for most retail businesses.
                    </p>
                    <Badge variant="default">Default Method</Badge>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">FIFO (First In, First Out)</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Uses cost of oldest stock first. Good for perishable items.
                    </p>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">LIFO (Last In, First Out)</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Uses cost of newest stock first. Useful in inflationary periods.
                    </p>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Specific Identification</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Track individual item costs. Best for high-value unique items.
                    </p>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}