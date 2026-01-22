"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, type StockMovement } from "@/lib/types";
import { Search, ArrowUp, ArrowDown, RotateCcw, Package, Loader2, TrendingUp, TrendingDown } from "lucide-react";

export function StockMovements() {
  const { organizationId } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [movementType, setMovementType] = useState("all");
  const [dateRange, setDateRange] = useState("today");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: movements, isLoading } = useSWR(
    organizationId ? `stock-movements-${organizationId}-${movementType}-${dateRange}` : null,
    async () => {
      let query = supabase
        .from("stock_movements")
        .select(`
          *,
          items (
            name,
            sku,
            unit_type
          )
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      // Filter by movement type
      if (movementType !== "all") {
        query = query.eq("movement_type", movementType);
      }

      // Filter by date range
      const today = new Date();
      let startDate: Date;

      switch (dateRange) {
        case "today":
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          break;
        case "week":
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        default:
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      query = query.gte("created_at", startDate.toISOString());

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as (StockMovement & {
        items: {
          name: string;
          sku: string;
          unit_type: string;
        };
      })[];
    }
  );

  const filteredMovements = movements?.filter(
    (movement) =>
      movement.items?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.items?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "sale":
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case "adjustment":
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      case "return":
        return <ArrowUp className="h-4 w-4 text-yellow-600" />;
      case "damage":
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-green-100 text-green-700 border-green-200";
      case "sale":
        return "bg-red-100 text-red-700 border-red-200";
      case "adjustment":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "return":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "damage":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Calculate summary stats
  const totalIn = filteredMovements?.reduce((sum, m) =>
    m.quantity_change > 0 ? sum + m.quantity_change : sum, 0) || 0;
  const totalOut = filteredMovements?.reduce((sum, m) =>
    m.quantity_change < 0 ? sum + Math.abs(m.quantity_change) : sum, 0) || 0;
  const netMovement = totalIn - totalOut;

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search movements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-0 shadow-inner h-11"
          />
        </div>

        <div className="flex gap-2">
          <Select value={movementType} onValueChange={setMovementType}>
            <SelectTrigger className="w-[140px] glass border-0 shadow-sm h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-0 backdrop-blur-xl">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="damage">Damage</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px] glass border-0 shadow-sm h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-0 backdrop-blur-xl">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="glass border-0 shadow-lg rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent group-hover:from-emerald-500/20 transition-all duration-500" />
          <div className="flex items-center gap-4 relative">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
              <ArrowUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1">Stock In</p>
              <p className="text-3xl font-bold text-foreground">{totalIn.toFixed(0)}</p>
              <p className="text-xs text-emerald-600/80 font-medium mt-1">Units received</p>
            </div>
          </div>
        </div>
        <div className="glass border-0 shadow-lg rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent group-hover:from-rose-500/20 transition-all duration-500" />
          <div className="flex items-center gap-4 relative">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 shadow-inner">
              <ArrowDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-rose-600 mb-1">Stock Out</p>
              <p className="text-3xl font-bold text-foreground">{totalOut.toFixed(0)}</p>
              <p className="text-xs text-rose-600/80 font-medium mt-1">Units dispatched</p>
            </div>
          </div>
        </div>
        <div className={`glass border-0 shadow-lg rounded-xl p-6 relative overflow-hidden group`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${netMovement >= 0 ? "from-blue-500/10 to-transparent group-hover:from-blue-500/20" : "from-orange-500/10 to-transparent group-hover:from-orange-500/20"} transition-all duration-500`} />
          <div className="flex items-center gap-4 relative">
            <div className={`p-3 rounded-2xl shadow-inner ${netMovement >= 0 ? "bg-blue-500/10 text-blue-600" : "bg-orange-500/10 text-orange-600"}`}>
              {netMovement >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            </div>
            <div>
              <p className={`text-sm font-medium mb-1 ${netMovement >= 0 ? "text-blue-600" : "text-orange-600"}`}>Net Movement</p>
              <p className={`text-3xl font-bold ${netMovement >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                {netMovement >= 0 ? "+" : ""}{netMovement.toFixed(0)}
              </p>
              <p className={`text-xs font-medium mt-1 ${netMovement >= 0 ? "text-blue-600/80" : "text-orange-600/80"}`}>
                {netMovement >= 0 ? "Net increase" : "Net decrease"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 glass rounded-xl border-dashed border-2 border-white/10">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="glass border-0 rounded-xl shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5 backdrop-blur-md">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="font-bold text-foreground pl-6">Item</TableHead>
                <TableHead className="font-bold text-foreground">Type</TableHead>
                <TableHead className="text-right font-bold text-foreground">Quantity</TableHead>
                <TableHead className="text-right font-bold text-foreground">Value</TableHead>
                <TableHead className="font-bold text-foreground">Reference</TableHead>
                <TableHead className="font-bold text-foreground pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-12 w-12 mb-3 opacity-20" />
                      <p>No stock movements found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements?.map((movement) => (
                  <TableRow key={movement.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="pl-6">
                      <div className="space-y-1">
                        <p className="font-medium text-sm text-foreground">{movement.items?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{movement.items?.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementTypeIcon(movement.movement_type)}
                        <Badge variant="outline" className={`text-xs font-medium border-0 shadow-sm ${getMovementTypeColor(movement.movement_type)}`}>
                          {movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className={`font-bold font-mono ${movement.quantity_change >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {movement.quantity_change >= 0 ? "+" : ""}{movement.quantity_change}
                        </p>
                        <p className="text-xs text-muted-foreground">{movement.items?.unit_type}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.unit_price ? (
                        <div className="space-y-1">
                          <p className="font-medium font-mono text-foreground">
                            {formatCurrency(Math.abs(movement.quantity_change) * movement.unit_price)}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            @ {formatCurrency(movement.unit_price)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-mono">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {movement.reference_id && (
                          <p className="text-xs text-blue-500 font-mono bg-blue-500/10 px-2 py-0.5 rounded-md inline-block">
                            Ref: {movement.reference_id.slice(0, 8)}...
                          </p>
                        )}
                        {movement.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {movement.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {new Date(movement.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {new Date(movement.created_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
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