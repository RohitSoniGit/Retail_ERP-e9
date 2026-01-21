"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, type AdvancePayment } from "@/lib/types";
import { Search, Plus, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { CreateAdvancePaymentDialog } from "./create-advance-payment-dialog";

export function AdvancePaymentsList() {
  const { organizationId } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [paymentType, setPaymentType] = useState<"supplier_advance" | "customer_advance">("supplier_advance");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: advances, isLoading, mutate } = useSWR(
    organizationId ? `advance-payments-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("advance_payments")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdvancePayment[];
    }
  );

  const filteredAdvances = advances?.filter(
    (advance) =>
      advance.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advance.party_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const supplierAdvances = advances?.filter(a => a.payment_type === "supplier_advance") || [];
  const customerAdvances = advances?.filter(a => a.payment_type === "customer_advance") || [];
  
  const totalSupplierAdvances = supplierAdvances.reduce((sum, a) => sum + a.balance_amount, 0);
  const totalCustomerAdvances = customerAdvances.reduce((sum, a) => sum + a.balance_amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "utilized":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "refunded":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "adjusted":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "supplier_advance":
        return "bg-red-100 text-red-700 border-red-200";
      case "customer_advance":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "employee_advance":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const openCreateDialog = (type: "supplier_advance" | "customer_advance") => {
    setPaymentType(type);
    setShowCreateDialog(true);
  };

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="bg-red-50 border-red-200 cursor-pointer hover:bg-red-100 transition-colors" 
          onClick={() => openCreateDialog("supplier_advance")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Supplier Advances</span>
            </div>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totalSupplierAdvances)}</p>
            <p className="text-xs text-red-600 mt-1">Tap to add advance</p>
          </CardContent>
        </Card>
        
        <Card 
          className="bg-emerald-50 border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors" 
          onClick={() => openCreateDialog("customer_advance")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">Customer Advances</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalCustomerAdvances)}</p>
            <p className="text-xs text-emerald-600 mt-1">Tap to add advance</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search advance payments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Payment Details</TableHead>
                <TableHead>Party</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvances?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No advance payments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdvances?.map((advance) => (
                  <TableRow key={advance.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getTypeColor(advance.payment_type)}`}>
                            {advance.payment_type.replace("_", " ").toUpperCase()}
                          </Badge>
                          <span className="font-medium text-sm">{advance.payment_number}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(advance.payment_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </p>
                        {advance.purpose && (
                          <p className="text-xs text-blue-600">{advance.purpose}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{advance.party_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {advance.party_type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className="font-medium">{formatCurrency(advance.advance_amount)}</p>
                        {advance.utilized_amount > 0 && (
                          <p className="text-xs text-blue-600">
                            Used: {formatCurrency(advance.utilized_amount)}
                          </p>
                        )}
                        {advance.balance_amount > 0 && (
                          <p className="text-xs text-green-600">
                            Balance: {formatCurrency(advance.balance_amount)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(advance.status)}`}>
                        {advance.status.charAt(0).toUpperCase() + advance.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Advance Payment Dialog */}
      <CreateAdvancePaymentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        paymentType={paymentType}
        onSuccess={() => {
          mutate();
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
}