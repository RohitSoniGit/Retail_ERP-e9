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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Profit & Loss Statement</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="from_date" className="text-sm">From:</Label>
            <Input
              id="from_date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="to_date" className="text-sm">To:</Label>
            <Input
              id="to_date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {pnlData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-blue-700">Total Revenue</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(pnlData.revenue.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-orange-700">Total COGS</p>
              <p className="text-xl font-bold text-orange-700">{formatCurrency(pnlData.cogs.totalCOGS)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-green-700">Gross Profit</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(pnlData.grossProfit)}</p>
            </CardContent>
          </Card>
          <Card className={pnlData.netProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}>
            <CardContent className="p-4 text-center">
              <p className={`text-sm ${pnlData.netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>Net Profit</p>
              <p className={`text-xl font-bold ${pnlData.netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {formatCurrency(Math.abs(pnlData.netProfit))}
                {pnlData.netProfit < 0 && " Loss"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* P&L Statement */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Profit & Loss Statement for {new Date(fromDate).toLocaleDateString("en-IN")} to {new Date(toDate).toLocaleDateString("en-IN")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Particulars</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Revenue Section */}
                <TableRow className="bg-blue-50">
                  <TableCell className="font-bold text-blue-700">REVENUE</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-8">Sales (Net of Tax)</TableCell>
                  <TableCell className="text-right">{formatCurrency(pnlData?.revenue.sales || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-8">Sales Tax Collected</TableCell>
                  <TableCell className="text-right">{formatCurrency(pnlData?.revenue.salesTax || 0)}</TableCell>
                </TableRow>
                <TableRow className="font-medium bg-blue-100">
                  <TableCell>Total Revenue</TableCell>
                  <TableCell className="text-right">{formatCurrency(pnlData?.revenue.totalRevenue || 0)}</TableCell>
                </TableRow>

                {/* COGS Section */}
                <TableRow className="bg-orange-50">
                  <TableCell className="font-bold text-orange-700">COST OF GOODS SOLD</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-8">Purchases (Net of Tax)</TableCell>
                  <TableCell className="text-right">{formatCurrency(pnlData?.cogs.purchases || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-8">Purchase Tax Paid</TableCell>
                  <TableCell className="text-right">{formatCurrency(pnlData?.cogs.purchaseTax || 0)}</TableCell>
                </TableRow>
                <TableRow className="font-medium bg-orange-100">
                  <TableCell>Total COGS</TableCell>
                  <TableCell className="text-right">{formatCurrency(pnlData?.cogs.totalCOGS || 0)}</TableCell>
                </TableRow>

                {/* Gross Profit */}
                <TableRow className="font-bold bg-green-100 text-green-700">
                  <TableCell>GROSS PROFIT</TableCell>
                  <TableCell className="text-right">{formatCurrency(pnlData?.grossProfit || 0)}</TableCell>
                </TableRow>

                {/* Expenses Section */}
                <TableRow className="bg-red-50">
                  <TableCell className="font-bold text-red-700">OPERATING EXPENSES</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-8">Operating Expenses</TableCell>
                  <TableCell className="text-right">{formatCurrency(pnlData?.expenses.operating || 0)}</TableCell>
                </TableRow>
                <TableRow className="font-medium bg-red-100">
                  <TableCell>Total Expenses</TableCell>
                  <TableCell className="text-right">{formatCurrency(pnlData?.expenses.totalExpenses || 0)}</TableCell>
                </TableRow>

                {/* Net Profit */}
                <TableRow className={`font-bold text-lg border-t-2 ${(pnlData?.netProfit || 0) >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  <TableCell>NET PROFIT {(pnlData?.netProfit || 0) < 0 && "(LOSS)"}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.abs(pnlData?.netProfit || 0))}
                  </TableCell>
                </TableRow>

                {/* Profit Margin */}
                <TableRow className="bg-muted/30">
                  <TableCell className="font-medium">Profit Margin %</TableCell>
                  <TableCell className="text-right font-medium">
                    {(pnlData?.profitMargin || 0).toFixed(2)}%
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