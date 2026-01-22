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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-4 glass p-2 rounded-xl border-0 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-0 shadow-inner h-11"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto bg-white/5 rounded-lg p-1">
          <Label htmlFor="date" className="text-sm font-medium px-2">Date:</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto bg-transparent border-0 h-9 focus-visible:ring-0 p-0 shadow-none text-sm"
          />
        </div>
        <Button
          className="holographic text-white shadow-lg border-0 h-11 w-full sm:w-auto hover:scale-[1.02] transition-transform"
          onClick={() => setIsAddVoucherOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
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
        <div className="flex items-center justify-center py-16 text-indigo-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEntries?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground glass rounded-xl border-dashed border-2 border-white/10">
              <div className="p-6 rounded-full bg-white/5 mb-4">
                <FileText className="h-10 w-10 opacity-50" />
              </div>
              <p className="text-lg font-medium">No ledger entries found</p>
              <p className="text-sm">No entries for {new Date(selectedDate).toLocaleDateString("en-IN")}</p>
            </div>
          ) : (
            filteredEntries?.map((entry) => (
              <div key={entry.id} className="glass border-0 rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-all">
                {/* Entry Header */}
                <div className="bg-white/5 p-4 border-b border-white/10 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-foreground">{entry.entry_number}</span>
                      {entry.reference_type && (
                        <Badge variant="outline" className={`text-xs border-0 shadow-sm ${getReferenceTypeColor(entry.reference_type)}`}>
                          {entry.reference_type.toUpperCase()}
                        </Badge>
                      )}
                      {entry.reference_number && (
                        <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md border border-white/10 font-mono">
                          Ref: {entry.reference_number}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-base font-mono text-foreground">{formatCurrency(entry.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  {entry.narration && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block"></span>
                      {entry.narration}
                    </p>
                  )}
                </div>

                {/* Entry Details */}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white/5 hover:bg-white/10 border-b border-white/5">
                      <TableHead className="font-bold text-foreground pl-6">Account</TableHead>
                      <TableHead className="text-right font-bold text-foreground">Debit</TableHead>
                      <TableHead className="text-right font-bold text-foreground pr-6">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.ledger_entry_details?.map((detail) => (
                      <TableRow key={detail.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="pl-6">
                          <div className="space-y-1">
                            <p className="font-medium text-sm text-foreground">
                              {detail.ledger_accounts?.account_name || detail.account_name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {detail.ledger_accounts?.account_code}
                            </p>
                            {detail.narration && (
                              <p className="text-xs text-indigo-400 italic">{detail.narration}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {detail.debit_amount > 0 ? (
                            <span className="font-medium text-red-500">
                              {formatCurrency(detail.debit_amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono pr-6">
                          {detail.credit_amount > 0 ? (
                            <span className="font-medium text-emerald-500">
                              {formatCurrency(detail.credit_amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Entry Totals */}
                <div className="bg-white/5 p-4 border-t border-white/10 backdrop-blur-md">
                  <div className="flex justify-end text-sm font-medium gap-8">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground uppercase text-xs">Total Dr:</span>
                      <span className="text-red-500 font-bold font-mono text-lg">
                        {formatCurrency(
                          entry.ledger_entry_details?.reduce((sum, d) => sum + d.debit_amount, 0) || 0
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                      <span className="text-muted-foreground uppercase text-xs">Total Cr:</span>
                      <span className="text-emerald-500 font-bold font-mono text-lg">
                        {formatCurrency(
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