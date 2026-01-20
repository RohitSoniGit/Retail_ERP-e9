"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatShortCurrency, type DashboardStats } from "@/lib/types";
import { TrendingUp, TrendingDown, Package, CreditCard, Banknote, ShoppingCart } from "lucide-react";

interface EnhancedStatsProps {
  stats: DashboardStats;
}

export function EnhancedStats({ stats }: EnhancedStatsProps) {
  const salesChange = stats.yesterdaySales > 0 
    ? ((stats.todaySales - stats.yesterdaySales) / stats.yesterdaySales) * 100
    : 0;
  const isPositive = salesChange >= 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {/* Today's Sales */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-emerald-100 p-2">
              <Banknote className="h-4 w-4 text-emerald-600" />
            </div>
            {salesChange !== 0 && (
              <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(salesChange).toFixed(0)}%</span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Today&apos;s Sales</p>
            <p className="text-xl font-bold text-emerald-700">{formatShortCurrency(stats.todaySales)}</p>
            <p className="text-xs text-muted-foreground">{stats.todayTransactions} bills</p>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock */}
      <Card className={`${stats.lowStockCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-muted/30'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className={`rounded-full p-2 ${stats.lowStockCount > 0 ? 'bg-amber-100' : 'bg-muted'}`}>
              <Package className={`h-4 w-4 ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Low Stock</p>
            <p className={`text-xl font-bold ${stats.lowStockCount > 0 ? 'text-amber-700' : 'text-foreground'}`}>
              {stats.lowStockCount}
            </p>
            <p className="text-xs text-muted-foreground">items below 10</p>
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Credit */}
      <Card className={`${stats.outstandingCredit > 0 ? 'bg-red-50 border-red-200' : 'bg-muted/30'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className={`rounded-full p-2 ${stats.outstandingCredit > 0 ? 'bg-red-100' : 'bg-muted'}`}>
              <CreditCard className={`h-4 w-4 ${stats.outstandingCredit > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Udhari (Credit)</p>
            <p className={`text-xl font-bold ${stats.outstandingCredit > 0 ? 'text-red-700' : 'text-foreground'}`}>
              {formatShortCurrency(stats.outstandingCredit)}
            </p>
            <p className="text-xs text-muted-foreground">outstanding</p>
          </div>
        </CardContent>
      </Card>

      {/* This Month */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-blue-100 p-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-xl font-bold text-blue-700">{formatShortCurrency(stats.monthSales)}</p>
            <p className="text-xs text-muted-foreground">total sales</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
