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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Package } from "lucide-react"
import { QuickAddStockDialog } from "./quick-add-stock-dialog"
import type { Item } from "@/lib/types"

interface ItemsTableProps {
  items: Item[]
  onStockUpdate: () => void
}

export function ItemsTable({ items, onStockUpdate }: ItemsTableProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    })

  return (
    <>
      <div className="rounded-xl border-0 overflow-hidden glass shadow-xl">
        <Table>
          <TableHeader className="bg-white/10 backdrop-blur-md">
            <TableRow className="border-b border-white/10 hover:bg-transparent">
              <TableHead className="w-[100px] font-bold text-foreground">SKU</TableHead>
              <TableHead className="font-bold text-foreground">Item Name</TableHead>
              <TableHead className="text-right hidden sm:table-cell font-bold text-foreground">Wholesale</TableHead>
              <TableHead className="text-right font-bold text-foreground">Retail</TableHead>
              <TableHead className="text-right font-bold text-foreground">Stock</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-muted/20">
                      <Package className="h-8 w-8 opacity-50" />
                    </div>
                    <p>No items found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold opacity-70">{item.sku}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-base">{item.name}</div>
                    {item.pieces_per_unit > 1 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        1 {item.unit_type} = {item.pieces_per_unit} pcs
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell font-medium opacity-80">
                    {formatCurrency(item.wholesale_price)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(item.retail_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`
                        border-0 px-2.5 py-0.5 shadow-sm
                        ${item.current_stock <= 5
                          ? "bg-red-500/20 text-red-600 dark:text-red-300"
                          : item.current_stock <= 10
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"}
                      `}
                    >
                      {item.current_stock} {item.unit_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:bg-indigo-500/20 hover:text-indigo-600 rounded-full h-8 w-8 p-0"
                      onClick={() => {
                        setSelectedItem(item)
                        setDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <QuickAddStockDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false)
          onStockUpdate()
        }}
      />
    </>
  )
}
