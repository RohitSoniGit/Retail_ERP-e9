"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PurchaseOrderForm } from "@/components/purchase/purchase-order-form";
import { GoodsReceipt } from "@/components/purchase/goods-receipt";
import { PaymentTracking } from "@/components/purchase/payment-tracking";
import { SuppliersTable } from "@/components/purchase/suppliers-table";
import { PurchaseOrdersList } from "@/components/purchase/purchase-orders-list";
import { PurchaseReceiptsList } from "@/components/purchase/purchase-receipts-list";
import { AdvancePaymentForm } from "@/components/purchase/advance-payment-form";

import { PurchaseOrder } from "@/lib/types";

export default function PurchasePage() {
  const [activeTab, setActiveTab] = useState("suppliers");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | undefined>(undefined);

  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Purchase Management</h1>
        <p className="text-sm text-muted-foreground">Manage suppliers, purchase orders, and receipts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div 
          className="mb-4 overflow-x-auto" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <TabsList 
            className="flex w-max min-w-full gap-1 p-1" 
            style={{ 
              display: 'flex', 
              width: 'max-content', 
              minWidth: '100%',
              flexWrap: 'nowrap'
            }}
          >
            <TabsTrigger 
              value="suppliers" 
              className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap"
              style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
            >
              Suppliers
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap"
              style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
            >
              Purchase Orders
            </TabsTrigger>
            <TabsTrigger 
              value="receipts" 
              className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap"
              style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
            >
              Goods Receipt
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap"
              style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
            >
              Payments
            </TabsTrigger>
            <TabsTrigger 
              value="advances" 
              className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap"
              style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
            >
              Advances
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="suppliers" className="mt-0">
          <SuppliersTable />
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <div className="space-y-6">
            <PurchaseOrderForm
              existingPO={selectedPO}
              onSave={() => setSelectedPO(undefined)}
            />
            <PurchaseOrdersList
              onEdit={(po) => {
                setSelectedPO(po);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
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