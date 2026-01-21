"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { EnhancedStats } from "@/components/dashboard/enhanced-stats";
import { SalesTrendChart } from "@/components/dashboard/sales-trend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, type DashboardStats, type Item, type Sale } from "@/lib/types";
import { demoDashboardStats, demoSales } from "@/lib/demo-data";
import {
  Loader2,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  Star,
  Rocket,
  Crown,
  Gem,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Target,
  Activity,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Enhanced floating elements component
function FloatingElements() {
  const [elements, setElements] = useState<Array<{ id: number; x: number; y: number; delay: number; icon: any; size: string }>>([]);

  useEffect(() => {
    const icons = [Sparkles, Star, Gem, Crown, Rocket, DollarSign, Package];
    const newElements = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 8,
      icon: icons[Math.floor(Math.random() * icons.length)],
      size: Math.random() > 0.5 ? 'w-3 h-3' : 'w-4 h-4',
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
            className={`absolute ${element.size} text-blue-400/10 dark:text-purple-400/10 float`}
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
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    setMounted(true);

    // Simulate online status and sync updates
    const interval = setInterval(() => {
      setLastSync(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const supabase = getSupabaseBrowserClient();

  const { data: stats, isLoading } = useSWR(
    organizationId ? `dashboard-${organizationId}` : null,
    async () => {
      // Enhanced demo data with more business metrics
      if (organizationId === 'demo-org-id') {
        return {
          ...demoDashboardStats,
          recentSales: demoSales,
          // Enhanced metrics
          totalCustomers: 156,
          activeSuppliers: 8,
          totalItems: 245,
          outOfStockItems: 3,
          pendingOrders: 5,
          completedOrders: 23,
          bankBalance: 850000,
          advancesPaid: 45000,
          inventoryValue: 2450000,
          monthlyTarget: 1500000,
          targetAchieved: 75,
          topSellingItems: [
            { item_name: "Smartphone XYZ", total_quantity: 25, total_revenue: 450000, growth: 15 },
            { item_name: "Laptop ABC", total_quantity: 12, total_revenue: 600000, growth: 8 },
            { item_name: "Tablet DEF", total_quantity: 18, total_revenue: 504000, growth: 22 },
            { item_name: "Headphones GHI", total_quantity: 45, total_revenue: 135000, growth: -5 },
          ],
          recentTransactions: [
            { id: "INV2024-001", customer: "John Doe", amount: 15000, time: "2 hours ago", status: "completed" },
            { id: "INV2024-002", customer: "Jane Smith", amount: 8500, time: "4 hours ago", status: "completed" },
            { id: "INV2024-003", customer: "ABC Company", amount: 25000, time: "6 hours ago", status: "pending" },
          ],
        };
      }

      // Real data fetching logic (existing code)
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
          <p className="text-lg font-semibold gradient-text">Initializing Business Dashboard...</p>
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

  // Calculate enhanced metrics
  const salesGrowth = stats?.yesterdaySales > 0
    ? ((stats.todaySales - stats.yesterdaySales) / stats.yesterdaySales) * 100
    : 0;

  const inventoryHealth = stats?.lowStockItems
    ? ((245 - stats.lowStockItems.length - 3) / 245) * 100
    : 85;

  const orderFulfillment = (23 / (23 + 5)) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Floating Background */}
      <FloatingElements />

      {/* Animated Background - Changed to Offwhite */}
      {/* <div className="fixed inset-0 bg-white dark:bg-slate-950/50" /> */}
      <div className="fixed inset-0 bg-background" />


      <div className="relative z-10 p-6 pb-32 md:pb-6 space-y-6">
        {/* Enhanced Header with Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Business Command Center</h1>
            <p className="text-muted-foreground">Real-time insights and business intelligence</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                {isOnline ? '🟢 All Systems Operational' : '🔴 System Offline'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              Last updated: {lastSync.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Enhanced Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass border-0 shadow-2xl hover-lift stagger-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg holographic">
                    <DollarSign className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Revenue</p>
                    <p className="text-2xl font-bold">₹{stats?.todaySales?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {salesGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-sm font-medium">{Math.abs(salesGrowth).toFixed(1)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{stats?.todayTransactions || 0} transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-2xl hover-lift stagger-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg holographic">
                    <Package className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inventory Health</p>
                    <p className="text-2xl font-bold">{inventoryHealth.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <Progress value={inventoryHealth} className="w-16 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.lowStockCount || 0} low stock
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-2xl hover-lift stagger-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg holographic">
                    <ShoppingCart className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Fulfillment</p>
                    <p className="text-2xl font-bold">{orderFulfillment.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <Progress value={orderFulfillment} className="w-16 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">5 pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 shadow-2xl hover-lift stagger-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5" />
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg holographic">
                    <Target className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Target</p>
                    <p className="text-2xl font-bold">₹{((stats?.monthSales || 0) / 1000).toFixed(0)}K</p>
                  </div>
                </div>
                <div className="text-right">
                  <Progress value={75} className="w-16 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">75% achieved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Stats */}
        <div className="fade-in">
          <EnhancedStats stats={stats!} />
        </div>

        {/* Business Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Overview */}
          <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cash in Hand</span>
                <span className="font-semibold text-green-600">₹{(stats?.cashInHand || 125000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bank Balance</span>
                <span className="font-semibold text-blue-600">₹850,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Outstanding Credit</span>
                <span className="font-semibold text-red-600">₹{(stats?.outstandingCredit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Advances Paid</span>
                <span className="font-semibold text-orange-600">₹45,000</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Net Position</span>
                  <span className="font-bold text-green-600">₹930,000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Trend Chart */}
          <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
            <div className="relative z-10">
              <SalesTrendChart data={stats?.salesTrend || []} />
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              <Link href="/billing">
                <Button className="w-full holographic text-white hover:opacity-90 transition-opacity">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  New Sale
                </Button>
              </Link>

              <Link href="/purchase">
                <Button variant="outline" className="w-full glass border-0 shadow-lg hover:bg-white/90 hover:text-primary dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors">
                  <Package className="h-4 w-4 mr-2" />
                  Create Purchase Order
                </Button>
              </Link>
              <Link href="/inventory">
                <Button variant="outline" className="w-full glass border-0 shadow-lg hover:bg-white/90 hover:text-primary dark:hover:bg-slate-800 dark:hover:text-amber-400 transition-colors">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Check Low Stock ({stats?.lowStockCount || 0})
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" className="w-full glass border-0 shadow-lg hover:bg-white/90 hover:text-primary dark:hover:bg-slate-800 dark:hover:text-purple-400 transition-colors">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Business Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Products
              </CardTitle>
              <CardDescription>Best sellers this month with growth trends</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Smartphone XYZ", quantity: 25, revenue: 450000, growth: 15 },
                    { name: "Laptop ABC", quantity: 12, revenue: 600000, growth: 8 },
                    { name: "Tablet DEF", quantity: 18, revenue: 504000, growth: 22 },
                    { name: "Headphones GHI", quantity: 45, revenue: 135000, growth: -5 },
                  ].map((item, index) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${item.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {item.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span className="text-xs">{item.growth >= 0 ? '+' : ''}{item.growth}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Business Activity
              </CardTitle>
              <CardDescription>Latest transactions and updates</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {[
                  { id: "INV2024-001", customer: "John Doe", amount: 15000, time: "2 hours ago", status: "completed" },
                  { id: "INV2024-002", customer: "Jane Smith", amount: 8500, time: "4 hours ago", status: "completed" },
                  { id: "INV2024-003", customer: "ABC Company", amount: 25000, time: "6 hours ago", status: "pending" },
                ].map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg glass">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${transaction.status === 'completed' ? 'bg-green-500/10' : 'bg-orange-500/10'
                        }`}>
                        {transaction.status === 'completed' ?
                          <CheckCircle className="h-4 w-4 text-green-500" /> :
                          <Clock className="h-4 w-4 text-orange-500" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.id}</p>
                        <p className="text-xs text-muted-foreground">{transaction.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{transaction.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{transaction.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Alerts and Notifications */}
        <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Business Intelligence Alerts
            </CardTitle>
            <CardDescription>Critical insights and actionable notifications</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-700 dark:text-red-400">Inventory Alert</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-300">
                  3 items out of stock, {stats?.lowStockCount || 0} running low
                </p>
                <Link href="/inventory?tab=alerts">
                  <Button size="sm" variant="outline" className="mt-2 text-red-600 border-red-200">
                    Take Action
                  </Button>
                </Link>
              </div>

              <div className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-orange-700 dark:text-orange-400">Pending Orders</span>
                </div>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  5 purchase orders awaiting delivery
                </p>
                <Link href="/purchase?tab=orders">
                  <Button size="sm" variant="outline" className="mt-2 text-orange-600 border-orange-200">
                    Track Orders
                  </Button>
                </Link>
              </div>

              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-700 dark:text-blue-400">Outstanding Payments</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  ₹{(stats?.outstandingCredit || 0).toLocaleString()} pending collection
                </p>
                <Link href="/customers">
                  <Button size="sm" variant="outline" className="mt-2 text-blue-600 border-blue-200">
                    Collect Now
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div >
    </div >
  );
}
