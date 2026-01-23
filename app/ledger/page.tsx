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
        <div className="mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
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
              value="accounts" 
              className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap"
              style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
            >
              Accounts
            </TabsTrigger>
            <TabsTrigger 
              value="entries" 
              className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap"
              style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
            >
              Entries
            </TabsTrigger>
            <TabsTrigger 
              value="trial" 
              className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap"
              style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
            >
              Trial Balance
            </TabsTrigger>
            <TabsTrigger 
              value="pnl" 
              className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap"
              style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
            >
              P&L
            </TabsTrigger>
          </TabsList>
        </div>

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