"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, type Sale, type ProfitLossEntry } from "@/lib/types";
import { Loader2, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { DayBook } from "@/components/reports/day-book";
import Link from "next/link";

export default function ReportsPage() {
  const { organizationId } = useOrganization();
  const [activeTab, setActiveTab] = useState("daybook");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch profit/loss data
  const { data: profitData, isLoading: loadingProfit } = useSWR(
    organizationId && activeTab === "profit" ? `profit-${organizationId}` : null,
    async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: saleItems, error } = await supabase
        .from("sale_items")
        .select(`
          *,
          sales!inner(organization_id, created_at)
        `)
        .eq("sales.organization_id", organizationId)
        .gte("sales.created_at", thirtyDaysAgo.toISOString());

      if (error) throw error;

      // Group by item
      const itemMap = new Map<string, ProfitLossEntry>();

      saleItems?.forEach((si: {
        item_id: string;
        item_name: string;
        quantity: number;
        total_price: number;
        purchase_price?: number;
        unit_price: number;
      }) => {
        const existing = itemMap.get(si.item_id);
        const cost = (si.purchase_price || si.unit_price * 0.7) * si.quantity;
        
        if (existing) {
          existing.quantity_sold += si.quantity;
          existing.revenue += si.total_price;
          existing.cost += cost;
          existing.profit = existing.revenue - existing.cost;
          existing.margin_percent = (existing.profit / existing.revenue) * 100;
        } else {
          itemMap.set(si.item_id, {
            item_id: si.item_id,
            item_name: si.item_name || "Unknown",
            quantity_sold: si.quantity,
            revenue: si.total_price,
            cost: cost,
            profit: si.total_price - cost,
            margin_percent: ((si.total_price - cost) / si.total_price) * 100,
          });
        }
      });

      return Array.from(itemMap.values()).sort((a, b) => b.profit - a.profit);
    }
  );

  // Fetch credit sales (Udhari)
  const { data: creditSales, isLoading: loadingCredit, mutate: mutateCredit } = useSWR(
    organizationId && activeTab === "udhari" ? `credit-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_credit", true)
        .eq("is_paid", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Sale[];
    }
  );

  const totalProfit = profitData?.reduce((sum, p) => sum + p.profit, 0) || 0;
  const totalRevenue = profitData?.reduce((sum, p) => sum + p.revenue, 0) || 0;
  const totalCredit = creditSales?.reduce((sum, s) => sum + (s.credit_amount || s.total_amount), 0) || 0;

  const markAsPaid = async (saleId: string) => {
    try {
      await supabase
        .from("sales")
        .update({ is_paid: true, is_credit: false })
        .eq("id", saleId);
      mutateCredit();
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">View business insights</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="daybook" className="flex-1">Day Book</TabsTrigger>
          <TabsTrigger value="profit" className="flex-1">Profit/Loss</TabsTrigger>
          <TabsTrigger value="udhari" className="flex-1">Udhari</TabsTrigger>
        </TabsList>

        {/* Day Book Tab */}
        <TabsContent value="daybook" className="mt-0">
          <DayBook />
        </TabsContent>

        {/* Profit/Loss Tab */}
        <TabsContent value="profit" className="mt-0 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">Total Profit</span>
                </div>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalProfit)}</p>
                <p className="text-xs text-emerald-600">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Margin</p>
                <p className="text-xl font-bold">
                  {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Average</p>
              </CardContent>
            </Card>
          </div>

          {/* Profit Table */}
          {loadingProfit ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Item-wise Profit (30 days)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitData?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No sales data for this period
                        </TableCell>
                      </TableRow>
                    ) : (
                      profitData?.slice(0, 10).map((item) => (
                        <TableRow key={item.item_id}>
                          <TableCell>
                            <p className="font-medium text-sm">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Rev: {formatCurrency(item.revenue)}
                            </p>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {item.quantity_sold}
                          </TableCell>
                          <TableCell className="text-right">
                            <p className={`font-medium text-sm ${item.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {formatCurrency(item.profit)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.margin_percent?.toFixed(0)}% margin
                            </p>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Udhari (Credit) Tab */}
        <TabsContent value="udhari" className="mt-0 space-y-4">
          {/* Summary */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Total Outstanding</p>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(totalCredit)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-300" />
              </div>
            </CardContent>
          </Card>

          {/* Credit Sales List */}
          {loadingCredit ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditSales?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No pending credits
                        </TableCell>
                      </TableRow>
                    ) : (
                      creditSales?.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{sale.customer_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {sale.invoice_number} |{" "}
                              {new Date(sale.created_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-medium text-red-600">{formatCurrency(sale.credit_amount || sale.total_amount)}</p>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600"
                              onClick={() => markAsPaid(sale.id)}
                            >
                              Paid
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Link href="/customers">
            <Button variant="outline" className="w-full bg-transparent">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              View Customer Ledgers
            </Button>
          </Link>
        </TabsContent>
      </Tabs>
    </div>
  );
}
