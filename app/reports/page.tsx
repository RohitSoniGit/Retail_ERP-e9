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
const mockSalesData = [
  {
    id: "1",
    invoice_number: "INV2024-001",
    date: "2024-01-20",
    customer_name: "John Doe",
    total_amount: 15000,
    is_gst_bill: true,
    payment_mode: "cash",
    cgst_amount: 1350,
    sgst_amount: 1350,
    igst_amount: 0,
  },
  {
    id: "2",
    invoice_number: "EST2024-001",
    date: "2024-01-21",
    customer_name: "Jane Smith",
    total_amount: 8500,
    is_gst_bill: false,
    payment_mode: "upi",
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
  },
  {
    id: "3",
    invoice_number: "INV2024-002",
    date: "2024-01-22",
    customer_name: "ABC Company",
    total_amount: 25000,
    is_gst_bill: true,
    payment_mode: "credit",
    cgst_amount: 2250,
    sgst_amount: 2250,
    igst_amount: 0,
  },
];

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
  {
    id: "2",
    sku: "ITEM002",
    name: "Laptop ABC",
    category: "Electronics",
    current_stock: 3,
    min_stock_level: 5,
    purchase_cost: 40000,
    retail_price: 50000,
    total_value: 120000,
    last_movement: "2024-01-19",
  },
];

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

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState("all");

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
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
    // In a real app, this would generate a PDF
    alert(`Exporting ${reportName} to PDF...`);
  };

  const gstBills = mockSalesData.filter(sale => sale.is_gst_bill);
  const nonGstBills = mockSalesData.filter(sale => !sale.is_gst_bill);
  const totalGstSales = gstBills.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalNonGstSales = nonGstBills.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalTaxCollected = gstBills.reduce((sum, sale) => sum + sale.cgst_amount + sale.sgst_amount + sale.igst_amount, 0);

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
                    <p className="text-2xl font-bold">₹{(totalGstSales + totalNonGstSales).toLocaleString()}</p>
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
                  <Button variant="outline" onClick={() => exportToCSV(mockSalesData, 'sales-report')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportToPDF('Sales Report')}>
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
                  {mockSalesData.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono">{sale.invoice_number}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.customer_name}</TableCell>
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
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Printer className="h-3 w-3 mr-1" />
                            Print
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                      ₹{(totalGstSales + totalNonGstSales).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Transactions:</span>
                    <span className="text-xl font-semibold">{mockSalesData.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Transaction:</span>
                    <span className="text-xl font-semibold">
                      ₹{Math.round((totalGstSales + totalNonGstSales) / mockSalesData.length).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tax Collection Rate:</span>
                    <span className="text-xl font-semibold">
                      {Math.round((totalTaxCollected / (totalGstSales + totalNonGstSales)) * 100)}%
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
    </div>
  );
}