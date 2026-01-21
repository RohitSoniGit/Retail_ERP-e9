"use client";

import { useState } from "react";
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
import { Users, Plus, Mail, Shield, UserPlus, MoreVertical, Search, Lock } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock Data
const MOCK_USERS = [
    { id: "1", name: "Admin User", email: "admin@example.com", role: "admin", status: "active", lastActive: "2 mins ago" },
    { id: "2", name: "Staff Member", email: "staff@example.com", role: "staff", status: "active", lastActive: "1 hour ago" },
    { id: "3", name: "Accountant", email: "accounts@example.com", role: "accountant", status: "inactive", lastActive: "2 days ago" },
];

export default function UsersPage() {
    const [users, setUsers] = useState(MOCK_USERS);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "staff",
    });

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.email || !formData.password || !formData.name) {
            toast.error("Please fill in all fields");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        // In a real app, this would call an API
        const newUser = {
            id: Date.now().toString(),
            name: formData.name,
            email: formData.email,
            role: formData.role,
            status: "active",
            lastActive: "Just now",
        };

        setUsers([...users, newUser]);
        setIsCreating(false);
        setFormData({ name: "", email: "", password: "", role: "staff" });
        toast.success("User created successfully");
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Basic RBAC Simulation
    const [isAdmin, setIsAdmin] = useState(true); // Default true for demo, in real app set false and check

    // Check role effect (commented out for demo, but structure is here)
    /* useEffect(() => {
        const checkRole = async () => {
             const supabase = getSupabaseBrowserClient();
             const { data: { user } } = await supabase.auth.getUser();
             // Check metadata or user_roles table
             // setIsAdmin(user?.user_metadata?.role === 'admin');
        }
        checkRole();
    }, []); */

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#f8f9fa] dark:bg-slate-950">
                <div className="text-center space-y-4">
                    <Shield className="h-12 w-12 text-red-500 mx-auto" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground">You need administrator privileges to view this page.</p>
                </div>
            </div>
        )
    }

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
                                <DialogDescription>Add a new user to the organization</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="staff">Staff</SelectItem>
                                            <SelectItem value="accountant">Accountant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Initial Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">Create Account</Button>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`flex items-center gap-2 ${user.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                                                <div className={`h-2 w-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                <span className="capitalize text-sm">{user.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{user.lastActive}</TableCell>
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
                                                        Reset Password
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Shield className="h-4 w-4 mr-2" />
                                                        Change Role
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600">
                                                        Block Access
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
