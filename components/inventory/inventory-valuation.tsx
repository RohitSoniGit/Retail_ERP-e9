"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, type Item } from "@/lib/types";
import { Package, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

export function InventoryValuation() {
  const { organizationId } = useOrganization();
  const [valuationDate, setValuationDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: inventoryData, isLoading } = useSWR(
    organizationId && valuationDate ? `inventory-valuation-${organizationId}-${valuationDate}` : null,
    async () => {
      // Get all items with current stock
      const { data: items, error } = await supabase
        .from("items")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");

      if (error) throw error;

      // Calculate valuation for each item
      const itemsWithValuation = (items as Item[]).map(item => {
        const stockValue = item.current_stock * item.purchase_cost;
        const retailValue = item.current_stock * item.retail_price;
        const wholesaleValue = item.current_stock * item.wholesale_price;
        
        return {
          ...item,
          stock_value: stockValue,
          retail_value: retailValue,
          wholesale_value: wholesaleValue,
          potential_profit: retailValue - stockValue,
          margin_percent: stockValue > 0 ? ((retailValue - stockValue) / stockValue) * 100 : 0,
        };
      });

      // Calculate totals
      const totalStockValue = itemsWithValuation.reduce((sum, item) => sum + item.stock_value, 0);
      const totalRetailValue = itemsWithValuation.reduce((sum, item) => sum + item.retail_value, 0);
      const totalPotentialProfit = itemsWithValuation.reduce((sum, item) => sum + item.potential_profit, 0);
      const averageMargin = totalStockValue > 0 ? (totalPotentialProfit / totalStockValue) * 100 : 0;

      // Categorize items
      const highValueItems = itemsWithValuation.filter(item => item.stock_value > 10000);
      const lowStockItems = itemsWithValuation.filter(item => item.current_stock <= item.min_stock_level);
      const deadStockItems = itemsWithValuation.filter(item => item.current_stock > 0 && item.current_stock > item.min_stock_level * 3);

      return {
        items: itemsWithValuation,
        totals: {
          totalStockValue,
          totalRetailValue,
          totalPotentialProfit,
          averageMargin,
          totalItems: itemsWithValuation.length,
          inStockItems: itemsWithValuation.filter(item => item.current_stock > 0).length,
        },
        categories: {
          highValue: highValueItems,
          lowStock: lowStockItems,
          deadStock: deadStockItems,
        },
      };
    }
  );

  const getStockStatusColor = (item: any) => {
    if (item.current_stock <= 0) return "bg-red-100 text-red-700 border-red-200";
    if (item.current_stock <= item.min_stock_level) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (item.current_stock > item.min_stock_level * 3) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getStockStatus = (item: any) => {
    if (item.current_stock <= 0) return "Out of Stock";
    if (item.current_stock <= item.min_stock_level) return "Low Stock";
    if (item.current_stock > item.min_stock_level * 3) return "Overstock";
    return "Normal";
  };

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Inventory Valuation</h2>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="valuation_date" className="text-sm">As on:</Label>
          <Input
            id="valuation_date"
            type="date"
            value={valuationDate}
            onChange={(e) => setValuationDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {inventoryData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-blue-700">Stock Value</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(inventoryData.totals.totalStockValue)}</p>
              <p className="text-xs text-blue-600 mt-1">At cost price</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-emerald-700">Retail Value</p>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(inventoryData.totals.totalRetailValue)}</p>
              <p className="text-xs text-emerald-600 mt-1">At selling price</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-green-700">Potential Profit</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(inventoryData.totals.totalPotentialProfit)}</p>
              <p className="text-xs text-green-600 mt-1">{inventoryData.totals.averageMargin.toFixed(1)}% margin</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Items in Stock</p>
              <p className="text-xl font-bold">{inventoryData.totals.inStockItems}</p>
              <p className="text-xs text-muted-foreground mt-1">of {inventoryData.totals.totalItems} total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Summary */}
      {inventoryData && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">Low Stock Items</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{inventoryData.categories.lowStock.length}</p>
              <p className="text-xs text-yellow-600 mt-1">Need restocking</p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">High Value Items</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{inventoryData.categories.highValue.length}</p>
              <p className="text-xs text-blue-600 mt-1">Value &gt; ₹10,000</p>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-700">Overstock Items</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{inventoryData.categories.deadStock.length}</p>
              <p className="text-xs text-purple-600 mt-1">Consider clearance</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Inventory Valuation as on {new Date(valuationDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Cost Value</TableHead>
                  <TableHead className="text-right">Retail Value</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryData?.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-medium">{item.current_stock} {item.unit_type}</p>
                          <p className="text-xs text-muted-foreground">
                            Min: {item.min_stock_level}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-medium">{formatCurrency(item.stock_value)}</p>
                          <p className="text-xs text-muted-foreground">
                            @ {formatCurrency(item.purchase_cost)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-medium">{formatCurrency(item.retail_value)}</p>
                          <p className="text-xs text-muted-foreground">
                            @ {formatCurrency(item.retail_price)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className={`font-medium ${item.potential_profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {formatCurrency(Math.abs(item.potential_profit))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.margin_percent.toFixed(1)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getStockStatusColor(item)}`}>
                          {getStockStatus(item)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}