"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Printer,
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  FileText,
  Settings,
  Palette,
  Layout,
  Save,
  Download,
} from "lucide-react";
import { PrintFormat, PrintTemplateData } from "@/lib/types";
import { toast } from "sonner";

const DEFAULT_TEMPLATE: PrintTemplateData = {
  paper_size: "A4",
  orientation: "portrait",
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  header: {
    show_logo: true,
    logo_position: "left",
    company_name_size: 24,
    show_address: true,
    show_contact: true,
    show_gstin: true,
    custom_text: "",
  },
  body: {
    show_item_code: true,
    show_hsn: true,
    show_unit: true,
    show_discount: true,
    show_tax_breakup: true,
    item_description_lines: 2,
    font_size: 12,
  },
  footer: {
    show_terms: true,
    show_signature: true,
    show_bank_details: true,
    custom_footer: "",
    show_amount_in_words: true,
  },
  colors: {
    header_bg: "#1e40af",
    header_text: "#ffffff",
    table_header_bg: "#f3f4f6",
    table_header_text: "#374151",
    border_color: "#d1d5db",
  },
};

const PRINT_FORMAT_TYPES = [
  { value: "sale_invoice", label: "Sales Invoice" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "grn", label: "Goods Receipt Note" },
  { value: "quotation", label: "Quotation" },
  { value: "delivery_note", label: "Delivery Note" },
  { value: "payment_receipt", label: "Payment Receipt" },
];

interface PrintFormatManagerProps {
  onSave?: (format: PrintFormat) => void;
}

export function PrintFormatManager({ onSave }: PrintFormatManagerProps) {
  const [formats, setFormats] = useState<PrintFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "sale_invoice" as const,
    template_data: DEFAULT_TEMPLATE,
    is_default: false,
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockFormats: PrintFormat[] = [
      {
        id: "1",
        organization_id: "org1",
        name: "Standard Invoice",
        type: "sale_invoice",
        template_data: DEFAULT_TEMPLATE,
        is_default: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        organization_id: "org1",
        name: "Thermal Receipt",
        type: "sale_invoice",
        template_data: {
          ...DEFAULT_TEMPLATE,
          paper_size: "thermal_80mm",
          header: { ...DEFAULT_TEMPLATE.header, company_name_size: 16 },
          body: { ...DEFAULT_TEMPLATE.body, font_size: 10 },
        },
        is_default: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    setFormats(mockFormats);
  }, []);

  const handleSave = () => {
    const newFormat: PrintFormat = {
      id: selectedFormat?.id || Date.now().toString(),
      organization_id: "org1",
      name: formData.name,
      type: formData.type,
      template_data: formData.template_data,
      is_default: formData.is_default,
      is_active: true,
      created_at: selectedFormat?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (selectedFormat) {
      setFormats(formats.map(f => f.id === selectedFormat.id ? newFormat : f));
      toast.success("Print format updated successfully!");
    } else {
      setFormats([...formats, newFormat]);
      toast.success("Print format created successfully!");
    }

    onSave?.(newFormat);
    setIsEditing(false);
    setSelectedFormat(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "sale_invoice",
      template_data: DEFAULT_TEMPLATE,
      is_default: false,
    });
  };

  const handleEdit = (format: PrintFormat) => {
    setSelectedFormat(format);
    setFormData({
      name: format.name,
      type: format.type,
      template_data: format.template_data,
      is_default: format.is_default,
    });
    setIsEditing(true);
  };

  const handleDelete = (formatId: string) => {
    setFormats(formats.filter(f => f.id !== formatId));
    toast.success("Print format deleted successfully!");
  };

  const handleDuplicate = (format: PrintFormat) => {
    const duplicated: PrintFormat = {
      ...format,
      id: Date.now().toString(),
      name: `${format.name} (Copy)`,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setFormats([...formats, duplicated]);
    toast.success("Print format duplicated successfully!");
  };

  const updateTemplateData = (section: keyof PrintTemplateData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      template_data: {
        ...prev.template_data,
        [section]: {
          ...prev.template_data[section],
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Print Format Management</h3>
          <p className="text-sm text-muted-foreground">
            Create and customize print formats for invoices, orders, and receipts
          </p>
        </div>
        <Button onClick={() => setIsEditing(true)} className="holographic text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Format
        </Button>
      </div>

      {/* Format List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formats.map((format) => (
          <Card key={format.id} className="glass border-0 shadow-lg hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{format.name}</CardTitle>
                <div className="flex gap-1">
                  {format.is_default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {PRINT_FORMAT_TYPES.find(t => t.value === format.type)?.label}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs">
                {format.template_data.paper_size} • {format.template_data.orientation}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedFormat(format);
                    setShowPreview(true);
                  }}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(format)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicate(format)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(format.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedFormat ? "Edit Print Format" : "Create Print Format"}
            </DialogTitle>
            <DialogDescription>
              Customize the layout and styling of your print documents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Format Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard Invoice"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRINT_FORMAT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="is_default">Set as default format</Label>
            </div>

            <Separator />

            {/* Template Configuration */}
            <Tabs defaultValue="layout" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="layout">
                  <Layout className="h-4 w-4 mr-2" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="header">
                  <FileText className="h-4 w-4 mr-2" />
                  Header
                </TabsTrigger>
                <TabsTrigger value="body">
                  <Settings className="h-4 w-4 mr-2" />
                  Body
                </TabsTrigger>
                <TabsTrigger value="colors">
                  <Palette className="h-4 w-4 mr-2" />
                  Colors
                </TabsTrigger>
              </TabsList>

              <TabsContent value="layout" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Paper Size</Label>
                    <Select
                      value={formData.template_data.paper_size}
                      onValueChange={(value: any) => updateTemplateData("paper_size", "", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A5">A5</SelectItem>
                        <SelectItem value="thermal_80mm">Thermal 80mm</SelectItem>
                        <SelectItem value="thermal_58mm">Thermal 58mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Orientation</Label>
                    <Select
                      value={formData.template_data.orientation}
                      onValueChange={(value: any) => updateTemplateData("orientation", "", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Top Margin (mm)</Label>
                    <Input
                      type="number"
                      value={formData.template_data.margins.top}
                      onChange={(e) => updateTemplateData("margins", "top", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Right Margin (mm)</Label>
                    <Input
                      type="number"
                      value={formData.template_data.margins.right}
                      onChange={(e) => updateTemplateData("margins", "right", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bottom Margin (mm)</Label>
                    <Input
                      type="number"
                      value={formData.template_data.margins.bottom}
                      onChange={(e) => updateTemplateData("margins", "bottom", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Left Margin (mm)</Label>
                    <Input
                      type="number"
                      value={formData.template_data.margins.left}
                      onChange={(e) => updateTemplateData("margins", "left", Number(e.target.value))}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="header" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.template_data.header.show_logo}
                        onCheckedChange={(checked) => updateTemplateData("header", "show_logo", checked)}
                      />
                      <Label>Show Logo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.template_data.header.show_address}
                        onCheckedChange={(checked) => updateTemplateData("header", "show_address", checked)}
                      />
                      <Label>Show Address</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.template_data.header.show_contact}
                        onCheckedChange={(checked) => updateTemplateData("header", "show_contact", checked)}
                      />
                      <Label>Show Contact</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.template_data.header.show_gstin}
                        onCheckedChange={(checked) => updateTemplateData("header", "show_gstin", checked)}
                      />
                      <Label>Show GSTIN</Label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Logo Position</Label>
                      <Select
                        value={formData.template_data.header.logo_position}
                        onValueChange={(value: any) => updateTemplateData("header", "logo_position", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name Size</Label>
                      <Input
                        type="number"
                        value={formData.template_data.header.company_name_size}
                        onChange={(e) => updateTemplateData("header", "company_name_size", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custom Header Text</Label>
                      <Textarea
                        value={formData.template_data.header.custom_text || ""}
                        onChange={(e) => updateTemplateData("header", "custom_text", e.target.value)}
                        placeholder="Additional header text..."
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="body" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.template_data.body.show_item_code}
                        onCheckedChange={(checked) => updateTemplateData("body", "show_item_code", checked)}
                      />
                      <Label>Show Item Code</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.template_data.body.show_hsn}
                        onCheckedChange={(checked) => updateTemplateData("body", "show_hsn", checked)}
                      />
                      <Label>Show HSN Code</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.template_data.body.show_unit}
                        onCheckedChange={(checked) => updateTemplateData("body", "show_unit", checked)}
                      />
                      <Label>Show Unit</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.template_data.body.show_discount}
                        onCheckedChange={(checked) => updateTemplateData("body", "show_discount", checked)}
                      />
                      <Label>Show Discount</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.template_data.body.show_tax_breakup}
                        onCheckedChange={(checked) => updateTemplateData("body", "show_tax_breakup", checked)}
                      />
                      <Label>Show Tax Breakup</Label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Input
                        type="number"
                        value={formData.template_data.body.font_size}
                        onChange={(e) => updateTemplateData("body", "font_size", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Item Description Lines</Label>
                      <Input
                        type="number"
                        value={formData.template_data.body.item_description_lines}
                        onChange={(e) => updateTemplateData("body", "item_description_lines", Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="colors" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Header Background</Label>
                      <Input
                        type="color"
                        value={formData.template_data.colors.header_bg}
                        onChange={(e) => updateTemplateData("colors", "header_bg", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Header Text</Label>
                      <Input
                        type="color"
                        value={formData.template_data.colors.header_text}
                        onChange={(e) => updateTemplateData("colors", "header_text", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Table Header Background</Label>
                      <Input
                        type="color"
                        value={formData.template_data.colors.table_header_bg}
                        onChange={(e) => updateTemplateData("colors", "table_header_bg", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Table Header Text</Label>
                      <Input
                        type="color"
                        value={formData.template_data.colors.table_header_text}
                        onChange={(e) => updateTemplateData("colors", "table_header_text", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Border Color</Label>
                      <Input
                        type="color"
                        value={formData.template_data.colors.border_color}
                        onChange={(e) => updateTemplateData("colors", "border_color", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="holographic text-white">
                <Save className="h-4 w-4 mr-2" />
                Save Format
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Print Preview - {selectedFormat?.name}</DialogTitle>
            <DialogDescription>
              Preview of how your document will look when printed
            </DialogDescription>
          </DialogHeader>
          <div className="bg-white p-8 border rounded-lg min-h-[600px]">
            {selectedFormat && (
              <PrintPreview format={selectedFormat} />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button className="holographic text-white">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Print Preview Component
function PrintPreview({ format }: { format: PrintFormat }) {
  const { template_data } = format;

  return (
    <div 
      className="print-preview"
      style={{
        fontSize: `${template_data.body.font_size}px`,
        color: '#000',
      }}
    >
      {/* Header */}
      <div 
        className="header mb-6 p-4 rounded"
        style={{
          backgroundColor: template_data.colors.header_bg,
          color: template_data.colors.header_text,
          textAlign: template_data.header.logo_position as any,
        }}
      >
        <h1 style={{ fontSize: `${template_data.header.company_name_size}px`, margin: 0 }}>
          Your Company Name
        </h1>
        {template_data.header.show_address && (
          <p className="mt-2 mb-1">123 Business Street, City, State - 123456</p>
        )}
        {template_data.header.show_contact && (
          <p className="mb-1">Phone: +91 98765 43210 | Email: info@company.com</p>
        )}
        {template_data.header.show_gstin && (
          <p className="mb-1">GSTIN: 27ABCDE1234F1Z5</p>
        )}
        {template_data.header.custom_text && (
          <p className="mt-2">{template_data.header.custom_text}</p>
        )}
      </div>

      {/* Document Info */}
      <div className="document-info mb-6 grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Bill To:</h3>
          <p>Customer Name</p>
          <p>Customer Address</p>
          <p>Phone: +91 98765 43210</p>
        </div>
        <div className="text-right">
          <p><strong>Invoice #:</strong> INV-2024-001</p>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr 
            style={{
              backgroundColor: template_data.colors.table_header_bg,
              color: template_data.colors.table_header_text,
            }}
          >
            <th className="border p-2 text-left" style={{ borderColor: template_data.colors.border_color }}>
              Item
            </th>
            {template_data.body.show_item_code && (
              <th className="border p-2 text-left" style={{ borderColor: template_data.colors.border_color }}>
                Code
              </th>
            )}
            {template_data.body.show_hsn && (
              <th className="border p-2 text-left" style={{ borderColor: template_data.colors.border_color }}>
                HSN
              </th>
            )}
            <th className="border p-2 text-right" style={{ borderColor: template_data.colors.border_color }}>
              Qty
            </th>
            {template_data.body.show_unit && (
              <th className="border p-2 text-left" style={{ borderColor: template_data.colors.border_color }}>
                Unit
              </th>
            )}
            <th className="border p-2 text-right" style={{ borderColor: template_data.colors.border_color }}>
              Rate
            </th>
            {template_data.body.show_discount && (
              <th className="border p-2 text-right" style={{ borderColor: template_data.colors.border_color }}>
                Disc%
              </th>
            )}
            <th className="border p-2 text-right" style={{ borderColor: template_data.colors.border_color }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2" style={{ borderColor: template_data.colors.border_color }}>
              Sample Product
            </td>
            {template_data.body.show_item_code && (
              <td className="border p-2" style={{ borderColor: template_data.colors.border_color }}>
                SP001
              </td>
            )}
            {template_data.body.show_hsn && (
              <td className="border p-2" style={{ borderColor: template_data.colors.border_color }}>
                1234
              </td>
            )}
            <td className="border p-2 text-right" style={{ borderColor: template_data.colors.border_color }}>
              2
            </td>
            {template_data.body.show_unit && (
              <td className="border p-2" style={{ borderColor: template_data.colors.border_color }}>
                PCS
              </td>
            )}
            <td className="border p-2 text-right" style={{ borderColor: template_data.colors.border_color }}>
              ₹500.00
            </td>
            {template_data.body.show_discount && (
              <td className="border p-2 text-right" style={{ borderColor: template_data.colors.border_color }}>
                10%
              </td>
            )}
            <td className="border p-2 text-right" style={{ borderColor: template_data.colors.border_color }}>
              ₹900.00
            </td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="totals mb-6">
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-1">
              <span>Subtotal:</span>
              <span>₹900.00</span>
            </div>
            {template_data.body.show_tax_breakup && (
              <>
                <div className="flex justify-between py-1">
                  <span>CGST (9%):</span>
                  <span>₹81.00</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>SGST (9%):</span>
                  <span>₹81.00</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-2 border-t font-semibold">
              <span>Total:</span>
              <span>₹1,062.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {(template_data.footer.show_terms || template_data.footer.show_bank_details || template_data.footer.custom_footer) && (
        <div className="footer mt-8 pt-4 border-t">
          {template_data.footer.show_terms && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Terms & Conditions:</h4>
              <p className="text-sm">Payment due within 30 days. Late payments may incur additional charges.</p>
            </div>
          )}
          {template_data.footer.show_bank_details && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Bank Details:</h4>
              <p className="text-sm">Bank: Sample Bank | A/C: 1234567890 | IFSC: SAMP0001234</p>
            </div>
          )}
          {template_data.footer.custom_footer && (
            <div className="mb-4">
              <p className="text-sm">{template_data.footer.custom_footer}</p>
            </div>
          )}
          {template_data.footer.show_signature && (
            <div className="text-right mt-8">
              <div className="inline-block">
                <div className="w-32 border-t border-gray-400 mb-2"></div>
                <p className="text-sm">Authorized Signature</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}