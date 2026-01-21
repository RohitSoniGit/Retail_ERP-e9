"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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
import { demoDashboardStats, demoSales } from "@/lib/demo-data";
import {
  Loader2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Sparkles,
  Zap,
  Star,
  Rocket,
  Crown,
  Gem
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Floating elements component
function FloatingElements() {
  const [elements, setElements] = useState<Array<{ id: number; x: number; y: number; delay: number; icon: any }>>([]);

  useEffect(() => {
    const icons = [Sparkles, Star, Gem, Crown, Rocket];
    const newElements = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      icon: icons[Math.floor(Math.random() * icons.length)],
    }));
    setElements(newElements);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((element) => {
        const Icon = element.icon;
        return (
          <Icon
            key={element.id}
            className="absolute w-4 h-4 text-blue-400/20 dark:text-purple-400/20 float"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              animationDelay: `${element.delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { organizationId } = useOrganization();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const supabase = getSupabaseBrowserClient();

  const { data: stats, isLoading } = useSWR(
    organizationId ? `dashboard-${organizationId}` : null,
    async () => {
      // In demo mode, return static demo data
      if (organizationId === 'demo-org-id') {
        return {
          ...demoDashboardStats,
          recentSales: demoSales,
        };
      }

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
          total: daySales?.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0,
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
        todaySales: todaySales?.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0,
        todayTransactions: todaySales?.length || 0,
        yesterdaySales: yesterdaySales?.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0,
        weekSales: 0,
        monthSales: monthSales?.reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0) || 0,
        lowStockItems: (lowStockItems as Item[]) || [],
        lowStockCount: lowStockItems?.length || 0,
        outstandingCredit: creditSales?.reduce((sum: number, s: any) => sum + (s.credit_amount || 0), 0) || 0,
        cashInHand: 0,
        topSellingItems: [],
        salesTrend: trendData,
        recentSales: (recentSales as Sale[]) || [],
      } as DashboardStats & { recentSales: Sale[] };
    }
  );

  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <FloatingElements />
        <div className="glass p-8 rounded-3xl text-center space-y-4 stagger-1">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-lg font-semibold gradient-text">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <FloatingElements />
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className={`glass border-0 shadow-2xl animate-pulse stagger-${i}`}>
                <CardContent className="p-6 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 pb-32 md:pb-6 space-y-6">
        {/* Simple Header */}


        {/* Stats */}
        <div className="fade-in">
          <EnhancedStats stats={stats!} />
        </div>

        {/* Sales Trend */}
        <div className="fade-in">
          <SalesTrendChart data={stats?.salesTrend || []} />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          {stats?.lowStockItems && stats.lowStockItems.length > 0 && (
            <Card className="bg-card border-border shadow-sm hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Low Stock Alert
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    {stats.lowStockItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {stats.lowStockItems.slice(0, 3).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm text-card-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-amber-700 border-amber-300">
                            {item.current_stock} left
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {stats.lowStockItems.length > 3 && (
                  <div className="mt-4">
                    <Link href="/items?filter=low-stock">
                      <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                        View All {stats.lowStockItems.length} Items
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Sales */}
          <Card className="bg-card border-border shadow-sm hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
                <Clock className="h-5 w-5 text-primary" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                          <div>
                            <p className="font-medium text-sm text-card-foreground">{sale.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sale.created_at).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-card-foreground">{sale.customer_name || "Walk-in"}</p>
                            {sale.is_credit && (
                              <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                Credit
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-accent">
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
      </div>
    </div>
  );
}
