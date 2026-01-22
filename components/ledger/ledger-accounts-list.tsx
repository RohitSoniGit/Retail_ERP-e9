"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, type LedgerAccount } from "@/lib/types";
import { Search, Plus, Building, Loader2 } from "lucide-react";

import { AddAccountDialog } from "./add-account-dialog";

export function LedgerAccountsList() {
  const { organizationId } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: accounts, isLoading, mutate } = useSWR(
    organizationId ? `ledger-accounts-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("ledger_accounts")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("account_code");

      if (error) throw error;
      return data as LedgerAccount[];
    }
  );

  const filteredAccounts = accounts?.filter(
    (account) =>
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "asset":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "liability":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "equity":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "income":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "expense":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      default:
        return "bg-muted/50 text-muted-foreground";
    }
  };

  // Group accounts by type
  const groupedAccounts = filteredAccounts?.reduce((groups, account) => {
    const type = account.account_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as Record<string, LedgerAccount[]>);

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 glass border-0 shadow-sm h-10"
          />
        </div>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="holographic text-white shadow-lg border-0">
          <Plus className="h-4 w-4 mr-1" />
          Add Account
        </Button>
      </div>

      <AddAccountDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => mutate()}
      />

      {/* Accounts by Type */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-indigo-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAccounts || {}).map(([type, typeAccounts]) => (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${getAccountTypeColor(type)} font-bold px-3 py-1 shadow-sm border-0 glass`}>
                  {type.toUpperCase()}
                </Badge>
                <span className="text-sm font-medium text-muted-foreground">
                  {typeAccounts.length} accounts
                </span>
              </div>

              <div className="rounded-xl border-0 overflow-hidden glass shadow-md">
                <Table>
                  <TableHeader className="bg-white/10 backdrop-blur-md">
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="font-bold text-foreground">Account</TableHead>
                      <TableHead className="font-bold text-foreground">Group</TableHead>
                      <TableHead className="text-right font-bold text-foreground">Opening Balance</TableHead>
                      <TableHead className="text-right font-bold text-foreground">Current Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeAccounts.map((account) => (
                      <TableRow key={account.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-sm text-foreground">{account.account_name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                {account.account_code}
                              </span>
                              {account.is_system_account && (
                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-0 shadow-none px-1.5 py-0">
                                  System
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize text-muted-foreground font-medium">
                            {account.account_group.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-mono text-sm ${account.opening_balance >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {formatCurrency(Math.abs(account.opening_balance))}
                            {account.opening_balance < 0 && " Cr"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          <span className={`font-mono ${account.current_balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {formatCurrency(Math.abs(account.current_balance))}
                            {account.current_balance < 0 && " Cr"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}

          {(!groupedAccounts || Object.keys(groupedAccounts).length === 0) && (
            <div className="text-center py-16 text-muted-foreground glass rounded-xl border-0">
              <Building className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">No accounts found</p>
              <p className="text-sm opacity-70">Add a new account to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}