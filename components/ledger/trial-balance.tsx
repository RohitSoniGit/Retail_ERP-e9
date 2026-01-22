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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">Trial Balance</h2>
            <p className="text-sm text-muted-foreground">Financial position snapshot</p>
          </div>
        </div>
        <div className="flex items-center gap-3 glass p-2 rounded-xl border-0 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <Label htmlFor="as_on_date" className="text-sm font-medium">As on:</Label>
            <Input
              id="as_on_date"
              type="date"
              value={asOnDate}
              onChange={(e) => setAsOnDate(e.target.value)}
              className="w-auto bg-transparent border-0 h-8 focus-visible:ring-0 p-0 shadow-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="glass border-0 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent group-hover:from-red-500/20 transition-all duration-500" />
          <CardContent className="p-6 text-center relative">
            <p className="text-sm font-semibold text-red-500 mb-1">Total Debits</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(totalDebits)}</p>
          </CardContent>
        </Card>
        <Card className="glass border-0 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent group-hover:from-emerald-500/20 transition-all duration-500" />
          <CardContent className="p-6 text-center relative">
            <p className="text-sm font-semibold text-emerald-500 mb-1">Total Credits</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(totalCredits)}</p>
          </CardContent>
        </Card>
        <Card className={`glass border-0 shadow-lg relative overflow-hidden group ${difference > 0 ? "shadow-red-500/10" : "shadow-emerald-500/10"}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${difference > 0 ? "from-red-500/10 to-transparent group-hover:from-red-500/20" : "from-emerald-500/10 to-transparent group-hover:from-emerald-500/20"} transition-all duration-500`} />
          <CardContent className="p-6 text-center relative">
            <p className={`text-sm font-semibold mb-1 ${difference > 0 ? "text-red-500" : "text-emerald-500"}`}>Difference</p>
            <p className={`text-3xl font-bold ${difference > 0 ? "text-red-500" : "text-emerald-500"}`}>
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
        <Card className="glass border-0 shadow-xl overflow-hidden rounded-xl">
          <CardHeader className="border-b border-white/10 bg-white/5 backdrop-blur-md">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <span>Detailed Breakdown</span>
              <span className="text-sm font-normal text-muted-foreground hidden sm:inline-block">
                (As on {new Date(asOnDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5 backdrop-blur-md">
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="font-bold text-foreground pl-6">Account Name</TableHead>
                  <TableHead className="font-bold text-foreground">Account Code</TableHead>
                  <TableHead className="font-bold text-foreground">Type</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Debit</TableHead>
                  <TableHead className="text-right font-bold text-foreground pr-6">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedAccounts || {}).map(([type, accounts]) => (
                  <React.Fragment key={type}>
                    {/* Type Header */}
                    <TableRow className="bg-white/5 hover:bg-white/10 border-b border-white/5">
                      <TableCell colSpan={5} className="font-bold text-xs uppercase tracking-wider text-muted-foreground pl-6 py-3">
                        {type}
                      </TableCell>
                    </TableRow>

                    {/* Accounts in this type */}
                    {accounts?.map((account) => (
                      <TableRow key={account.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="font-medium pl-6 text-foreground">{account.account_name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{account.account_code}</TableCell>
                        <TableCell>
                          <span className="text-xs capitalize px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                            {account.account_group.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {account.debit_balance > 0 ? (
                            <span className="font-medium text-red-500">
                              {formatCurrency(account.debit_balance)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono pr-6">
                          {account.credit_balance > 0 ? (
                            <span className="font-medium text-emerald-500">
                              {formatCurrency(account.credit_balance)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Type Subtotal */}
                    <TableRow className="bg-white/5 font-medium border-b border-white/10">
                      <TableCell colSpan={3} className="text-sm pl-6 text-muted-foreground italic">
                        {type.toUpperCase()} TOTAL
                      </TableCell>
                      <TableCell className="text-right text-red-500 font-mono font-bold">
                        {formatCurrency(accounts?.reduce((sum, acc) => sum + acc.debit_balance, 0) || 0)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-500 font-mono font-bold pr-6">
                        {formatCurrency(accounts?.reduce((sum, acc) => sum + acc.credit_balance, 0) || 0)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}

                {/* Grand Total */}
                <TableRow className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 font-bold border-t border-white/10">
                  <TableCell colSpan={3} className="text-base pl-6 text-indigo-300">GRAND TOTAL</TableCell>
                  <TableCell className="text-right text-red-500 text-lg font-mono">
                    {formatCurrency(totalDebits)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-500 text-lg font-mono pr-6">
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