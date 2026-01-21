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
        return "bg-green-100 text-green-700 border-green-200";
      case "liability":
        return "bg-red-100 text-red-700 border-red-200";
      case "equity":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "income":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "expense":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-muted text-muted-foreground";
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAccounts || {}).map(([type, typeAccounts]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${getAccountTypeColor(type)} font-medium`}>
                  {type.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {typeAccounts.length} accounts
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Account</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead className="text-right">Opening Balance</TableHead>
                      <TableHead className="text-right">Current Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{account.account_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Code: {account.account_code}
                            </p>
                            {account.is_system_account && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                                System
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize">
                            {account.account_group.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={account.opening_balance >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {formatCurrency(Math.abs(account.opening_balance))}
                            {account.opening_balance < 0 && " Cr"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={account.current_balance >= 0 ? "text-emerald-600" : "text-red-600"}>
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
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No accounts found
            </div>
          )}
        </div>
      )}
    </div>
  );
}