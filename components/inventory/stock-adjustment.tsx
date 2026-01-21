"use client";

import React from "react";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, type Item } from "@/lib/types";
import { Search, Plus, Minus, RotateCcw, Save, Loader2 } from "lucide-react";

interface AdjustmentItem {
  item_id: string;
  item: Item;
  current_stock: number;
  adjusted_stock: number;
  difference: number;
  reason: string;
}

export function StockAdjustment() {
  const { organizationId } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([]);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch items
  const { data: items, isLoading } = useSWR(
    organizationId ? `items-adjustment-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");

      if (error) throw error;
      return data as Item[];
    }
  );

  const filteredItems = items?.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItemForAdjustment = (item: Item) => {
    const existing = adjustmentItems.find((ai) => ai.item_id === item.id);
    if (existing) return;

    setAdjustmentItems([
      ...adjustmentItems,
      {
        item_id: item.id,
        item: item,
        current_stock: item.current_stock,
        adjusted_stock: item.current_stock,
        difference: 0,
        reason: "physical_count",
      },
    ]);
    setSearchTerm("");
  };

  const updateAdjustedStock = (itemId: string, newStock: number) => {
    setAdjustmentItems(
      adjustmentItems.map((ai) => {
        if (ai.item_id === itemId) {
          const difference = newStock - ai.current_stock;
          return {
            ...ai,
            adjusted_stock: newStock,
            difference: difference,
          };
        }
        return ai;
      })
    );
  };

  const updateReason = (itemId: string, reason: string) => {
    setAdjustmentItems(
      adjustmentItems.map((ai) => {
        if (ai.item_id === itemId) {
          return { ...ai, reason };
        }
        return ai;
      })
    );
  };

  const removeItem = (itemId: string) => {
    setAdjustmentItems(adjustmentItems.filter((ai) => ai.item_id !== itemId));
  };

  const submitAdjustment = async () => {
    if (!organizationId || adjustmentItems.length === 0) return;

    const itemsWithChanges = adjustmentItems.filter((ai) => ai.difference !== 0);
    if (itemsWithChanges.length === 0) {
      alert("No stock changes to adjust");
      return;
    }

    setIsSubmitting(true);
    try {
      // Process each adjustment
      for (const ai of itemsWithChanges) {
        // Update item stock
        await supabase
          .from("items")
          .update({
            current_stock: ai.adjusted_stock,
          })
          .eq("id", ai.item_id);

        // Record stock movement
        await supabase.from("stock_movements").insert({
          organization_id: organizationId,
          item_id: ai.item_id,
          movement_type: "adjustment",
          quantity_change: ai.difference,
          notes: `Stock adjustment: ${ai.reason}. ${adjustmentNotes || ""}`.trim(),
        });
      }

      // Reset form
      setAdjustmentItems([]);
      setAdjustmentReason("");
      setAdjustmentNotes("");
      
      alert(`Successfully adjusted stock for ${itemsWithChanges.length} items`);
    } catch (error) {
      console.error("Error submitting stock adjustment:", error);
      alert("Error submitting adjustment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAdjustments = adjustmentItems.filter((ai) => ai.difference !== 0).length;
  const totalIncrease = adjustmentItems.reduce((sum, ai) => sum + (ai.difference > 0 ? ai.difference : 0), 0);
  const totalDecrease = adjustmentItems.reduce((sum, ai) => sum + (ai.difference < 0 ? Math.abs(ai.difference) : 0), 0);

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <RotateCcw className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Stock Adjustment</h2>
      </div>

      {/* Summary Cards */}
      {adjustmentItems.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-blue-700">Items to Adjust</p>
              <p className="text-2xl font-bold text-blue-700">{totalAdjustments}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-green-700">Stock Increase</p>
              <p className="text-2xl font-bold text-green-700">+{totalIncrease}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-red-700">Stock Decrease</p>
              <p className="text-2xl font-bold text-red-700">-{totalDecrease}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Item Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Items for Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items to adjust..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Search Results */}
          {searchTerm && filteredItems && filteredItems.length > 0 && (
            <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
              {filteredItems.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  className="w-full p-3 text-left hover:bg-muted flex items-center justify-between"
                  onClick={() => addItemForAdjustment(item)}
                  disabled={adjustmentItems.some((ai) => ai.item_id === item.id)}
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.sku} | Current Stock: {item.current_stock} {item.unit_type}
                    </p>
                  </div>
                  {adjustmentItems.some((ai) => ai.item_id === item.id) && (
                    <Badge variant="outline" className="text-xs">Added</Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Items */}
      {adjustmentItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Adjustments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Adjusted</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustmentItems.map((ai) => (
                  <TableRow key={ai.item_id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{ai.item.name}</p>
                        <p className="text-xs text-muted-foreground">{ai.item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {ai.current_stock} {ai.item.unit_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={ai.adjusted_stock}
                        onChange={(e) => updateAdjustedStock(ai.item_id, parseFloat(e.target.value) || 0)}
                        className="w-24 text-right"
                        min="0"
                        step="0.1"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        ai.difference > 0 ? "text-green-600" : ai.difference < 0 ? "text-red-600" : "text-muted-foreground"
                      }`}>
                        {ai.difference > 0 ? "+" : ""}{ai.difference} {ai.item.unit_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select value={ai.reason} onValueChange={(value) => updateReason(ai.item_id, value)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical_count">Physical Count</SelectItem>
                          <SelectItem value="damage">Damage</SelectItem>
                          <SelectItem value="theft">Theft</SelectItem>
                          <SelectItem value="expiry">Expiry</SelectItem>
                          <SelectItem value="return">Return</SelectItem>
                          <SelectItem value="correction">Correction</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(ai.item_id)}
                      >
                        <Minus className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Adjustment Notes */}
      {adjustmentItems.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adjustment_reason">Overall Reason</Label>
              <Input
                id="adjustment_reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g., Monthly stock audit"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adjustment_notes">Additional Notes</Label>
              <Textarea
                id="adjustment_notes"
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="Any additional notes about this adjustment..."
                rows={3}
              />
            </div>

            <Button
              onClick={submitAdjustment}
              disabled={isSubmitting || totalAdjustments === 0}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Submit Stock Adjustment ({totalAdjustments} items)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {adjustmentItems.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Items Added</h3>
            <p className="text-muted-foreground mb-4">
              Search and add items above to adjust their stock levels
            </p>
            <p className="text-sm text-muted-foreground">
              Use this feature for physical stock counts, damage adjustments, or corrections
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}