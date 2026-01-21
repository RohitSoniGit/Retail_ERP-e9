"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Calendar, User } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useOrganization } from "@/lib/context/organization"
import type { JobCard } from "@/lib/types"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"

export default function JobsPage() {
    const { organization, loading: orgLoading } = useOrganization()
    const [jobs, setJobs] = useState<JobCard[]>([])
    const [filteredJobs, setFilteredJobs] = useState<JobCard[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const loadJobs = useCallback(async () => {
        if (!organization) return

        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
            .from("job_cards")
            .select("*")
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false })

        if (error) {
            if (Object.keys(error).length > 0) {
                console.error("Error loading jobs:", error)
            }
            return
        }

        setJobs(data || [])
        setFilteredJobs(data || [])
        setLoading(false)
    }, [organization])

    useEffect(() => {
        if (organization) {
            loadJobs()
        }
    }, [organization, loadJobs])

    useEffect(() => {
        if (searchQuery) {
            const filtered = jobs.filter((job) =>
                job.job_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (job.customer_name && job.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            setFilteredJobs(filtered)
        } else {
            setFilteredJobs(jobs)
        }
    }, [searchQuery, jobs])

    const handleCreateJob = async () => {
        // Create a draft job and redirect to it
        if (!organization) return;
        const supabase = getSupabaseBrowserClient()

        // Generate temp job number
        const jobNumber = `JOB-${Date.now().toString().slice(-6)}`;

        const { data, error } = await supabase.from("job_cards").insert({
            organization_id: organization.id,
            job_number: jobNumber,
            status: "pending",
            date_in: new Date().toISOString()
        }).select().single();

        if (data) {
            router.push(`/jobs/${data.id}`);
        } else {
            console.error(error);
            toast.error("Failed to create job card", {
                description: error?.message || "Please check if job_cards table exists."
            });
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'delivered': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100';
        }
    }

    if (orgLoading || loading) {
        return <div className="p-8">Loading...</div>
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Job Work</h1>
                <Button onClick={handleCreateJob}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Job Card
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by Job # or Customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job Number</TableHead>
                            <TableHead>Date In</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredJobs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No jobs found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredJobs.map((job) => (
                                <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/jobs/${job.id}`)}>
                                    <TableCell className="font-medium">{job.job_number}</TableCell>
                                    <TableCell>{format(new Date(job.date_in), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="h-3 w-3 text-muted-foreground" />
                                            {job.customer_name || 'Walk-in'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusColor(job.status)}>
                                            {job.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>₹{job.final_cost || job.estimated_cost || 0}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">View</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
