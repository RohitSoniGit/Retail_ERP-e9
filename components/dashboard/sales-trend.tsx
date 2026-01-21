"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, type SalesTrend } from "@/lib/types";
import { TrendingUp } from "lucide-react";

interface SalesTrendChartProps {
  data: SalesTrend[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const maxValue = Math.max(...data.map(d => d.total));
  const totalSales = data.reduce((sum, d) => sum + d.total, 0);
  const avgDaily = totalSales / data.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          7-Day Sales Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-end justify-between h-24 gap-1">
          {data.map((day, index) => {
            const height = maxValue > 0 ? (day.total / maxValue) * 100 : 0;
            const isToday = index === data.length - 1;
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
                  <div
                    className={`w-full rounded-t transition-all ${
                      isToday 
                        ? "bg-emerald-500" 
                        : day.total > avgDaily 
                          ? "bg-emerald-400" 
                          : "bg-muted"
                    }`}
                    style={{ height: `${height}%`, minHeight: day.total > 0 ? '4px' : '0px' }}
                    title={`${new Date(day.date).toLocaleDateString('en-IN', { 
                      weekday: 'short', 
                      day: '2-digit' 
                    })}: ${formatCurrency(day.total)} (${day.count} sales)`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-3 pt-3 border-t text-center">
          <p className="text-sm text-muted-foreground">
            7-day total: <span className="font-medium text-foreground">{formatCurrency(totalSales)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}