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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Package className="h-6 w-6 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold gradient-text">Inventory Valuation</h2>
        </div>
        <div className="flex items-center gap-2 glass p-1.5 rounded-lg border-0 shadow-sm">
          <Label htmlFor="valuation_date" className="text-sm font-medium px-2">As upon:</Label>
          <Input
            id="valuation_date"
            type="date"
            value={valuationDate}
            onChange={(e) => setValuationDate(e.target.value)}
            className="w-auto bg-transparent border-0 h-8 focus-visible:ring-0 px-2 shadow-none"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {inventoryData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all" />
            <CardContent className="p-6 text-center relative">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Stock Value</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(inventoryData.totals.totalStockValue)}</p>
              <p className="text-xs text-muted-foreground mt-1 bg-blue-500/10 inline-block px-2 py-0.5 rounded-full">At cost price</p>
            </CardContent>
          </Card>
          <Card className="glass border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent group-hover:from-emerald-500/20 transition-all" />
            <CardContent className="p-6 text-center relative">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Retail Value</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(inventoryData.totals.totalRetailValue)}</p>
              <p className="text-xs text-muted-foreground mt-1 bg-emerald-500/10 inline-block px-2 py-0.5 rounded-full">At selling price</p>
            </CardContent>
          </Card>
          <Card className="glass border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent group-hover:from-green-500/20 transition-all" />
            <CardContent className="p-6 text-center relative">
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">Potential Profit</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(inventoryData.totals.totalPotentialProfit)}</p>
              <p className="text-xs text-muted-foreground mt-1 bg-green-500/10 inline-block px-2 py-0.5 rounded-full">{inventoryData.totals.averageMargin.toFixed(1)}% margin</p>
            </CardContent>
          </Card>
          <Card className="glass border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent group-hover:from-indigo-500/20 transition-all" />
            <CardContent className="p-6 text-center relative">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Items in Stock</p>
              <p className="text-2xl font-bold text-foreground mt-1">{inventoryData.totals.inStockItems}</p>
              <p className="text-xs text-muted-foreground mt-1 bg-indigo-500/10 inline-block px-2 py-0.5 rounded-full">of {inventoryData.totals.totalItems} total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Summary */}
      {inventoryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent group-hover:from-yellow-500/20 transition-all duration-500" />
            <CardContent className="p-4 flex items-center justify-between relative">
              <div>
                <p className="text-sm text-yellow-500 font-semibold">Low Stock Items</p>
                <p className="text-3xl font-bold text-foreground mt-1">{inventoryData.categories.lowStock.length}</p>
                <p className="text-xs text-muted-foreground mt-1 bg-yellow-500/10 inline-block px-2 py-0.5 rounded-full">Need restocking</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500 shadow-inner">
                <TrendingDown className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all duration-500" />
            <CardContent className="p-4 flex items-center justify-between relative">
              <div>
                <p className="text-sm text-blue-500 font-semibold">High Value Items</p>
                <p className="text-3xl font-bold text-foreground mt-1">{inventoryData.categories.highValue.length}</p>
                <p className="text-xs text-muted-foreground mt-1 bg-blue-500/10 inline-block px-2 py-0.5 rounded-full">Value &gt; ₹10,000</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shadow-inner">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent group-hover:from-purple-500/20 transition-all duration-500" />
            <CardContent className="p-4 flex items-center justify-between relative">
              <div>
                <p className="text-sm text-purple-500 font-semibold">Overstock Items</p>
                <p className="text-3xl font-bold text-foreground mt-1">{inventoryData.categories.deadStock.length}</p>
                <p className="text-xs text-muted-foreground mt-1 bg-purple-500/10 inline-block px-2 py-0.5 rounded-full">Consider clearance</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500 shadow-inner">
                <Package className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-indigo-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border-0 overflow-hidden glass shadow-xl">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
            <h3 className="font-semibold text-lg text-foreground">
              Detailed Valuation Report
            </h3>
            <p className="text-sm text-muted-foreground">
              As on {new Date(valuationDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/10 backdrop-blur-md">
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="font-bold text-foreground">Item</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Stock</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Cost Value</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Retail Value</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Profit</TableHead>
                  <TableHead className="font-bold text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryData?.items.map((item) => (
                    <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-foreground">{item.name}</p>
                          <p className="text-xs text-indigo-400 font-mono">{item.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-bold text-sm">{item.current_stock} <span className="text-xs font-normal text-muted-foreground">{item.unit_type}</span></p>
                          <p className="text-[10px] text-muted-foreground bg-white/5 inline-block px-1 rounded">
                            Min: {item.min_stock_level}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{formatCurrency(item.stock_value)}</p>
                          <p className="text-xs text-muted-foreground">
                            @ {formatCurrency(item.purchase_cost)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{formatCurrency(item.retail_value)}</p>
                          <p className="text-xs text-muted-foreground">
                            @ {formatCurrency(item.retail_price)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <p className={`font-bold text-sm ${item.potential_profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {formatCurrency(Math.abs(item.potential_profit))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.margin_percent.toFixed(1)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs border-0 shadow-sm ${getStockStatusColor(item)}`}>
                          {getStockStatus(item)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}