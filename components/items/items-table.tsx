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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Wholesale</TableHead>
              <TableHead className="text-right">Retail</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    {item.pieces_per_unit > 1 && (
                      <div className="text-xs text-muted-foreground">
                        1 {item.unit_type} = {item.pieces_per_unit} pcs
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {formatCurrency(item.wholesale_price)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.retail_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        item.current_stock <= 5
                          ? "destructive"
                          : item.current_stock <= 10
                            ? "secondary"
                            : "default"
                      }
                      className={
                        item.current_stock > 10
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : ""
                      }
                    >
                      {item.current_stock} {item.unit_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
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
