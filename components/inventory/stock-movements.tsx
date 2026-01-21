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
import { Search, ArrowUp, ArrowDown, RotateCcw, Package, Loader2 } from "lucide-react";

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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search movements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={movementType} onValueChange={setMovementType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="damage">Damage</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm text-green-700">Stock In</p>
          <p className="text-2xl font-bold text-green-700">{totalIn.toFixed(0)}</p>
          <p className="text-xs text-green-600">Units received</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-700">Stock Out</p>
          <p className="text-2xl font-bold text-red-700">{totalOut.toFixed(0)}</p>
          <p className="text-xs text-red-600">Units dispatched</p>
        </div>
        <div className={`border rounded-lg p-4 text-center ${netMovement >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
          <p className={`text-sm ${netMovement >= 0 ? "text-blue-700" : "text-orange-700"}`}>Net Movement</p>
          <p className={`text-2xl font-bold ${netMovement >= 0 ? "text-blue-700" : "text-orange-700"}`}>
            {netMovement >= 0 ? "+" : ""}{netMovement.toFixed(0)}
          </p>
          <p className={`text-xs ${netMovement >= 0 ? "text-blue-600" : "text-orange-600"}`}>
            {netMovement >= 0 ? "Net increase" : "Net decrease"}
          </p>
        </div>
      </div>

      {/* Movements Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No stock movements found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements?.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{movement.items?.name}</p>
                        <p className="text-xs text-muted-foreground">{movement.items?.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementTypeIcon(movement.movement_type)}
                        <Badge variant="outline" className={`text-xs ${getMovementTypeColor(movement.movement_type)}`}>
                          {movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className={`font-medium ${movement.quantity_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {movement.quantity_change >= 0 ? "+" : ""}{movement.quantity_change} {movement.items?.unit_type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.unit_price ? (
                        <div className="space-y-1">
                          <p className="font-medium">
                            {formatCurrency(Math.abs(movement.quantity_change) * movement.unit_price)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @ {formatCurrency(movement.unit_price)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {movement.reference_id && (
                          <p className="text-xs text-blue-600">
                            Ref: {movement.reference_id.slice(0, 8)}...
                          </p>
                        )}
                        {movement.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {movement.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">
                          {new Date(movement.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
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