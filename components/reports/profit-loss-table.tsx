"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ProfitLossEntry } from "@/lib/types"

interface ProfitLossTableProps {
  entries: ProfitLossEntry[]
  dateRange: string
}

export function ProfitLossTable({ entries, dateRange }: ProfitLossTableProps) {
  const totals = entries.reduce(
    (acc, entry) => ({
      quantity: acc.quantity + entry.quantity_sold,
      revenue: acc.revenue + entry.revenue,
      cost: acc.cost + entry.cost,
      profit: acc.profit + entry.profit,
    }),
    { quantity: 0, revenue: 0, cost: 0, profit: 0 }
  )

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    })

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Profit & Loss</CardTitle>
          <Badge variant="secondary">{dateRange}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sales data for this period
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Revenue</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{entry.item_name}</TableCell>
                    <TableCell className="text-right">{entry.quantity_sold}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatCurrency(entry.revenue)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatCurrency(entry.cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          entry.profit >= 0 ? "text-emerald-600" : "text-destructive"
                        }
                      >
                        {formatCurrency(entry.profit)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">{totals.quantity}</TableCell>
                  <TableCell className="text-right font-bold hidden sm:table-cell">
                    {formatCurrency(totals.revenue)}
                  </TableCell>
                  <TableCell className="text-right font-bold hidden sm:table-cell">
                    {formatCurrency(totals.cost)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <span
                      className={
                        totals.profit >= 0 ? "text-emerald-600" : "text-destructive"
                      }
                    >
                      {formatCurrency(totals.profit)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
