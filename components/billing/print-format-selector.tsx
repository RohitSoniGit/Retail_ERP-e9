"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  Download,
  Settings,
  FileText,
} from "lucide-react";
import { PrintFormat } from "@/lib/types";

interface PrintFormatSelectorProps {
  documentType: "sale_invoice" | "purchase_order" | "grn" | "quotation" | "delivery_note" | "payment_receipt";
  onPrint?: (formatId: string) => void;
  onPreview?: (formatId: string) => void;
  className?: string;
}

export function PrintFormatSelector({ 
  documentType, 
  onPrint, 
  onPreview, 
  className 
}: PrintFormatSelectorProps) {
  const [printFormats, setPrintFormats] = useState<PrintFormat[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  // Mock print formats - in real app, this would come from API
  useEffect(() => {
    const mockFormats: PrintFormat[] = [
      {
        id: "1",
        organization_id: "org1",
        name: "Standard Invoice",
        type: "sale_invoice",
        template_data: {
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
        },
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
          paper_size: "thermal_80mm",
          orientation: "portrait",
          margins: { top: 5, right: 5, bottom: 5, left: 5 },
          header: {
            show_logo: false,
            logo_position: "center",
            company_name_size: 16,
            show_address: true,
            show_contact: true,
            show_gstin: false,
            custom_text: "",
          },
          body: {
            show_item_code: false,
            show_hsn: false,
            show_unit: true,
            show_discount: true,
            show_tax_breakup: false,
            item_description_lines: 1,
            font_size: 10,
          },
          footer: {
            show_terms: false,
            show_signature: false,
            show_bank_details: false,
            custom_footer: "Thank you for your business!",
            show_amount_in_words: false,
          },
          colors: {
            header_bg: "#000000",
            header_text: "#ffffff",
            table_header_bg: "#ffffff",
            table_header_text: "#000000",
            border_color: "#000000",
          },
        },
        is_default: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        organization_id: "org1",
        name: "Minimal Invoice",
        type: "sale_invoice",
        template_data: {
          paper_size: "A4",
          orientation: "portrait",
          margins: { top: 15, right: 15, bottom: 15, left: 15 },
          header: {
            show_logo: true,
            logo_position: "right",
            company_name_size: 20,
            show_address: true,
            show_contact: true,
            show_gstin: true,
            custom_text: "",
          },
          body: {
            show_item_code: false,
            show_hsn: true,
            show_unit: true,
            show_discount: false,
            show_tax_breakup: true,
            item_description_lines: 1,
            font_size: 11,
          },
          footer: {
            show_terms: true,
            show_signature: true,
            show_bank_details: false,
            custom_footer: "",
            show_amount_in_words: true,
          },
          colors: {
            header_bg: "#f8f9fa",
            header_text: "#212529",
            table_header_bg: "#e9ecef",
            table_header_text: "#495057",
            border_color: "#dee2e6",
          },
        },
        is_default: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Filter formats by document type
    const filteredFormats = mockFormats.filter(format => format.type === documentType);
    setPrintFormats(filteredFormats);

    // Set default format
    const defaultFormat = filteredFormats.find(f => f.is_default);
    if (defaultFormat) {
      setSelectedFormatId(defaultFormat.id);
    }
  }, [documentType]);

  const selectedFormat = printFormats.find(f => f.id === selectedFormatId);

  const handlePrint = () => {
    if (selectedFormatId && onPrint) {
      onPrint(selectedFormatId);
    }
  };

  const handlePreview = () => {
    if (selectedFormatId && onPreview) {
      onPreview(selectedFormatId);
    } else {
      setShowPreview(true);
    }
  };

  const getFormatDescription = (format: PrintFormat) => {
    const { template_data } = format;
    return `${template_data.paper_size} • ${template_data.orientation} • ${template_data.body.font_size}pt`;
  };

  return (
    <div className={className}>
      <Card className="glass border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Print Format</Label>
            </div>

            <div className="space-y-3">
              <Select value={selectedFormatId} onValueChange={setSelectedFormatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select print format" />
                </SelectTrigger>
                <SelectContent>
                  {printFormats.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="font-medium">{format.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getFormatDescription(format)}
                          </p>
                        </div>
                        {format.is_default && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedFormat && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">{selectedFormat.name}</h4>
                    {selectedFormat.is_default && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {getFormatDescription(selectedFormat)}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePreview}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={handlePrint}
                      className="flex-1 holographic text-white"
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  // This would navigate to print format management
                  window.open('/settings?tab=print-formats', '_blank');
                }}
              >
                <Settings className="h-3 w-3 mr-1" />
                Manage Print Formats
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Print Preview - {selectedFormat?.name}
            </DialogTitle>
            <DialogDescription>
              Preview of how your document will look when printed
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-white p-8 border rounded-lg min-h-[600px] overflow-auto">
            {selectedFormat && (
              <PrintPreview format={selectedFormat} />
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={handlePrint} className="holographic text-white">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple print preview component
function PrintPreview({ format }: { format: PrintFormat }) {
  const { template_data } = format;

  return (
    <div 
      className="print-preview"
      style={{
        fontSize: `${template_data.body.font_size}px`,
        color: '#000',
        fontFamily: 'Arial, sans-serif',
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