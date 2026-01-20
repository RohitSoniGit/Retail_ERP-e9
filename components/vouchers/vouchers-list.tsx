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
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-emerald-50 border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => openAddDialog("receipt")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">Receipts Today</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(todayReceipts)}</p>
            <p className="text-xs text-emerald-600 mt-1">Tap to add receipt</p>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => openAddDialog("payment")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Payments Today</span>
            </div>
            <p className="text-xl font-bold text-red-700">{formatCurrency(todayPayments)}</p>
            <p className="text-xs text-red-600 mt-1">Tap to add payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vouchers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="receipt" className="flex-1">Receipts</TabsTrigger>
            <TabsTrigger value="payment" className="flex-1">Payments</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Vouchers Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Voucher</TableHead>
                <TableHead>Party</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVouchers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No vouchers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVouchers?.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              voucher.voucher_type === "receipt"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {voucher.voucher_type === "receipt" ? "RV" : "PV"}
                          </Badge>
                          <span className="text-sm font-medium">{voucher.voucher_number}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(voucher.voucher_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{voucher.party_name || "-"}</p>
                      {voucher.narration && (
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {voucher.narration}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          voucher.voucher_type === "receipt"
                            ? "text-emerald-600"
                            : "text-red-600"
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
