"use client";

import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { EnhancedStats } from "@/components/dashboard/enhanced-stats";
import { SalesTrendChart } from "@/components/dashboard/sales-trend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, type DashboardStats, type Item, type Sale } from "@/lib/types";
import { Loader2, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { organizationId } = useOrganization();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: stats, isLoading } = useSWR(
    organizationId ? `dashboard-${organizationId}` : null,
    async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString();

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = monthStart.toISOString();

      // Today's sales
      const { data: todaySales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("organization_id", organizationId)
        .gte("created_at", todayStr);

      // Yesterday's sales
      const { data: yesterdaySales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("organization_id", organizationId)
        .gte("created_at", yesterdayStr)
        .lt("created_at", todayStr);

      // This month's sales
      const { data: monthSales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("organization_id", organizationId)
        .gte("created_at", monthStartStr);

      // Low stock items
      const { data: lowStockItems } = await supabase
        .from("items")
        .select("*")
        .eq("organization_id", organizationId)
        .lt("current_stock", 10)
        .order("current_stock", { ascending: true })
        .limit(5);

      // Outstanding credit
      const { data: creditSales } = await supabase
        .from("sales")
        .select("credit_amount")
        .eq("organization_id", organizationId)
        .eq("is_credit", true)
        .eq("is_paid", false);

      // 7-day sales trend
      const trendData: { date: string; total: number; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const { data: daySales } = await supabase
          .from("sales")
          .select("total_amount")
          .eq("organization_id", organizationId)
          .gte("created_at", `${dateStr}T00:00:00`)
          .lt("created_at", `${nextDate.toISOString().split("T")[0]}T00:00:00`);

        trendData.push({
          date: dateStr,
          total: daySales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0,
          count: daySales?.length || 0,
        });
      }

      // Recent sales
      const { data: recentSales } = await supabase
        .from("sales")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5);

      return {
        todaySales: todaySales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0,
        todayTransactions: todaySales?.length || 0,
        yesterdaySales: yesterdaySales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0,
        weekSales: 0,
        monthSales: monthSales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0,
        lowStockItems: (lowStockItems as Item[]) || [],
        lowStockCount: lowStockItems?.length || 0,
        outstandingCredit: creditSales?.reduce((sum, s) => sum + (s.credit_amount || 0), 0) || 0,
        cashInHand: 0,
        topSellingItems: [],
        salesTrend: trendData,
        recentSales: (recentSales as Sale[]) || [],
      } as DashboardStats & { recentSales: Sale[] };
    }
  );

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-24 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 md:pb-4 space-y-4">
      {/* Stats Cards */}
      <EnhancedStats stats={stats!} />

      {/* Sales Trend */}
      <SalesTrendChart data={stats?.salesTrend || []} />

      {/* Low Stock Alert */}
      {stats?.lowStockItems && stats.lowStockItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {stats.lowStockItems.slice(0, 3).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                        {item.current_stock} left
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {stats.lowStockItems.length > 3 && (
              <Link href="/items?filter=low-stock">
                <Button variant="ghost" className="w-full text-amber-700 text-sm">
                  View all {stats.lowStockItems.length} items
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              {(stats as DashboardStats & { recentSales: Sale[] })?.recentSales?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No sales yet today
                  </TableCell>
                </TableRow>
              ) : (
                (stats as DashboardStats & { recentSales: Sale[] })?.recentSales?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{sale.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{sale.customer_name || "Walk-in"}</p>
                      {sale.is_credit && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                          Credit
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total_amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
