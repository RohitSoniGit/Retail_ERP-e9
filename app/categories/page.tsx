"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useOrganization } from "@/lib/context/organization"
import type { Category } from "@/lib/types"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

export default function CategoriesPage() {
    const { organization, loading: orgLoading } = useOrganization()
    const [categories, setCategories] = useState<Category[]>([])
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [newCategory, setNewCategory] = useState({ name: "", description: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const loadCategories = useCallback(async () => {
        if (!organization) return

        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("organization_id", organization.id)
            .order("name", { ascending: true })

        if (error) {
            console.error("Error loading categories:", error)
            // Check if it's likely a missing table error
            if (error.code === '42P01') { // undefined_table
                toast.error("Setup Required", {
                    description: "Please run the migration script scripts/006-erp-enhancements.sql to create the categories table."
                })
            }
            return
        }

        setCategories(data || [])
        setFilteredCategories(data || [])
        setLoading(false)
    }, [organization])

    useEffect(() => {
        if (organization) {
            loadCategories()
        }
    }, [organization, loadCategories])

    useEffect(() => {
        if (searchQuery) {
            const filtered = categories.filter((cat) =>
                cat.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setFilteredCategories(filtered)
        } else {
            setFilteredCategories(categories)
        }
    }, [searchQuery, categories])

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!organization) return
        setIsSubmitting(true)

        const supabase = getSupabaseBrowserClient()
        const { error } = await supabase.from("categories").insert({
            organization_id: organization.id,
            name: newCategory.name,
            description: newCategory.description,
        })

        if (error) {
            toast.error("Failed to add category")
        } else {
            toast.success("Category added")
            setAddDialogOpen(false)
            setNewCategory({ name: "", description: "" })
            loadCategories()
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        const supabase = getSupabaseBrowserClient()
        const { error } = await supabase.from("categories").delete().eq("id", id)
        if (error) {
            toast.error("Failed to delete")
        } else {
            toast.success("Category deleted")
            loadCategories()
        }
    }

    if (orgLoading || loading) {
        return <div className="p-8">Loading...</div>
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Category Management</h1>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    No categories found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell>{category.description}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input
                                id="name"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Description</Label>
                            <Input
                                id="desc"
                                value={newCategory.description}
                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Adding..." : "Add Category"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
