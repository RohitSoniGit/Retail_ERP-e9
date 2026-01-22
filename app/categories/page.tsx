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
            // First check if error is just an empty object
            if (Object.keys(error).length === 0) {
                // Silently ignore empty error objects
                return
            }

            // Check if it's likely a missing table error
            if (error.code === '42P01') { // undefined_table
                toast.error("Setup Required", {
                    description: "Categories table missing. Please look for migration scripts."
                })
                return
            }

            // Only log if error has meaningful content
            const hasMessage = error.message && String(error.message).trim() !== '';
            const hasCode = error.code && String(error.code).trim() !== '' && error.code !== '42P01';
            const hasPlugin = error.plugin && String(error.plugin).trim() !== '';
            const hasDetails = error.details && String(error.details).trim() !== '';

            if (hasMessage || hasCode || hasPlugin || hasDetails) {
                console.error("Error loading categories:", error)
                toast.error("Failed to load categories", {
                    description: error.message || "An unexpected error occurred"
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
        return (
            <div className="flex items-center justify-center min-h-screen text-indigo-500">
                Loading...
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6 min-h-screen">
            {/* Background - matching other pages if global isn't covering it, but assuming app shell does.  */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Category Management</h1>
                    <p className="text-muted-foreground mt-1">Organize your inventory with categories</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)} className="holographic text-white shadow-lg border-0">
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
                    className="pl-10 h-10 glass border-0 shadow-sm"
                />
            </div>

            <div className="rounded-xl border-0 overflow-hidden glass shadow-xl">
                <Table>
                    <TableHeader className="bg-white/10 backdrop-blur-md">
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                            <TableHead className="font-bold text-foreground pl-6">Name</TableHead>
                            <TableHead className="font-bold text-foreground">Description</TableHead>
                            <TableHead className="w-[100px] text-right font-bold text-foreground pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 rounded-full bg-muted/20">
                                            <Search className="h-8 w-8 opacity-50" />
                                        </div>
                                        <p>No categories found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((category) => (
                                <TableRow key={category.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="font-medium pl-6 text-base">{category.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{category.description || "-"}</TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(category.id)}
                                            className="hover:bg-red-500/10 hover:text-red-600 rounded-full h-8 w-8"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="glass border-0 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl gradient-text">Add New Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCategory} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-semibold">Category Name</Label>
                            <Input
                                id="name"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                required
                                placeholder="e.g., Electronics"
                                className="glass border-0 shadow-inner h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc" className="text-sm font-semibold">Description</Label>
                            <Input
                                id="desc"
                                value={newCategory.description}
                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                placeholder="Optional details"
                                className="glass border-0 shadow-inner h-11"
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="ghost" onClick={() => setAddDialogOpen(false)} className="hover:bg-white/10">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="holographic text-white shadow-lg border-0">
                                {isSubmitting ? "Adding..." : "Add Category"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
