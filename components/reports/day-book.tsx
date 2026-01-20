"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, type Sale, type Voucher } from "@/lib/types";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export function DayBook() {
  const { organizationId } = useOrganization();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const dateStr = selectedDate.toISOString().split("T")[0];

  const { data, isLoading } = useSWR(
    organizationId ? `daybook-${organizationId}-${dateStr}` : null,
    async () => {
      // Fetch sales for the day
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .eq("organization_id", organizationId)
        .gte("created_at", `${dateStr}T00:00:00`)
        .lt("created_at", `${dateStr}T23:59:59`)
        .order("created_at", { ascending: true });

      if (salesError) throw salesError;

      // Fetch vouchers for the day
      const { data: vouchers, error: vouchersError } = await supabase
        .from("vouchers")
        .select("*")
        .eq("organization_id", organizationId)
        .gte("voucher_date", `${dateStr}T00:00:00`)
        .lt("voucher_date", `${dateStr}T23:59:59`)
        .order("voucher_date", { ascending: true });

      if (vouchersError) throw vouchersError;

      return {
        sales: sales as Sale[],
        vouchers: vouchers as Voucher[],
      };
    }
  );

  // Build day book entries
  interface DayBookEntry {
    id: string;
    time: string;
    type: "sale" | "receipt" | "payment";
    description: string;
    reference: string;
    debit: number;
    credit: number;
  }

  const entries: DayBookEntry[] = [];

  // Add sales
  data?.sales?.forEach((sale) => {
    entries.push({
      id: sale.id,
      time: new Date(sale.created_at).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "sale",
      description: sale.customer_name || "Cash Sale",
      reference: sale.invoice_number,
      debit: sale.amount_paid || 0,
      credit: 0,
    });

    if (sale.is_credit && sale.credit_amount > 0) {
      entries.push({
        id: `${sale.id}-credit`,
        time: new Date(sale.created_at).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "sale",
        description: `${sale.customer_name || "Customer"} (Credit)`,
        reference: sale.invoice_number,
        debit: 0,
        credit: sale.credit_amount,
      });
    }
  });

  // Add vouchers
  data?.vouchers?.forEach((voucher) => {
    entries.push({
      id: voucher.id,
      time: new Date(voucher.voucher_date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: voucher.voucher_type as "receipt" | "payment",
      description: voucher.party_name || voucher.narration || "-",
      reference: voucher.voucher_number,
      debit: voucher.voucher_type === "receipt" ? voucher.amount : 0,
      credit: voucher.voucher_type === "payment" ? voucher.amount : 0,
    });
  });

  // Sort by time
  entries.sort((a, b) => a.time.localeCompare(b.time));

  // Calculate totals
  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
  const netCash = totalDebit - totalCredit;

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const isToday = dateStr === new Date().toISOString().split("T")[0];

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-medium">
            {selectedDate.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          {isToday && (
            <Badge variant="outline" className="text-xs">Today</Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => changeDate(1)}
          disabled={isToday}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-emerald-600">Cash In</p>
            <p className="font-bold text-emerald-700">{formatCurrency(totalDebit)}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-red-600">Cash Out</p>
            <p className="font-bold text-red-700">{formatCurrency(totalCredit)}</p>
          </CardContent>
        </Card>
        <Card className={netCash >= 0 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Net Cash</p>
            <p className={`font-bold ${netCash >= 0 ? "text-blue-700" : "text-amber-700"}`}>
              {formatCurrency(Math.abs(netCash))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Day Book Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Day Book</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[60px]">Time</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead className="text-right w-[80px]">In</TableHead>
                  <TableHead className="text-right w-[80px]">Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No transactions for this day
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.time}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                entry.type === "sale"
                                  ? "bg-blue-50 text-blue-700"
                                  : entry.type === "receipt"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {entry.type === "sale" ? "INV" : entry.type === "receipt" ? "RV" : "PV"}
                            </Badge>
                            <div>
                              <p className="text-sm">{entry.description}</p>
                              <p className="text-xs text-muted-foreground">{entry.reference}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm text-emerald-600">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-sm text-red-600">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell colSpan={2} className="text-right">
                        Total
                      </TableCell>
                      <TableCell className="text-right text-emerald-700">
                        {formatCurrency(totalDebit)}
                      </TableCell>
                      <TableCell className="text-right text-red-700">
                        {formatCurrency(totalCredit)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
