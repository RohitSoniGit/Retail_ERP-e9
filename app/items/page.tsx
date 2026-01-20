"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { ItemsTable } from "@/components/items/items-table"
import { AddItemDialog } from "@/components/items/add-item-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useOrganization } from "@/lib/context/organization"
import type { Item } from "@/lib/types"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

export default function ItemsPage() {
  const { organization, loading: orgLoading } = useOrganization()
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const searchParams = useSearchParams()

  const loadItems = useCallback(async () => {
    if (!organization) return

    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("organization_id", organization.id)
      .order("name", { ascending: true })

    setItems(data || [])
    setFilteredItems(data || [])
    setLoading(false)
  }, [organization])

  useEffect(() => {
    if (organization) {
      loadItems()
    }
  }, [organization, loadItems])

  useEffect(() => {
    if (searchQuery) {
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredItems(filtered)
    } else {
      setFilteredItems(items)
    }
  }, [searchQuery, items])

  if (orgLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Items</h1>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Suspense fallback={null}>
        <ItemsTable items={filteredItems} onStockUpdate={loadItems} />
      </Suspense>

      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          setAddDialogOpen(false)
          loadItems()
        }}
      />
    </div>
  )
}
