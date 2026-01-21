"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import type { Organization, Customer, BillItem } from "@/lib/types";
import { formatCurrency, numberToWords } from "@/lib/types";

interface ThermalInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
  invoiceNumber: string;
  date: string;
  customer?: Customer | null;
  items: BillItem[];
  totals: {
    subtotal: number;
    discountAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    roundedTotal: number;
    roundOff: number;
    isIGST: boolean;
  };
}

export function ThermalInvoice({
  open,
  onOpenChange,
  organization,
  invoiceNumber,
  date,
  customer,
  items,
  totals,
}: ThermalInvoiceProps) {
  const handlePrint = () => {
    const printContent = document.getElementById("thermal-invoice");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoiceNumber}</title>
              <style>
                body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .line { border-bottom: 1px dashed #000; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 2px 0; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <div id="thermal-invoice" className="font-mono text-xs space-y-2">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="font-bold text-sm">{organization.name}</div>
            {organization.address && <div>{organization.address}</div>}
            {organization.phone && <div>Ph: {organization.phone}</div>}
            {organization.gstin && <div>GSTIN: {organization.gstin}</div>}
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          {/* Invoice Details */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Invoice: {invoiceNumber}</span>
              <span>{new Date(date).toLocaleDateString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Time: {new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            {customer && (
              <div>
                <div>Customer: {customer.name}</div>
                {customer.phone && <div>Ph: {customer.phone}</div>}
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          {/* Items */}
          <div className="space-y-1">
            {items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="font-medium">{item.item.name}</div>
                <div className="flex justify-between text-xs">
                  <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
                {item.gst_rate > 0 && (
                  <div className="text-xs text-gray-600">
                    GST {item.gst_rate}%: {formatCurrency(item.tax_amount)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
            )}
            {totals.isIGST ? (
              <div className="flex justify-between">
                <span>IGST:</span>
                <span>{formatCurrency(totals.igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>CGST:</span>
                  <span>{formatCurrency(totals.cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST:</span>
                  <span>{formatCurrency(totals.sgst)}</span>
                </div>
              </>
            )}
            {totals.roundOff !== 0 && (
              <div className="flex justify-between">
                <span>Round Off:</span>
                <span>{totals.roundOff > 0 ? "+" : ""}{totals.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-400 pt-1">
              <div className="flex justify-between font-bold">
                <span>TOTAL:</span>
                <span>{formatCurrency(totals.roundedTotal)}</span>
              </div>
            </div>
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          {/* Amount in Words */}
          <div className="text-xs">
            <div className="font-medium">Amount in Words:</div>
            <div>{numberToWords(totals.roundedTotal)}</div>
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          {/* Footer */}
          <div className="text-center text-xs space-y-1">
            <div>Thank you for your business!</div>
            <div>Powered by Retail ERP</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}