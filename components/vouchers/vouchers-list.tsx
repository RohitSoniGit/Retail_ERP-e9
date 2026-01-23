"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, type Voucher } from "@/lib/types";
import { Plus, Search, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { AddVoucherDialog } from "./add-voucher-dialog";

export function VouchersList() {
  const { organizationId } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [voucherType, setVoucherType] = useState<"receipt" | "payment">("receipt");
  const [activeTab, setActiveTab] = useState("all");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: vouchers, isLoading, mutate } = useSWR(
    organizationId ? `vouchers-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .eq("organization_id", organizationId)
        .order("voucher_date", { ascending: false });

      if (error) throw error;
      return data as Voucher[];
    }
  );

  const filteredVouchers = vouchers?.filter((v) => {
    const matchesSearch =
      v.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.party_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || v.voucher_type === activeTab;
    return matchesSearch && matchesTab;
  });

  // Calculate today's totals
  const today = new Date().toISOString().split("T")[0];
  const todayVouchers = vouchers?.filter(
    (v) => v.voucher_date.split("T")[0] === today
  );
  const todayReceipts = todayVouchers
    ?.filter((v) => v.voucher_type === "receipt")
    .reduce((sum, v) => sum + v.amount, 0) || 0;
  const todayPayments = todayVouchers
    ?.filter((v) => v.voucher_type === "payment")
    .reduce((sum, v) => sum + v.amount, 0) || 0;

  const openAddDialog = (type: "receipt" | "payment") => {
    setVoucherType(type);
    setShowAddDialog(true);
  };

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className="glass border-0 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform duration-200 group overflow-hidden relative"
          onClick={() => openAddDialog("receipt")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent group-hover:from-emerald-500/20 transition-all" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-500">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Receipts Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(todayReceipts)}</p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
              <Plus className="h-3 w-3" /> Tap to add receipt
            </p>
          </CardContent>
        </Card>

        <Card
          className="glass border-0 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform duration-200 group overflow-hidden relative"
          onClick={() => openAddDialog("payment")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent group-hover:from-red-500/20 transition-all" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-full bg-red-500/20 text-red-500">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">Payments Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(todayPayments)}</p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 group-hover:text-red-500 transition-colors">
              <Plus className="h-3 w-3" /> Tap to add payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Tabs */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vouchers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-0 shadow-sm h-11"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            <TabsList 
              className="flex w-max min-w-full glass border-0 p-1 h-12 gap-1"
              style={{ 
                display: 'flex', 
                width: 'max-content', 
                minWidth: '100%',
                flexWrap: 'nowrap'
              }}
            >
              <TabsTrigger 
                value="all" 
                className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all text-xs sm:text-sm"
                style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="receipt" 
                className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500 data-[state=active]:shadow-md transition-all text-xs sm:text-sm"
                style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
              >
                Receipts
              </TabsTrigger>
              <TabsTrigger 
                value="payment" 
                className="flex-shrink-0 flex-grow-0 px-4 py-2 min-w-fit whitespace-nowrap data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500 data-[state=active]:shadow-md transition-all text-xs sm:text-sm"
                style={{ flexShrink: 0, flexGrow: 0, whiteSpace: 'nowrap' }}
              >
                Payments
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* Vouchers Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-indigo-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border-0 overflow-hidden glass shadow-xl">
          <Table>
            <TableHeader className="bg-white/10 backdrop-blur-md">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="font-bold text-foreground">Voucher</TableHead>
                <TableHead className="font-bold text-foreground">Party</TableHead>
                <TableHead className="text-right font-bold text-foreground">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVouchers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-8 w-8 opacity-50" />
                      <p>No vouchers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVouchers?.map((voucher) => (
                  <TableRow key={voucher.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`border-0 shadow-sm ${voucher.voucher_type === "receipt"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-red-500/10 text-red-600"
                              }`}
                          >
                            {voucher.voucher_type === "receipt" ? "RV" : "PV"}
                          </Badge>
                          <span className="text-sm font-semibold font-mono">{voucher.voucher_number}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-1">
                          {new Date(voucher.voucher_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{voucher.party_name || "-"}</p>
                      {voucher.narration && (
                        <p className="text-xs text-muted-foreground truncate max-w-[150px] opacity-80">
                          {voucher.narration}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-bold font-mono ${voucher.voucher_type === "receipt"
                            ? "text-emerald-600"
                            : "text-red-500"
                          }`}
                      >
                        {voucher.voucher_type === "receipt" ? "+" : "-"}
                        {formatCurrency(voucher.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Voucher Dialog */}
      <AddVoucherDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        voucherType={voucherType}
        onSuccess={() => {
          mutate();
          setShowAddDialog(false);
        }}
      />
    </div>
  );
}
