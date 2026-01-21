"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuppliersTable } from "@/components/purchase/suppliers-table";
import { PurchaseOrdersList } from "@/components/purchase/purchase-orders-list";
import { PurchaseReceiptsList } from "@/components/purchase/purchase-receipts-list";
import { AdvancePaymentsList } from "@/components/purchase/advance-payments-list";

export default function PurchasePage() {
  const [activeTab, setActiveTab] = useState("suppliers");

  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Purchase Management</h1>
        <p className="text-sm text-muted-foreground">Manage suppliers, purchase orders, and receipts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="suppliers" className="flex-1">Suppliers</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
          <TabsTrigger value="receipts" className="flex-1">Receipts</TabsTrigger>
          <TabsTrigger value="advances" className="flex-1">Advances</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-0">
          <SuppliersTable />
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <PurchaseOrdersList />
        </TabsContent>

        <TabsContent value="receipts" className="mt-0">
          <PurchaseReceiptsList />
        </TabsContent>

        <TabsContent value="advances" className="mt-0">
          <AdvancePaymentsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}