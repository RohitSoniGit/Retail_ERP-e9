"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, AlertTriangle, CreditCard } from "lucide-react"

interface StatsCardsProps {
  todaySales: number
  lowStockCount: number
  outstandingCredit: number
}

export function StatsCards({ todaySales, lowStockCount, outstandingCredit }: StatsCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today's Sales
          </CardTitle>
          <IndianRupee className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {todaySales.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Low Stock Alerts
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {lowStockCount} items
          </div>
          <p className="text-xs text-muted-foreground mt-1">Below 10 units</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-rose-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Outstanding Udhari
          </CardTitle>
          <CreditCard className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {outstandingCredit.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Credit pending</p>
        </CardContent>
      </Card>
    </div>
  )
}
