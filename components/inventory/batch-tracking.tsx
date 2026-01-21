"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
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
import { formatCurrency, type ItemBatch } from "@/lib/types";
import { Search, Package, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export function BatchTracking() {
  const { organizationId } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: batches, isLoading } = useSWR(
    organizationId ? `item-batches-${organizationId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("item_batches")
        .select(`
          *,
          items (
            name,
            sku,
            unit_type
          ),
          suppliers (
            name,
            supplier_code
          )
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (ItemBatch & {
        items: {
          name: string;
          sku: string;
          unit_type: string;
        };
        suppliers?: {
          name: string;
          supplier_code: string;
        };
      })[];
    }
  );

  const filteredBatches = batches?.filter(
    (batch) =>
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.items?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.items?.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "expired":
        return "bg-red-100 text-red-700 border-red-200";
      case "damaged":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "recalled":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "expired":
      case "damaged":
      case "recalled":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  // Calculate summary stats
  const activeBatches = filteredBatches?.filter(b => b.status === "active").length || 0;
  const expiredBatches = filteredBatches?.filter(b => b.status === "expired" || isExpired(b.expiry_date)).length || 0;
  const expiringSoonBatches = filteredBatches?.filter(b => isExpiringSoon(b.expiry_date)).length || 0;
  const totalValue = filteredBatches?.reduce((sum, b) => sum + (b.quantity_available * (b.purchase_price || 0)), 0) || 0;

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search batches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm text-green-700">Active Batches</p>
          <p className="text-2xl font-bold text-green-700">{activeBatches}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-700">Expiring Soon</p>
          <p className="text-2xl font-bold text-yellow-700">{expiringSoonBatches}</p>
          <p className="text-xs text-yellow-600">Within 30 days</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-700">Expired</p>
          <p className="text-2xl font-bold text-red-700">{expiredBatches}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-700">Total Value</p>
          <p className="text-xl font-bold text-blue-700">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Batches Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Item & Batch</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No batches found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches?.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{batch.items?.name}</p>
                        <p className="text-xs text-muted-foreground">{batch.items?.sku}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Batch: {batch.batch_number}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{batch.suppliers?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {batch.suppliers?.supplier_code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {batch.quantity_available} / {batch.quantity_received}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Available / Received
                        </p>
                        {batch.quantity_sold > 0 && (
                          <p className="text-xs text-blue-600">
                            Sold: {batch.quantity_sold}
                          </p>
                        )}
                        {batch.quantity_damaged > 0 && (
                          <p className="text-xs text-red-600">
                            Damaged: {batch.quantity_damaged}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {batch.manufacturing_date && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">Mfg:</span>{" "}
                            {new Date(batch.manufacturing_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })}
                          </p>
                        )}
                        {batch.expiry_date && (
                          <p className={`text-xs ${
                            isExpired(batch.expiry_date) 
                              ? "text-red-600" 
                              : isExpiringSoon(batch.expiry_date) 
                                ? "text-yellow-600" 
                                : "text-muted-foreground"
                          }`}>
                            <span className="text-muted-foreground">Exp:</span>{" "}
                            {new Date(batch.expiry_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })}
                            {isExpiringSoon(batch.expiry_date) && !isExpired(batch.expiry_date) && (
                              <span className="ml-1 text-yellow-600">⚠️</span>
                            )}
                            {isExpired(batch.expiry_date) && (
                              <span className="ml-1 text-red-600">❌</span>
                            )}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {formatCurrency(batch.quantity_available * (batch.purchase_price || 0))}
                        </p>
                        {batch.purchase_price && (
                          <p className="text-xs text-muted-foreground">
                            @ {formatCurrency(batch.purchase_price)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(batch.status)}
                        <Badge variant="outline" className={`text-xs ${getStatusColor(batch.status)}`}>
                          {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                        </Badge>
                      </div>
                      {isExpiringSoon(batch.expiry_date) && !isExpired(batch.expiry_date) && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 mt-1">
                          Expiring Soon
                        </Badge>
                      )}
                      {isExpired(batch.expiry_date) && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 mt-1">
                          Expired
                        </Badge>
                      )}
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