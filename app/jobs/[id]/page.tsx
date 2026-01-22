"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Plus, Trash2, Printer, CheckCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useOrganization } from "@/lib/context/organization"
import type { JobCard, JobCardItem } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"

export default function JobDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { organization } = useOrganization()
    const [job, setJob] = useState<JobCard | null>(null)
    const [items, setItems] = useState<JobCardItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // New Item State
    const [newItem, setNewItem] = useState({
        item_name: "",
        quantity: 1,
        type: "inward",
        cost: 0,
        notes: ""
    })

    // Edit Job State
    const [editMode, setEditMode] = useState(false)
    const [jobForm, setJobForm] = useState<{
        customer_name: string;
        status: "pending" | "in_progress" | "completed" | "delivered";
        notes: string;
        estimated_cost: number;
    }>({
        customer_name: "",
        status: "pending",
        notes: "",
        estimated_cost: 0
    })

    const loadJob = useCallback(async () => {
        if (!organization || !params.id) return

        const supabase = getSupabaseBrowserClient()

        // Fetch Job
        const { data: jobData, error: jobError } = await supabase
            .from("job_cards")
            .select("*")
            .eq("id", params.id)
            .single()

        if (jobError) {
            toast.error("Error loading job details")
            router.push("/jobs")
            return
        }

        setJob(jobData)
        setJobForm({
            customer_name: jobData.customer_name || "",
            status: jobData.status,
            notes: jobData.notes || "",
            estimated_cost: jobData.estimated_cost || 0
        })

        // Fetch Items
        const { data: itemsData, error: itemsError } = await supabase
            .from("job_card_items")
            .select("*")
            .eq("job_card_id", params.id)
            .order("created_at", { ascending: true })

        if (itemsError) {
            toast.error("Error loading job items")
        } else {
            setItems(itemsData || [])
        }

        setLoading(false)
    }, [organization, params.id, router])

    useEffect(() => {
        loadJob()
    }, [loadJob])

    const handleUpdateJob = async () => {
        if (!organization || !job) return;
        setSaving(true);
        const supabase = getSupabaseBrowserClient();

        const { error } = await supabase.from("job_cards").update({
            customer_name: jobForm.customer_name,
            status: jobForm.status,
            notes: jobForm.notes,
            estimated_cost: jobForm.estimated_cost
        }).eq("id", job.id);

        if (error) {
            toast.error("Failed to update job");
        } else {
            toast.success("Job updated successfully");
            setJob({ ...job, ...jobForm });
            setEditMode(false);
        }
        setSaving(false);
    }

    const handleAddItem = async () => {
        if (!organization || !job) return;
        if (!newItem.item_name) {
            toast.error("Item name is required");
            return;
        }

        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.from("job_card_items").insert({
            job_card_id: job.id,
            item_name: newItem.item_name,
            quantity: newItem.quantity,
            type: newItem.type,
            cost: newItem.cost,
            notes: newItem.notes
        }).select().single();

        if (error) {
            toast.error("Failed to add item");
        } else {
            toast.success("Item added");
            setItems([...items, data]);
            setNewItem({
                item_name: "",
                quantity: 1,
                type: "inward",
                cost: 0,
                notes: ""
            });

            // If it's a service item with cost, verify if we should update final cost
            if (newItem.type === 'service' && newItem.cost > 0) {
                const newCost = (job.final_cost || 0) + newItem.cost;
                await supabase.from("job_cards").update({ final_cost: newCost }).eq("id", job.id);
                setJob({ ...job, final_cost: newCost });
            }
        }
    }

    const handleDeleteItem = async (itemId: string, cost: number, type: string) => {
        if (!confirm("Remove this item?")) return;
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.from("job_card_items").delete().eq("id", itemId);

        if (error) {
            toast.error("Failed to delete item");
        } else {
            setItems(items.filter(i => i.id !== itemId));
            toast.success("Item removed");

            if (type === 'service' && cost > 0 && job) {
                const newCost = Math.max(0, (job.final_cost || 0) - cost);
                await supabase.from("job_cards").update({ final_cost: newCost }).eq("id", job.id);
                setJob({ ...job, final_cost: newCost });
            }
        }
    }

    const calculateTotalCost = () => {
        return items.reduce((sum, item) => sum + (item.type === 'service' ? item.cost : 0), 0);
    }

    if (loading || !job) return <div className="p-8">Loading...</div>

    return (
        <div className="p-6 space-y-6 w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/jobs")} className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
                        {job.job_number}
                        <Badge variant="outline" className={`glass border-0 shadow-sm ${job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                job.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
                                    job.status === 'delivered' ? 'bg-purple-500/10 text-purple-500' :
                                        'bg-yellow-500/10 text-yellow-500'
                            }`}>
                            {job.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Created on {format(new Date(job.created_at), "PPP p")}
                    </p>
                </div>
                <div className="ml-auto flex gap-3">
                    {!editMode ? (
                        <Button variant="outline" onClick={() => setEditMode(true)} className="glass border-0 shadow-sm hover:bg-white/10">Edit Details</Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
                            <Button onClick={handleUpdateJob} disabled={saving} className="holographic text-white shadow-lg border-0">Save Changes</Button>
                        </div>
                    )}
                    <Button variant="secondary" onClick={() => window.print()} className="glass border-0 shadow-sm hover:bg-white/10">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="glass border-0 shadow-xl overflow-hidden">
                        <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10">
                            <CardTitle className="gradient-text text-xl">Job Items & Services</CardTitle>
                            <CardDescription>Track materials given, received, and services performed.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            {/* Add Item Form */}
                            <div className="flex flex-wrap gap-4 items-end p-5 bg-white/5 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm">
                                <div className="space-y-2 flex-1 min-w-[200px]">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Item / Service Name</Label>
                                    <Input
                                        placeholder="e.g. Gold Ring, Polishing..."
                                        value={newItem.item_name}
                                        onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                                        className="glass border-0 shadow-inner h-10"
                                    />
                                </div>
                                <div className="space-y-2 w-[140px]">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Type</Label>
                                    <Select
                                        value={newItem.type}
                                        onValueChange={(val) => setNewItem({ ...newItem, type: val as any })}
                                    >
                                        <SelectTrigger className="glass border-0 shadow-sm h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="glass border-0 backdrop-blur-2xl">
                                            <SelectItem value="inward">Inward (Recvd)</SelectItem>
                                            <SelectItem value="outward">Outward (Given)</SelectItem>
                                            <SelectItem value="service">Service (Cost)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 w-[80px]">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Qty</Label>
                                    <Input
                                        type="number"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                                        className="glass border-0 shadow-inner h-10 text-center"
                                    />
                                </div>
                                <div className="space-y-2 w-[100px]">
                                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Cost (₹)</Label>
                                    <Input
                                        type="number"
                                        value={newItem.cost}
                                        disabled={newItem.type !== 'service'}
                                        onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) })}
                                        className="glass border-0 shadow-inner h-10 text-right"
                                    />
                                </div>
                                <Button type="button" onClick={handleAddItem} className="holographic text-white shadow-md border-0 h-10 w-10 p-0 rounded-lg">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Items Table */}
                            <div className="rounded-xl border border-white/10 overflow-hidden glass shadow-md">
                                <Table>
                                    <TableHeader className="bg-white/10">
                                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                                            <TableHead className="font-bold text-foreground">Type</TableHead>
                                            <TableHead className="font-bold text-foreground">Item</TableHead>
                                            <TableHead className="font-bold text-foreground text-center">Qty</TableHead>
                                            <TableHead className="text-right font-bold text-foreground">Cost</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No items recorded yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : items.map((item) => (
                                            <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <TableCell>
                                                    <Badge variant="outline" className={`border-0 shadow-sm ${item.type === 'inward' ? 'bg-blue-500/10 text-blue-500' :
                                                            item.type === 'outward' ? 'bg-orange-500/10 text-orange-500' :
                                                                'bg-emerald-500/10 text-emerald-500'
                                                        }`}>
                                                        {item.type.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {item.cost > 0 ? `₹${item.cost}` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id, item.cost, item.type)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {items.length > 0 && (
                                            <TableRow className="bg-white/5 font-bold border-t border-white/10">
                                                <TableCell colSpan={3} className="text-right pr-4">Total Service Cost:</TableCell>
                                                <TableCell className="text-right text-lg gradient-text">₹{calculateTotalCost()}</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="glass border-0 shadow-xl overflow-hidden">
                        <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10 pb-4">
                            <CardTitle className="text-lg font-bold">Job Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Customer Name</Label>
                                {editMode ? (
                                    <Input
                                        value={jobForm.customer_name}
                                        onChange={(e) => setJobForm({ ...jobForm, customer_name: e.target.value })}
                                        className="glass border-0 shadow-inner"
                                    />
                                ) : (
                                    <div className="font-medium text-lg">{job.customer_name || "Walk-in Customer"}</div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Status</Label>
                                {editMode ? (
                                    <Select
                                        value={jobForm.status}
                                        onValueChange={(val) => setJobForm({ ...jobForm, status: val as any })}
                                    >
                                        <SelectTrigger className="glass border-0 shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="glass border-0 backdrop-blur-2xl">
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="delivered">Delivered</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2.5 w-2.5 rounded-full ${job.status === 'completed' ? 'bg-emerald-500' :
                                                job.status === 'in_progress' ? 'bg-blue-500' :
                                                    job.status === 'delivered' ? 'bg-purple-500' :
                                                        'bg-yellow-500'
                                            }`} />
                                        <span className="font-medium capitalize">{job.status.replace('_', ' ')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Estimated Cost</Label>
                                {editMode ? (
                                    <Input
                                        type="number"
                                        value={jobForm.estimated_cost}
                                        onChange={(e) => setJobForm({ ...jobForm, estimated_cost: parseFloat(e.target.value) })}
                                        className="glass border-0 shadow-inner"
                                    />
                                ) : (
                                    <div className="font-medium font-mono">₹{job.estimated_cost}</div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Notes</Label>
                                {editMode ? (
                                    <Textarea
                                        value={jobForm.notes}
                                        onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })}
                                        className="glass border-0 shadow-inner min-h-[100px]"
                                    />
                                ) : (
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-white/5 p-3 rounded-lg border border-white/5">
                                        {job.notes || "No notes"}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg gradient-text">Final Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-muted-foreground">Items In</span>
                                <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-foreground">{items.filter(i => i.type === 'inward').length}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-muted-foreground">Items Out</span>
                                <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-foreground">{items.filter(i => i.type === 'outward').length}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold pt-4 border-t border-white/10 items-center">
                                <span>Total Cost</span>
                                <span className="gradient-text">₹{calculateTotalCost()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
