"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatShortCurrency, type DashboardStats } from "@/lib/types";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertTriangle, Users } from "lucide-react";

interface EnhancedStatsProps {
  stats: DashboardStats;
}

export function EnhancedStats({ stats }: EnhancedStatsProps) {
  const salesChange = stats.yesterdaySales > 0 
    ? ((stats.todaySales - stats.yesterdaySales) / stats.yesterdaySales) * 100 
    : 0;

  const statsCards = [
    {
      title: "Today's Sales",
      value: formatShortCurrency(stats.todaySales),
      subtitle: `${stats.todayTransactions} transactions`,
      icon: DollarSign,
      trend: salesChange,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "This Month",
      value: formatShortCurrency(stats.monthSales),
      subtitle: "Total revenue",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Low Stock",
      value: stats.lowStockCount.toString(),
      subtitle: "Items need restock",
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? "text-amber-600" : "text-emerald-600",
      bgColor: stats.lowStockCount > 0 ? "bg-amber-50" : "bg-emerald-50",
    },
    {
      title: "Outstanding",
      value: formatShortCurrency(stats.outstandingCredit),
      subtitle: "Credit amount",
      icon: Users,
      color: stats.outstandingCredit > 0 ? "text-red-600" : "text-emerald-600",
      bgColor: stats.outstandingCredit > 0 ? "bg-red-50" : "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {statsCards.map((stat, index) => (
        <Card key={index} className={`${stat.bgColor} border-transparent`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              {stat.trend !== undefined && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    stat.trend >= 0 
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {stat.trend >= 0 ? "+" : ""}{stat.trend.toFixed(0)}%
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}