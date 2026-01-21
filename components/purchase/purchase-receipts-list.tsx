"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, type PurchaseReceipt } from "@/lib/types";
import { Search, Plus, Package, Loader2 } from "lucide-react";

export function PurchaseReceiptsList() {
  const { organizationId } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: receipts, isLoading } = useSWR(
    organizationId ? `purchase-receipts-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("purchase_receipts")
        .select(`
          *,
          suppliers (
            name,
            supplier_code
          )
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (PurchaseReceipt & { suppliers: { name: string; supplier_code: string } })[];
    }
  );

  const filteredReceipts = receipts?.filter(
    (receipt) =>
      receipt.grn_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.supplier_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "received":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "quality_check":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "accepted":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-700 border-red-200";
      case "partial":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "paid":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create GRN
        </Button>
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
                <TableHead>GRN Details</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No purchase receipts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceipts?.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{receipt.grn_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(receipt.receipt_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </p>
                        {receipt.supplier_invoice_number && (
                          <p className="text-xs text-blue-600">
                            Inv: {receipt.supplier_invoice_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{receipt.suppliers?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Code: {receipt.suppliers?.supplier_code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className="font-medium">{formatCurrency(receipt.total_amount)}</p>
                        {receipt.paid_amount > 0 && (
                          <p className="text-xs text-green-600">
                            Paid: {formatCurrency(receipt.paid_amount)}
                          </p>
                        )}
                        {receipt.balance_amount > 0 && (
                          <p className="text-xs text-red-600">
                            Balance: {formatCurrency(receipt.balance_amount)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(receipt.status)}`}>
                        {receipt.status.replace("_", " ").charAt(0).toUpperCase() + receipt.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getPaymentStatusColor(receipt.payment_status)}`}>
                        {receipt.payment_status.charAt(0).toUpperCase() + receipt.payment_status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}