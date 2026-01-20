"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Sale } from "@/lib/types"

interface RecentSalesProps {
  sales: Sale[]
}

export function RecentSales({ sales }: RecentSalesProps) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sales today
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-mono text-xs">
                {sale.invoice_number}
              </TableCell>
              <TableCell>{sale.customer_name || "Walk-in"}</TableCell>
              <TableCell className="text-right font-medium">
                {sale.total_amount.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
              </TableCell>
              <TableCell className="text-right">
                {sale.is_credit ? (
                  <Badge variant={sale.is_paid ? "secondary" : "destructive"}>
                    {sale.is_paid ? "Paid" : "Udhari"}
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-emerald-600">Cash</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
