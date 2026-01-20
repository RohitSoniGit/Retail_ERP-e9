"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortCurrency, type SalesTrend } from "@/lib/types";

interface SalesTrendChartProps {
  data: SalesTrend[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">7-Day Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.total), 1);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">7-Day Sales Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-24">
          {data.map((day, index) => {
            const height = (day.total / maxValue) * 100;
            const isToday = index === data.length - 1;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={`w-full rounded-t transition-all ${isToday ? 'bg-emerald-500' : 'bg-emerald-200'}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${day.date}: ${formatShortCurrency(day.total)}`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'narrow' })}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{data.length > 0 ? new Date(data[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
          <span>{data.length > 0 ? new Date(data[data.length - 1].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
        </div>
      </CardContent>
    </Card>
  );
}
