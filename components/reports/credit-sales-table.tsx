"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Sale } from "@/lib/types"

interface CreditSalesTableProps {
  sales: Sale[]
  onUpdate: () => void
}

export function CreditSalesTable({ sales, onUpdate }: CreditSalesTableProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const markAsPaid = async (saleId: string) => {
    setLoading(saleId)
    const supabase = getSupabaseBrowserClient()

    await supabase.from("sales").update({ is_paid: true }).eq("id", saleId)

    setLoading(null)
    onUpdate()
  }

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    })

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    })

  const totalOutstanding = sales.reduce((sum, sale) => sum + sale.total_amount, 0)

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Outstanding Udhari</CardTitle>
          <Badge variant="destructive">{formatCurrency(totalOutstanding)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No outstanding credit
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="font-medium">{sale.customer_name || "Walk-in"}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {formatDate(sale.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(sale.created_at)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => markAsPaid(sale.id)}
                        disabled={loading === sale.id}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
