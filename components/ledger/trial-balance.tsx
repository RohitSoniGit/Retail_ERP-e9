"use client";

import React from "react";
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
import { formatCurrency, type LedgerAccount } from "@/lib/types";
import { Calculator, Loader2 } from "lucide-react";

export function TrialBalance() {
  const { organizationId } = useOrganization();
  const [asOnDate, setAsOnDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: trialBalance, isLoading } = useSWR(
    organizationId && asOnDate ? `trial-balance-${organizationId}-${asOnDate}` : null,
    async () => {
      // Get all accounts with their balances
      const { data: accounts, error } = await supabase
        .from("ledger_accounts")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("account_code");

      if (error) throw error;

      // For demo purposes, we'll use current_balance as the trial balance
      // In a real system, you'd calculate balances up to the specified date
      const accountsWithBalances = (accounts as LedgerAccount[]).map(account => ({
        ...account,
        debit_balance: account.current_balance > 0 ? account.current_balance : 0,
        credit_balance: account.current_balance < 0 ? Math.abs(account.current_balance) : 0,
      }));

      return accountsWithBalances;
    }
  );

  // Calculate totals
  const totalDebits = trialBalance?.reduce((sum, account) => sum + account.debit_balance, 0) || 0;
  const totalCredits = trialBalance?.reduce((sum, account) => sum + account.credit_balance, 0) || 0;
  const difference = Math.abs(totalDebits - totalCredits);

  // Group by account type
  const groupedAccounts = trialBalance?.reduce((groups, account) => {
    const type = account.account_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as Record<string, typeof trialBalance>);

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Trial Balance</h2>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="as_on_date" className="text-sm">As on:</Label>
          <Input
            id="as_on_date"
            type="date"
            value={asOnDate}
            onChange={(e) => setAsOnDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Debits</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Credits</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCredits)}</p>
          </CardContent>
        </Card>
        <Card className={difference > 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Difference</p>
            <p className={`text-2xl font-bold ${difference > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {difference > 0 ? formatCurrency(difference) : "Balanced"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Balance Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Trial Balance as on {new Date(asOnDate).toLocaleDateString("en-IN", {
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
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedAccounts || {}).map(([type, accounts]) => (
                  <React.Fragment key={type}>
                    {/* Type Header */}
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="font-medium text-sm uppercase">
                        {type}
                      </TableCell>
                    </TableRow>
                    
                    {/* Accounts in this type */}
                    {accounts?.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.account_name}</TableCell>
                        <TableCell className="text-muted-foreground">{account.account_code}</TableCell>
                        <TableCell>
                          <span className="text-xs capitalize">
                            {account.account_group.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {account.debit_balance > 0 ? (
                            <span className="font-medium text-red-600">
                              {formatCurrency(account.debit_balance)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {account.credit_balance > 0 ? (
                            <span className="font-medium text-emerald-600">
                              {formatCurrency(account.credit_balance)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Type Subtotal */}
                    <TableRow className="bg-muted/20 font-medium">
                      <TableCell colSpan={3} className="text-sm">
                        {type.toUpperCase()} TOTAL
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(accounts?.reduce((sum, acc) => sum + acc.debit_balance, 0) || 0)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        {formatCurrency(accounts?.reduce((sum, acc) => sum + acc.credit_balance, 0) || 0)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
                
                {/* Grand Total */}
                <TableRow className="bg-muted font-bold border-t-2">
                  <TableCell colSpan={3} className="text-base">GRAND TOTAL</TableCell>
                  <TableCell className="text-right text-red-600 text-base">
                    {formatCurrency(totalDebits)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600 text-base">
                    {formatCurrency(totalCredits)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}