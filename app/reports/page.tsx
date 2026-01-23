"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  BarChart3,
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Package,
  Users,
  Receipt,
  DollarSign,
  Eye,
  Printer,
} from "lucide-react";

// Mock data for reports
// Mock data removed - fetching real data from Supabase
const mockInventoryData = [
  {
    id: "1",
    sku: "ITEM001",
    name: "Smartphone XYZ",
    category: "Electronics",
    current_stock: 8,
    min_stock_level: 10,
    purchase_cost: 12000,
    retail_price: 18000,
    total_value: 96000,
    last_movement: "2024-01-20",
  },
];
// Keeping Inventory mock for now as we only fixed Sales tab
const mockPurchaseData = [
  {
    id: "1",
    po_number: "PO202401001",
    supplier_name: "ABC Electronics",
    date: "2024-01-15",
    total_amount: 118000,
    status: "completed",
    advance_paid: 25000,
    balance_amount: 93000,
  },
];

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useOrganization } from "@/lib/context/organization";
import useSWR from "swr";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PDFGenerator } from "@/lib/pdf-generator";
import { InvoicePrintDialog } from "@/components/billing/invoice-print-dialog";
import { Sale } from "@/lib/types";

export default function ReportsPage() {
  const { organizationId, organization } = useOrganization();
  const supabase = getSupabaseBrowserClient();

  const [activeTab, setActiveTab] = useState("sales");
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);

  // Fetch Sales Data
  const { data: salesData } = useSWR(
    organizationId ? `sales-report-${organizationId}-${dateFrom}-${dateTo}` : null,
    async () => {
      let query = supabase
        .from("sales")
        .select(`
          *,
          sale_items (*)
        `)
        .eq("organization_id", organizationId)
        .gte("created_at", `${dateFrom}T00:00:00`)
        .lte("created_at", `${dateTo}T23:59:59`)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  );

  const sales: Sale[] = salesData || [];
  const gstBills = sales.filter((s: Sale) => s.is_gst_bill);
  const nonGstBills = sales.filter((s: Sale) => !s.is_gst_bill);
  const totalSales = sales.reduce((sum: number, s: Sale) => sum + s.total_amount, 0);
  const totalTaxCollected = sales.reduce((sum: number, s: Sale) => sum + s.cgst_amount + s.sgst_amount + s.igst_amount, 0);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0] || {}).filter(key => typeof data[0][key] !== 'object');
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = (reportName: string) => {
    // Placeholder as implementing full report PDF is complex
    alert(`Exporting ${reportName} to PDF...`);
  };

  const totalGstSales = gstBills.reduce((sum: number, s: any) => sum + s.total_amount, 0);
  const totalNonGstSales = nonGstBills.reduce((sum: number, s: any) => sum + s.total_amount, 0);

  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Business Reports</h1>
        <p className="text-muted-foreground">Comprehensive business analytics and reports</p>
      </div>

      {/* Date Range Filter */}
      <Card className="glass border-0 shadow-lg mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Date Range:</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="dateFrom" className="text-sm">From:</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="dateTo" className="text-sm">To:</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button className="holographic text-white">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
          <TabsTrigger value="purchase">Purchase Reports</TabsTrigger>
          <TabsTrigger value="gst">GST Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          {/* Sales Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Receipt className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">₹{totalSales.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{gstBills.length}</p>
                    <p className="text-sm text-muted-foreground">GST Bills</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{nonGstBills.length}</p>
                    <p className="text-sm text-muted-foreground">Non-GST Bills</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">₹{totalTaxCollected.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Tax Collected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Report Table */}
          <Card className="glass border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sales Report</CardTitle>
                  <CardDescription>Detailed sales transactions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportToCSV(sales, 'sales-report')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No sales records found for this period</TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono">{sale.invoice_number}</TableCell>
                        <TableCell>{new Date(sale.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.customer_name || 'Walk-in'}</TableCell>
                        <TableCell>
                          <Badge variant={sale.is_gst_bill ? "default" : "secondary"}>
                            {sale.is_gst_bill ? "GST Bill" : "Non-GST"}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{sale.payment_mode}</TableCell>
                        <TableCell>₹{(sale.cgst_amount + sale.sgst_amount + sale.igst_amount).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">₹{sale.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedSale(sale)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handlePrint(sale)}>
                              <Printer className="h-3 w-3 mr-1" />
                              Print
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{mockInventoryData.length}</p>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      ₹{mockInventoryData.reduce((sum, item) => sum + item.total_value, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Inventory Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {mockInventoryData.filter(item => item.current_stock <= item.min_stock_level).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {mockInventoryData.filter(item => item.current_stock === 0).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Report */}
          <Card className="glass border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Report</CardTitle>
                  <CardDescription>Current stock levels and valuation</CardDescription>
                </div>
                <div className="flex gap-2">
                  {/* ... */}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                {/* ... */}
                <TableBody>
                  {mockInventoryData.map((item) => (
                    <TableRow key={item.id}>
                      {/* ... */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-6">
          {/* ... */}
        </TabsContent>

        <TabsContent value="gst" className="space-y-6">
          {/* GST Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle>GST Bills Summary</CardTitle>
                <CardDescription>GST registered transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total GST Bills:</span>
                    <span className="font-medium">{gstBills.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total GST Sales:</span>
                    <span className="font-medium">₹{totalGstSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tax Collected:</span>
                    <span className="font-medium">₹{totalTaxCollected.toLocaleString()}</span>
                  </div>
                  <Button className="w-full holographic text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export GST Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Non-GST Bills Summary</CardTitle>
                <CardDescription>Non-GST transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Non-GST Bills:</span>
                    <span className="font-medium">{nonGstBills.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Non-GST Sales:</span>
                    <span className="font-medium">₹{totalNonGstSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Applicable:</span>
                    <span className="font-medium">₹0</span>
                  </div>
                  <Button className="w-full holographic text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export Non-GST Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Separate GST and Non-GST Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle>GST Bills</CardTitle>
                <CardDescription>All GST registered invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gstBills.map((bill: any) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-mono text-xs">{bill.invoice_number}</TableCell>
                        <TableCell className="text-xs">{new Date(bill.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">{bill.customer_name}</TableCell>
                        <TableCell className="text-xs">₹{(bill.cgst_amount + bill.sgst_amount + bill.igst_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-medium">₹{bill.total_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Non-GST Bills</CardTitle>
                <CardDescription>All non-GST transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonGstBills.map((bill: any) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-mono text-xs">{bill.invoice_number}</TableCell>
                        <TableCell className="text-xs">{new Date(bill.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">{bill.customer_name}</TableCell>
                        <TableCell className="text-xs">₹0</TableCell>
                        <TableCell className="text-xs font-medium">₹{bill.total_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{mockInventoryData.length}</p>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      ₹{mockInventoryData.reduce((sum, item) => sum + item.total_value, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Inventory Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {mockInventoryData.filter(item => item.current_stock <= item.min_stock_level).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {mockInventoryData.filter(item => item.current_stock === 0).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Report */}
          <Card className="glass border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Report</CardTitle>
                  <CardDescription>Current stock levels and valuation</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportToCSV(mockInventoryData, 'inventory-report')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportToPDF('Inventory Report')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Level</TableHead>
                    <TableHead>Purchase Cost</TableHead>
                    <TableHead>Retail Price</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInventoryData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.current_stock}</TableCell>
                      <TableCell>{item.min_stock_level}</TableCell>
                      <TableCell>₹{item.purchase_cost.toLocaleString()}</TableCell>
                      <TableCell>₹{item.retail_price.toLocaleString()}</TableCell>
                      <TableCell>₹{item.total_value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          item.current_stock === 0 ? "destructive" :
                            item.current_stock <= item.min_stock_level ? "secondary" : "default"
                        }>
                          {item.current_stock === 0 ? "Out of Stock" :
                            item.current_stock <= item.min_stock_level ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-6">
          {/* Purchase Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Receipt className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      ₹{mockPurchaseData.reduce((sum, po) => sum + po.total_amount, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Purchases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{mockPurchaseData.length}</p>
                    <p className="text-sm text-muted-foreground">Purchase Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      ₹{mockPurchaseData.reduce((sum, po) => sum + po.advance_paid, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Advances Paid</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      ₹{mockPurchaseData.reduce((sum, po) => sum + po.balance_amount, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Pending Payments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Report */}
          <Card className="glass border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Purchase Report</CardTitle>
                  <CardDescription>Purchase orders and payment status</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportToCSV(mockPurchaseData, 'purchase-report')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportToPDF('Purchase Report')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Advance Paid</TableHead>
                    <TableHead>Balance Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPurchaseData.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono">{po.po_number}</TableCell>
                      <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>
                      <TableCell>{po.supplier_name}</TableCell>
                      <TableCell>₹{po.total_amount.toLocaleString()}</TableCell>
                      <TableCell>₹{po.advance_paid.toLocaleString()}</TableCell>
                      <TableCell>₹{po.balance_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === "completed" ? "default" : "secondary"}>
                          {po.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst" className="space-y-6">
          {/* GST Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle>GST Bills Summary</CardTitle>
                <CardDescription>GST registered transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total GST Bills:</span>
                    <span className="font-medium">{gstBills.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total GST Sales:</span>
                    <span className="font-medium">₹{totalGstSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tax Collected:</span>
                    <span className="font-medium">₹{totalTaxCollected.toLocaleString()}</span>
                  </div>
                  <Button className="w-full holographic text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export GST Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Non-GST Bills Summary</CardTitle>
                <CardDescription>Non-GST transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Non-GST Bills:</span>
                    <span className="font-medium">{nonGstBills.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Non-GST Sales:</span>
                    <span className="font-medium">₹{totalNonGstSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Applicable:</span>
                    <span className="font-medium">₹0</span>
                  </div>
                  <Button className="w-full holographic text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export Non-GST Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Separate GST and Non-GST Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle>GST Bills</CardTitle>
                <CardDescription>All GST registered invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gstBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-mono text-xs">{bill.invoice_number}</TableCell>
                        <TableCell className="text-xs">{new Date(bill.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">{bill.customer_name}</TableCell>
                        <TableCell className="text-xs">₹{(bill.cgst_amount + bill.sgst_amount + bill.igst_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-medium">₹{bill.total_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Non-GST Bills</CardTitle>
                <CardDescription>All non-GST transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonGstBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-mono text-xs">{bill.invoice_number}</TableCell>
                        <TableCell className="text-xs">{new Date(bill.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs">{bill.customer_name}</TableCell>
                        <TableCell className="text-xs">₹0</TableCell>
                        <TableCell className="text-xs font-medium">₹{bill.total_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Business Overview</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Revenue:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{totalSales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Transactions:</span>
                    <span className="text-xl font-semibold">{sales.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Transaction:</span>
                    <span className="text-xl font-semibold">
                      ₹{sales.length > 0 ? Math.round(totalSales / sales.length).toLocaleString() : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tax Collection Rate:</span>
                    <span className="text-xl font-semibold">
                      {totalSales > 0 ? Math.round((totalTaxCollected / totalSales) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Inventory Health</CardTitle>
                <CardDescription>Stock management metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Items:</span>
                    <span className="text-2xl font-bold text-blue-600">{mockInventoryData.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Inventory Value:</span>
                    <span className="text-xl font-semibold">
                      ₹{mockInventoryData.reduce((sum, item) => sum + item.total_value, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Low Stock Items:</span>
                    <span className="text-xl font-semibold text-orange-600">
                      {mockInventoryData.filter(item => item.current_stock <= item.min_stock_level).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Stock Health:</span>
                    <span className="text-xl font-semibold text-green-600">
                      {Math.round((mockInventoryData.filter(item => item.current_stock > item.min_stock_level).length / mockInventoryData.length) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {/* View Sale Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedSale && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold">Invoice #{selectedSale.invoice_number}</h2>
                  <p className="text-sm text-muted-foreground">{new Date(selectedSale.created_at).toLocaleDateString()}</p>
                </div>
                <Badge>{selectedSale.payment_mode}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Details</h3>
                  <p>{selectedSale.customer_name || 'Walk-in Customer'}</p>
                  <p className="text-sm text-muted-foreground">{selectedSale.customer_phone}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold mb-2">Payment Details</h3>
                  <p className="text-2xl font-bold">₹{selectedSale.total_amount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Tax: ₹{(selectedSale.cgst_amount + selectedSale.sgst_amount + selectedSale.igst_amount).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.sale_items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item?.name || 'Item'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.unit_price}</TableCell>
                        <TableCell>₹{item.total_price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedSale(null)}>Close</Button>
                <Button onClick={() => {
                  setSaleToPrint(selectedSale);
                  setShowPrintDialog(true);
                }}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      {/* Map sale object to InvoicePrintDialog props */}
      {saleToPrint && organization && (
        <InvoicePrintDialog
          open={showPrintDialog}
          onOpenChange={setShowPrintDialog}
          organization={organization}
          invoiceNumber={saleToPrint.invoice_number}
          date={saleToPrint.created_at}
          customer={{
            name: saleToPrint.customer_name || 'Walk-in',
            phone: saleToPrint.customer_phone || saleToPrint.customer?.phone || '',
            address: saleToPrint.customer?.address || '',
            gst_number: saleToPrint.customer?.gst_number || '',
            id: saleToPrint.customer_id || '',
            organization_id: organization.id,
            customer_type: 'retail', // default
            credit_limit: 0,
            current_balance: 0,
            created_at: new Date().toISOString()
          }}
          items={(saleToPrint.sale_items || []).map((item: any) => ({
            item_id: item.item_id,
            item: item.item || {
              id: item.item_id,
              name: item.item_name || 'Unknown Item',
              unit_type: item.unit_type || 'pcs',
              sku: '',
              organization_id: organization.id,
              wholesale_price: 0,
              retail_price: item.unit_price,
              purchase_cost: 0,
              current_stock: 0,
              min_stock_level: 0,
              gst_rate: item.gst_rate,
              pieces_per_unit: 1,
              conversion_factor: 1,
              is_rate_variable: false,
              created_at: new Date().toISOString()
            },
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent || 0,
            gst_rate: item.gst_rate,
            subtotal: item.total_price / (1 + (item.gst_rate / 100)), // Approximate if not stored
            tax_amount: item.cgst_amount + item.sgst_amount + item.igst_amount,
            total: item.total_price,
          }))}
          totals={{
            subtotal: saleToPrint.subtotal,
            discountAmount: saleToPrint.discount_amount || 0,
            cgst: saleToPrint.cgst_amount,
            sgst: saleToPrint.sgst_amount,
            igst: saleToPrint.igst_amount,
            roundedTotal: saleToPrint.total_amount,
            roundOff: saleToPrint.round_off || 0,
            isIGST: saleToPrint.igst_amount > 0
          }}
          format="a4"
        />
      )}
    </div>
  );
}