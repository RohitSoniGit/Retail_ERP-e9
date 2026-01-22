"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const ACCOUNT_TYPES = [
    { value: "asset", label: "Asset" },
    { value: "liability", label: "Liability" },
    { value: "equity", label: "Equity" },
    { value: "income", label: "Income" },
    { value: "expense", label: "Expense" },
];

const ACCOUNT_GROUPS = {
    asset: ["Current Assets", "Fixed Assets", "Investments", "Bank Accounts", "Cash-in-hand"],
    liability: ["Current Liabilities", "Loans", "Duties & Taxes"],
    equity: ["Capital Account", "Reserves & Surplus"],
    income: ["Sales", "Direct Income", "Indirect Income"],
    expense: ["Purchases", "Direct Expenses", "Indirect Expenses"],
};

export function AddAccountDialog({ open, onOpenChange, onSuccess }: AddAccountDialogProps) {
    const { organizationId } = useOrganization();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        account_name: "",
        account_code: "",
        account_type: "asset",
        account_group: "Current Assets",
        opening_balance: "0",
        description: "",
    });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organizationId || !formData.account_name.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("ledger_accounts").insert({
                organization_id: organizationId,
                account_name: formData.account_name.trim(),
                account_code: formData.account_code || `ACC-${Date.now().toString().slice(-6)}`,
                account_type: formData.account_type,
                account_group: formData.account_group,
                opening_balance: parseFloat(formData.opening_balance) || 0,
                current_balance: parseFloat(formData.opening_balance) || 0,
                is_active: true,
                is_system_account: false,
            });

            if (error) throw error;

            setFormData({
                account_name: "",
                account_code: "",
                account_type: "asset",
                account_group: "Current Assets",
                opening_balance: "0",
                description: "",
            });
            toast.success("Account created successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error adding account:", error);
            toast.error("Failed to create account");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md glass border-0 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl gradient-text">Add New Ledger Account</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="account_name" className="text-sm font-semibold">Account Name *</Label>
                        <Input
                            id="account_name"
                            value={formData.account_name}
                            onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                            placeholder="e.g. HDFC Bank"
                            required
                            className="glass border-0 shadow-inner h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_code" className="text-sm font-semibold">Account Code (Optional)</Label>
                        <Input
                            id="account_code"
                            value={formData.account_code}
                            onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                            placeholder="Auto-generated if empty"
                            className="glass border-0 shadow-inner h-11"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="account_type" className="text-sm font-semibold">Type</Label>
                            <Select
                                value={formData.account_type}
                                onValueChange={(value) => {
                                    setFormData({
                                        ...formData,
                                        account_type: value,
                                        account_group: ACCOUNT_GROUPS[value as keyof typeof ACCOUNT_GROUPS][0]
                                    });
                                }}
                            >
                                <SelectTrigger className="glass border-0 h-11 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-0">
                                    {ACCOUNT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account_group" className="text-sm font-semibold">Group</Label>
                            <Select
                                value={formData.account_group}
                                onValueChange={(value) => setFormData({ ...formData, account_group: value })}
                            >
                                <SelectTrigger className="glass border-0 h-11 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-0">
                                    {ACCOUNT_GROUPS[formData.account_type as keyof typeof ACCOUNT_GROUPS].map((group) => (
                                        <SelectItem key={group} value={group}>
                                            {group}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="opening_balance" className="text-sm font-semibold">Opening Balance</Label>
                        <Input
                            id="opening_balance"
                            type="number"
                            value={formData.opening_balance}
                            onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                            placeholder="0.00"
                            className="glass border-0 shadow-inner h-11"
                        />
                        <p className="text-xs text-muted-foreground">Negative value for Credit balance</p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 hover:bg-white/10"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 holographic text-white shadow-lg border-0" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Account
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
