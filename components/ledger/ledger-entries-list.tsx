"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, type LedgerEntry } from "@/lib/types";
import { Search, Plus, FileText, Loader2 } from "lucide-react";

import { AddVoucherDialog } from "@/components/vouchers/add-voucher-dialog";

export function LedgerEntriesList() {
  const { organizationId } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddVoucherOpen, setIsAddVoucherOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: entries, isLoading, mutate } = useSWR(
    organizationId && selectedDate ? `ledger-entries-${organizationId}-${selectedDate}` : null,
    async () => {
      const { data, error } = await supabase
        .from("ledger_entries")
        .select(`
          *,
          ledger_entry_details (
            *,
            ledger_accounts (
              account_name,
              account_code
            )
          )
        `)
        .eq("organization_id", organizationId)
        .eq("entry_date", selectedDate)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (LedgerEntry & {
        ledger_entry_details: Array<{
          id: string;
          account_id: string;
          account_name: string;
          debit_amount: number;
          credit_amount: number;
          narration?: string;
          ledger_accounts: {
            account_name: string;
            account_code: string;
          };
        }>;
      })[];
    }
  );

  const filteredEntries = entries?.filter(
    (entry) =>
      entry.entry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.narration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getReferenceTypeColor = (type?: string) => {
    switch (type) {
      case "sale":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "purchase":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "payment":
        return "bg-red-100 text-red-700 border-red-200";
      case "receipt":
        return "bg-green-100 text-green-700 border-green-200";
      case "journal":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

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
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="date" className="text-sm">Date:</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <Button size="sm" onClick={() => setIsAddVoucherOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Journal Entry
        </Button>
      </div>

      <AddVoucherDialog
        open={isAddVoucherOpen}
        onOpenChange={setIsAddVoucherOpen}
        onSuccess={() => mutate()}
        voucherType="journal"
      />

      {/* Entries */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No ledger entries found for {new Date(selectedDate).toLocaleDateString("en-IN")}
            </div>
          ) : (
            filteredEntries?.map((entry) => (
              <div key={entry.id} className="border rounded-lg overflow-hidden">
                {/* Entry Header */}
                <div className="bg-muted/30 p-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{entry.entry_number}</span>
                      {entry.reference_type && (
                        <Badge variant="outline" className={`text-xs ${getReferenceTypeColor(entry.reference_type)}`}>
                          {entry.reference_type.toUpperCase()}
                        </Badge>
                      )}
                      {entry.reference_number && (
                        <span className="text-xs text-muted-foreground">
                          Ref: {entry.reference_number}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(entry.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  {entry.narration && (
                    <p className="text-sm text-muted-foreground mt-1">{entry.narration}</p>
                  )}
                </div>

                {/* Entry Details */}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.ledger_entry_details?.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {detail.ledger_accounts?.account_name || detail.account_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {detail.ledger_accounts?.account_code}
                            </p>
                            {detail.narration && (
                              <p className="text-xs text-blue-600">{detail.narration}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {detail.debit_amount > 0 ? (
                            <span className="font-medium text-red-600">
                              {formatCurrency(detail.debit_amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {detail.credit_amount > 0 ? (
                            <span className="font-medium text-emerald-600">
                              {formatCurrency(detail.credit_amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Entry Totals */}
                <div className="bg-muted/20 p-3 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total:</span>
                    <div className="flex gap-8">
                      <span className="text-red-600">
                        Dr: {formatCurrency(
                          entry.ledger_entry_details?.reduce((sum, d) => sum + d.debit_amount, 0) || 0
                        )}
                      </span>
                      <span className="text-emerald-600">
                        Cr: {formatCurrency(
                          entry.ledger_entry_details?.reduce((sum, d) => sum + d.credit_amount, 0) || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}