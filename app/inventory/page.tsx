"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryValuation } from "@/components/inventory/inventory-valuation";
import { StockMovements } from "@/components/inventory/stock-movements";
import { BatchTracking } from "@/components/inventory/batch-tracking";
import { StockAdjustment } from "@/components/inventory/stock-adjustment";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("valuation");

  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Inventory Management</h1>
        <p className="text-sm text-muted-foreground">Track stock movements, valuations, and adjustments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="valuation" className="flex-1">Valuation</TabsTrigger>
          <TabsTrigger value="movements" className="flex-1">Movements</TabsTrigger>
          <TabsTrigger value="batches" className="flex-1">Batches</TabsTrigger>
          <TabsTrigger value="adjustment" className="flex-1">Adjustment</TabsTrigger>
        </TabsList>

        <TabsContent value="valuation" className="mt-0">
          <InventoryValuation />
        </TabsContent>

        <TabsContent value="movements" className="mt-0">
          <StockMovements />
        </TabsContent>

        <TabsContent value="batches" className="mt-0">
          <BatchTracking />
        </TabsContent>

        <TabsContent value="adjustment" className="mt-0">
          <StockAdjustment />
        </TabsContent>
      </Tabs>
    </div>
  );
}