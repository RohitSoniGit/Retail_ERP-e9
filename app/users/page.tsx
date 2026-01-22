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

export default function UsersPage() {
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
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 bg-white dark:bg-slate-950/50" />

            <div className="relative z-10 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">User Management</h1>
                        <p className="text-muted-foreground">Manage system users and access controls</p>
                    </div>
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button className="holographic text-white">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription>
                                    Add a new user to the system. They will receive an email confirmation.
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
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                                    >
                                        <SelectTrigger>
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
                                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Create User
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Users Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="glass border-0 shadow-lg">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Users</p>
                                <p className="text-2xl font-bold">{users.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0 shadow-lg">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active Admins</p>
                                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Table */}
                <Card className="glass border-0 shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>System Users</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                No users found. Run the setup scripts to sync users.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                        {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{user.full_name || "User"}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Mail className="h-4 w-4 mr-2" />
                                                            Contact
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
