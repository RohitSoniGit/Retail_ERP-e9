"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, type Sale, type Voucher } from "@/lib/types";
import { Calendar, Loader2 } from "lucide-react";

export function DayBook() {
  const { organizationId } = useOrganization();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: dayData, isLoading } = useSWR(
    organizationId && selectedDate ? `daybook-${organizationId}-${selectedDate}` : null,
    async () => {
      const startDate = `${selectedDate}T00:00:00`;
      const endDate = `${selectedDate}T23:59:59`;

      // Fetch sales
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .eq("organization_id", organizationId)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      // Fetch vouchers
      const { data: vouchers, error: vouchersError } = await supabase
        .from("vouchers")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("voucher_date", selectedDate)
        .order("created_at", { ascending: false });

      if (vouchersError) throw vouchersError;

      return {
        sales: sales as Sale[],
        vouchers: vouchers as Voucher[],
      };
    }
  );

  const totalSales = dayData?.sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
  const totalReceipts = dayData?.vouchers
    ?.filter(v => v.voucher_type === "receipt")
    .reduce((sum, v) => sum + v.amount, 0) || 0;
  const totalPayments = dayData?.vouchers
    ?.filter(v => v.voucher_type === "payment")
    .reduce((sum, v) => sum + v.amount, 0) || 0;

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Date Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="date">Select Date:</Label>
        <Input
          id="date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-emerald-700">Sales</p>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalSales)}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-blue-700">Receipts</p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(totalReceipts)}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-red-700">Payments</p>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totalPayments)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Transactions - {new Date(selectedDate).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Combine and sort all transactions */}
                {[
                  ...(dayData?.sales?.map(s => ({
                    ...s,
                    type: "sale" as const,
                    time: new Date(s.created_at),
                  })) || []),
                  ...(dayData?.vouchers?.map(v => ({
                    ...v,
                    type: v.voucher_type as const,
                    time: new Date(v.created_at),
                  })) || []),
                ]
                  .sort((a, b) => b.time.getTime() - a.time.getTime())
                  .map((transaction, index) => (
                    <TableRow key={`${transaction.type}-${transaction.id}-${index}`}>
                      <TableCell className="text-sm">
                        {transaction.time.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            transaction.type === "sale"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : transaction.type === "receipt"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {transaction.type === "sale" ? "Sale" : 
                           transaction.type === "receipt" ? "Receipt" : "Payment"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.type === "sale" 
                          ? (transaction as Sale).customer_name || "Walk-in"
                          : (transaction as Voucher).party_name || "-"
                        }
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={
                          transaction.type === "payment" ? "text-red-600" : "text-emerald-600"
                        }>
                          {transaction.type === "payment" ? "-" : "+"}
                          {formatCurrency(
                            transaction.type === "sale" 
                              ? (transaction as Sale).total_amount 
                              : (transaction as Voucher).amount
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                {(!dayData?.sales?.length && !dayData?.vouchers?.length) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No transactions for this date
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}