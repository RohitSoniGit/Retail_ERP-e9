"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Mail, Shield, UserPlus, MoreVertical, Search, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    created_at: string;
}

export function UserManagement() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "staff",
    });

    const supabase = getSupabaseBrowserClient();

    // Fetch users (profiles + roles)
    const fetchUsers = async () => {
        try {
            setLoading(true);

            // Fetch profiles
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*');

            if (profileError) throw profileError;

            // Fetch roles
            const { data: roles, error: roleError } = await supabase
                .from('user_roles')
                .select('*');

            if (roleError) console.warn('Could not fetch roles:', roleError);

            // Merge data
            const combinedUsers = (profiles as any[])?.map((profile: any) => {
                const userRole = (roles as any[])?.find((r: any) => r.user_id === profile.id);
                return {
                    ...profile,
                    role: userRole?.role || 'user'
                };
            }) || [];

            setUsers(combinedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            // Fallback for demo if table doesn't exist yet
            // toast.error("Failed to load users"); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            toast.success("User created successfully!");
            setIsCreating(false);
            setFormData({ name: "", email: "", password: "", role: "staff" });
            fetchUsers(); // Refresh list
        } catch (error: any) {
            console.error('Error creating user:', error);
            toast.error(error.message || "Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass border-0 shadow-lg hover-lift">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Users</p>
                            <p className="text-2xl font-bold">{users.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass border-0 shadow-lg hover-lift">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-green-100 dark:bg-green-900/20 text-green-600">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Active Admins</p>
                            <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass border-0 shadow-2xl hover-lift relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-cyan-500/5" />
                <CardHeader className="pb-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl holographic">
                                <Users className="h-6 w-6 text-white drop-shadow-lg" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-2xl gradient-text">User Management</CardTitle>
                                <CardDescription className="text-base">
                                    Manage system users, roles, and access controls
                                </CardDescription>
                            </div>
                        </div>
                        <Dialog open={isCreating} onOpenChange={setIsCreating}>
                            <DialogTrigger asChild>
                                <Button className="holographic text-white shadow-lg border-0">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md glass border-0 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create New User</DialogTitle>
                                    <DialogDescription>
                                        Add a new user to the system. They will receive access immediately.
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="glass border-0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            className="glass border-0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            minLength={6}
                                            className="glass border-0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                                        >
                                            <SelectTrigger className="glass border-0">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="staff">Staff</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={loading} className="holographic border-0 text-white">
                                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            Create User
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 glass border-0 shadow-sm"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground rounded-xl glass border-0">
                            <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-medium">No users found</p>
                            <p className="text-sm">Get started by creating your first user account.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl overflow-hidden glass border-0 shadow-sm">
                            <Table>
                                <TableHeader className="bg-white/5 backdrop-blur-md">
                                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                                        <TableHead className="font-bold text-foreground pl-6">User Profile</TableHead>
                                        <TableHead className="font-bold text-foreground">Role</TableHead>
                                        <TableHead className="font-bold text-foreground">Joined Date</TableHead>
                                        <TableHead className="text-right font-bold text-foreground pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white/10">
                                                        {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{user.full_name || "Unknown User"}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`capitalize px-3 py-1 border-0 shadow-sm glass ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500' :
                                                        user.role === 'manager' ? 'bg-blue-500/10 text-blue-500' :
                                                            'bg-slate-500/10 text-slate-500'
                                                        }`}
                                                >
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm font-mono">
                                                {new Date(user.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="glass border-0 shadow-xl">
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <Mail className="h-4 w-4 mr-2" />
                                                            Send Email
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500">
                                                            <Lock className="h-4 w-4 mr-2" />
                                                            Reset Password
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
