"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LedgerAccountsList } from "@/components/ledger/ledger-accounts-list";
import { LedgerEntriesList } from "@/components/ledger/ledger-entries-list";
import { TrialBalance } from "@/components/ledger/trial-balance";
import { ProfitLossStatement } from "@/components/ledger/profit-loss-statement";

export default function LedgerPage() {
  const [activeTab, setActiveTab] = useState("accounts");

  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Ledger Management</h1>
        <p className="text-sm text-muted-foreground">Manage accounts and view financial statements</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="accounts" className="flex-1">Accounts</TabsTrigger>
          <TabsTrigger value="entries" className="flex-1">Entries</TabsTrigger>
          <TabsTrigger value="trial" className="flex-1">Trial Balance</TabsTrigger>
          <TabsTrigger value="pnl" className="flex-1">P&L</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-0">
          <LedgerAccountsList />
        </TabsContent>

        <TabsContent value="entries" className="mt-0">
          <LedgerEntriesList />
        </TabsContent>

        <TabsContent value="trial" className="mt-0">
          <TrialBalance />
        </TabsContent>

        <TabsContent value="pnl" className="mt-0">
          <ProfitLossStatement />
        </TabsContent>
      </Tabs>
    </div>
  );
}