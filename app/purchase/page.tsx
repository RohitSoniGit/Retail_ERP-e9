"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierManagement } from "@/components/purchase/supplier-management";
import { PurchaseOrderForm } from "@/components/purchase/purchase-order-form";
import { GoodsReceipt } from "@/components/purchase/goods-receipt";
import { PaymentTracking } from "@/components/purchase/payment-tracking";
import { SuppliersTable } from "@/components/purchase/suppliers-table";
import { PurchaseOrdersList } from "@/components/purchase/purchase-orders-list";
import { PurchaseReceiptsList } from "@/components/purchase/purchase-receipts-list";
import { AdvancePaymentForm } from "@/components/purchase/advance-payment-form";

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
          <TabsTrigger value="orders" className="flex-1">Purchase Orders</TabsTrigger>
          <TabsTrigger value="receipts" className="flex-1">Goods Receipt</TabsTrigger>
          <TabsTrigger value="payments" className="flex-1">Payments</TabsTrigger>
          <TabsTrigger value="advances" className="flex-1">Advances</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-0">
          <SupplierManagement />
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <div className="space-y-6">
            <PurchaseOrderForm />
            <PurchaseOrdersList />
          </div>
        </TabsContent>

        <TabsContent value="receipts" className="mt-0">
          <GoodsReceipt />
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          <PaymentTracking />
        </TabsContent>

        <TabsContent value="advances" className="mt-0">
          <AdvancePaymentForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}