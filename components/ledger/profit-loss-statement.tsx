"use client";

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
import { formatCurrency } from "@/lib/types";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";

export function ProfitLossStatement() {
  const { organizationId } = useOrganization();
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: pnlData, isLoading } = useSWR(
    organizationId && fromDate && toDate ? `pnl-${organizationId}-${fromDate}-${toDate}` : null,
    async () => {
      // Get sales data
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("total_amount, cgst_amount, sgst_amount, igst_amount")
        .eq("organization_id", organizationId)
        .gte("sale_date", fromDate)
        .lte("sale_date", toDate);

      if (salesError) throw salesError;

      // Get purchase data (from purchase receipts)
      const { data: purchases, error: purchaseError } = await supabase
        .from("purchase_receipts")
        .select("total_amount, cgst_amount, sgst_amount, igst_amount")
        .eq("organization_id", organizationId)
        .gte("receipt_date", fromDate)
        .lte("receipt_date", toDate);

      if (purchaseError) throw purchaseError;

      // Calculate totals
      const totalSales = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
      const totalPurchases = purchases?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

      const salesTax = sales?.reduce((sum, s) => sum + (s.cgst_amount + s.sgst_amount + s.igst_amount), 0) || 0;
      const purchaseTax = purchases?.reduce((sum, p) => sum + (p.cgst_amount + p.sgst_amount + p.igst_amount), 0) || 0;

      const netSales = totalSales - salesTax;
      const netPurchases = totalPurchases - purchaseTax;

      // Gross profit
      const grossProfit = netSales - netPurchases;

      // Operating expenses (simplified - in real system, get from expense accounts)
      const operatingExpenses = grossProfit * 0.1; // 10% of gross profit as demo

      // Net profit
      const netProfit = grossProfit - operatingExpenses;

      return {
        revenue: {
          sales: netSales,
          salesTax: salesTax,
          totalRevenue: totalSales,
        },
        cogs: {
          purchases: netPurchases,
          purchaseTax: purchaseTax,
          totalCOGS: totalPurchases,
        },
        grossProfit,
        expenses: {
          operating: operatingExpenses,
          totalExpenses: operatingExpenses,
        },
        netProfit,
        profitMargin: netSales > 0 ? (netProfit / netSales) * 100 : 0,
      };
    }
  );

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">Profit & Loss Statement</h2>
            <p className="text-sm text-muted-foreground">Financial performance overview</p>
          </div>
        </div>
        <div className="flex items-center gap-3 glass p-2 rounded-xl border-0 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <Label htmlFor="from_date" className="text-sm font-medium">From:</Label>
            <Input
              id="from_date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-auto bg-transparent border-0 h-8 focus-visible:ring-0 p-0 shadow-none text-sm"
            />
          </div>
          <div className="w-[1px] h-6 bg-white/20"></div>
          <div className="flex items-center gap-2 px-2">
            <Label htmlFor="to_date" className="text-sm font-medium">To:</Label>
            <Input
              id="to_date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-auto bg-transparent border-0 h-8 focus-visible:ring-0 p-0 shadow-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {pnlData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all duration-500" />
            <CardContent className="p-6 text-center relative">
              <p className="text-sm font-semibold text-blue-500">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(pnlData.revenue.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="glass border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent group-hover:from-orange-500/20 transition-all duration-500" />
            <CardContent className="p-6 text-center relative">
              <p className="text-sm font-semibold text-orange-500">Total COGS</p>
              <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(pnlData.cogs.totalCOGS)}</p>
            </CardContent>
          </Card>
          <Card className="glass border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent group-hover:from-green-500/20 transition-all duration-500" />
            <CardContent className="p-6 text-center relative">
              <p className="text-sm font-semibold text-green-500">Gross Profit</p>
              <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(pnlData.grossProfit)}</p>
            </CardContent>
          </Card>
          <Card className={`glass border-0 shadow-lg relative overflow-hidden group ${(pnlData?.netProfit ?? 0) >= 0 ? "shadow-emerald-500/10" : "shadow-red-500/10"}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${(pnlData?.netProfit ?? 0) >= 0 ? "from-emerald-500/10 to-transparent group-hover:from-emerald-500/20" : "from-red-500/10 to-transparent group-hover:from-red-500/20"} transition-all duration-500`} />
            <CardContent className="p-6 text-center relative">
              <p className={`text-sm font-semibold ${(pnlData?.netProfit ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>Net Profit</p>
              <p className={`text-2xl font-bold mt-2 ${(pnlData?.netProfit ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {formatCurrency(Math.abs(pnlData?.netProfit ?? 0))}
                {(pnlData?.netProfit ?? 0) < 0 && " (Loss)"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* P&L Statement */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-indigo-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border-0 overflow-hidden glass shadow-xl">
          <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
            <h3 className="font-semibold text-lg">Detailed Statement</h3>
            <p className="text-sm text-muted-foreground">From {new Date(fromDate).toLocaleDateString("en-IN")} to {new Date(toDate).toLocaleDateString("en-IN")}</p>
          </div>
          <Table>
            <TableHeader className="bg-white/5 backdrop-blur-md">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="font-bold text-foreground pl-6">Particulars</TableHead>
                <TableHead className="text-right font-bold text-foreground pr-6">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Revenue Section */}
              <TableRow className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors border-b border-white/5">
                <TableCell className="font-bold text-blue-500 pl-6 py-3">REVENUE</TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow className="hover:bg-white/5 border-b border-white/5">
                <TableCell className="pl-10 text-muted-foreground">Sales (Net of Tax)</TableCell>
                <TableCell className="text-right font-mono pr-6">{formatCurrency(pnlData?.revenue.sales || 0)}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-white/5 border-b border-white/5">
                <TableCell className="pl-10 text-muted-foreground">Sales Tax Collected</TableCell>
                <TableCell className="text-right font-mono pr-6">{formatCurrency(pnlData?.revenue.salesTax || 0)}</TableCell>
              </TableRow>
              <TableRow className="font-semibold bg-blue-500/10 hover:bg-blue-500/15 border-b border-white/5">
                <TableCell className="pl-6">Total Revenue</TableCell>
                <TableCell className="text-right font-mono pr-6">{formatCurrency(pnlData?.revenue.totalRevenue || 0)}</TableCell>
              </TableRow>

              {/* COGS Section */}
              <TableRow className="bg-orange-500/5 hover:bg-orange-500/10 transition-colors border-b border-white/5">
                <TableCell className="font-bold text-orange-500 pl-6 py-3">COST OF GOODS SOLD</TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow className="hover:bg-white/5 border-b border-white/5">
                <TableCell className="pl-10 text-muted-foreground">Purchases (Net of Tax)</TableCell>
                <TableCell className="text-right font-mono pr-6">{formatCurrency(pnlData?.cogs.purchases || 0)}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-white/5 border-b border-white/5">
                <TableCell className="pl-10 text-muted-foreground">Purchase Tax Paid</TableCell>
                <TableCell className="text-right font-mono pr-6">{formatCurrency(pnlData?.cogs.purchaseTax || 0)}</TableCell>
              </TableRow>
              <TableRow className="font-semibold bg-orange-500/10 hover:bg-orange-500/15 border-b border-white/5">
                <TableCell className="pl-6">Total COGS</TableCell>
                <TableCell className="text-right font-mono pr-6">{formatCurrency(pnlData?.cogs.totalCOGS || 0)}</TableCell>
              </TableRow>

              {/* Gross Profit */}
              <TableRow className="font-bold bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border-b border-white/5">
                <TableCell className="pl-6 py-4">GROSS PROFIT</TableCell>
                <TableCell className="text-right font-mono text-lg pr-6">{formatCurrency(pnlData?.grossProfit || 0)}</TableCell>
              </TableRow>

              {/* Expenses Section */}
              <TableRow className="bg-red-500/5 hover:bg-red-500/10 transition-colors border-b border-white/5">
                <TableCell className="font-bold text-red-500 pl-6 py-3">OPERATING EXPENSES</TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow className="hover:bg-white/5 border-b border-white/5">
                <TableCell className="pl-10 text-muted-foreground">Operating Expenses</TableCell>
                <TableCell className="text-right font-mono pr-6">{formatCurrency(pnlData?.expenses.operating || 0)}</TableCell>
              </TableRow>
              <TableRow className="font-semibold bg-red-500/10 hover:bg-red-500/15 border-b border-white/5">
                <TableCell className="pl-6">Total Expenses</TableCell>
                <TableCell className="text-right font-mono pr-6">{formatCurrency(pnlData?.expenses.totalExpenses || 0)}</TableCell>
              </TableRow>

              {/* Net Profit */}
              <TableRow className={`font-bold text-xl border-t-2 border-white/10 ${(pnlData?.netProfit || 0) >= 0 ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}`}>
                <TableCell className="pl-6 py-6">NET PROFIT {(pnlData?.netProfit || 0) < 0 && "(LOSS)"}</TableCell>
                <TableCell className="text-right font-mono pr-6">
                  {formatCurrency(Math.abs(pnlData?.netProfit || 0))}
                </TableCell>
              </TableRow>

              {/* Profit Margin */}
              <TableRow className="bg-white/5 border-b border-white/5">
                <TableCell className="font-medium pl-6 py-3 text-muted-foreground">Profit Margin %</TableCell>
                <TableCell className="text-right font-medium font-mono pr-6 text-muted-foreground">
                  {(pnlData?.profitMargin || 0).toFixed(2)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}