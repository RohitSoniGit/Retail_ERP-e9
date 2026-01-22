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
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search batches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 glass border-0 shadow-inner h-11"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass border-0 shadow-lg rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent group-hover:from-green-500/20 transition-all duration-500" />
          <div className="relative">
            <p className="text-sm font-medium text-green-600 mb-1">Active Batches</p>
            <p className="text-3xl font-bold text-foreground">{activeBatches}</p>
          </div>
        </div>
        <div className="glass border-0 shadow-lg rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent group-hover:from-yellow-500/20 transition-all duration-500" />
          <div className="relative">
            <p className="text-sm font-medium text-yellow-600 mb-1">Expiring Soon</p>
            <p className="text-3xl font-bold text-foreground">{expiringSoonBatches}</p>
            <p className="text-xs text-yellow-600/80 mt-1 font-medium">Within 30 days</p>
          </div>
        </div>
        <div className="glass border-0 shadow-lg rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent group-hover:from-red-500/20 transition-all duration-500" />
          <div className="relative">
            <p className="text-sm font-medium text-red-600 mb-1">Expired</p>
            <p className="text-3xl font-bold text-foreground">{expiredBatches}</p>
          </div>
        </div>
        <div className="glass border-0 shadow-lg rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-all duration-500" />
          <div className="relative">
            <p className="text-sm font-medium text-blue-600 mb-1">Total Value</p>
            <p className="text-2xl font-bold text-foreground font-mono">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 glass rounded-xl border-dashed border-2 border-white/10">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="glass border-0 rounded-xl shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5 backdrop-blur-md">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="font-bold text-foreground pl-6">Item & Batch</TableHead>
                <TableHead className="font-bold text-foreground">Supplier</TableHead>
                <TableHead className="text-right font-bold text-foreground">Quantity</TableHead>
                <TableHead className="font-bold text-foreground">Dates</TableHead>
                <TableHead className="text-right font-bold text-foreground">Value</TableHead>
                <TableHead className="font-bold text-foreground pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-12 w-12 mb-3 opacity-20" />
                      <p>No batches found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches?.map((batch) => (
                  <TableRow key={batch.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="pl-6">
                      <div className="space-y-1">
                        <p className="font-medium text-sm text-foreground">{batch.items?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{batch.items?.sku}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono glass border-0 bg-white/5 shadow-sm">
                            Batch: {batch.batch_number}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{batch.suppliers?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {batch.suppliers?.supplier_code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">
                          {batch.quantity_available} <span className="text-muted-foreground font-normal text-xs">/ {batch.quantity_received}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Available / Received
                        </p>
                        {batch.quantity_sold > 0 && (
                          <p className="text-xs text-blue-500 font-medium">
                            Sold: {batch.quantity_sold}
                          </p>
                        )}
                        {batch.quantity_damaged > 0 && (
                          <p className="text-xs text-red-500 font-medium">
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
                            <span className="font-medium">{new Date(batch.manufacturing_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })}</span>
                          </p>
                        )}
                        {batch.expiry_date && (
                          <p className={`text-xs ${isExpired(batch.expiry_date)
                              ? "text-red-500 font-bold"
                              : isExpiringSoon(batch.expiry_date)
                                ? "text-yellow-500 font-bold"
                                : "text-foreground"
                            }`}>
                            <span className="text-muted-foreground font-normal">Exp:</span>{" "}
                            {new Date(batch.expiry_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })}
                            {isExpiringSoon(batch.expiry_date) && !isExpired(batch.expiry_date) && (
                              <span className="ml-1 text-yellow-500">⚠️</span>
                            )}
                            {isExpired(batch.expiry_date) && (
                              <span className="ml-1 text-red-500">❌</span>
                            )}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className="font-bold font-mono text-sm">
                          {formatCurrency(batch.quantity_available * (batch.purchase_price || 0))}
                        </p>
                        {batch.purchase_price && (
                          <p className="text-xs text-muted-foreground font-mono">
                            @ {formatCurrency(batch.purchase_price)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex flex-col gap-2 items-start">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs border-0 shadow-sm ${batch.status === 'active' ? 'bg-green-500/10 text-green-500' :
                              batch.status === 'expired' ? 'bg-red-500/10 text-red-500' :
                                batch.status === 'damaged' ? 'bg-orange-500/10 text-orange-500' :
                                  batch.status === 'recalled' ? 'bg-purple-500/10 text-purple-500' :
                                    'bg-slate-500/10 text-slate-500'
                            }`}>
                            {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                          </Badge>
                        </div>
                        {isExpiringSoon(batch.expiry_date) && !isExpired(batch.expiry_date) && (
                          <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500 border-0 shadow-sm">
                            Expiring Soon
                          </Badge>
                        )}
                        {isExpired(batch.expiry_date) && (
                          <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-0 shadow-sm">
                            Expired
                          </Badge>
                        )}
                      </div>
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