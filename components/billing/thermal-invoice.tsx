"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatCurrency,
  numberToWords,
  type Organization,
  type Customer,
  type BillItem,
} from "@/lib/types";
import { Printer, Share2, X } from "lucide-react";

interface ThermalInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
  invoiceNumber: string;
  date: string;
  customer: Customer | null;
  items: BillItem[];
  totals: {
    subtotal: number;
    discountAmount: number;
    discountPercent: number;
    cgst: number;
    sgst: number;
    igst: number;
    roundOff: number;
    roundedTotal: number;
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
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceNumber}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              width: 80mm;
              margin: 0 auto;
              padding: 5mm;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider {
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
            }
            .item-row {
              margin: 4px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            td, th {
              padding: 2px 0;
              font-size: 11px;
            }
            .total-row td {
              padding-top: 4px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoiceNumber}`,
          text: `Invoice from ${organization.name}\nAmount: ${formatCurrency(totals.roundedTotal)}`,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice</span>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Thermal Invoice Layout */}
        <div
          ref={invoiceRef}
          className="font-mono text-xs leading-relaxed bg-white p-4 border rounded"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          {/* Header */}
          <div className="text-center mb-3">
            <p className="font-bold text-sm">{organization.name}</p>
            {organization.address && <p>{organization.address}</p>}
            {organization.phone && <p>Ph: {organization.phone}</p>}
            {organization.gstin && <p>GSTIN: {organization.gstin}</p>}
          </div>

          <div className="border-t border-dashed border-foreground/30 my-2" />

          {/* Invoice Details */}
          <div className="mb-2">
            <div className="flex justify-between">
              <span>Invoice No:</span>
              <span className="font-bold">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>
                {new Date(date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>
                {new Date(date).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Customer */}
          {customer && (
            <>
              <div className="border-t border-dashed border-foreground/30 my-2" />
              <div className="mb-2">
                <p className="font-bold">{customer.name}</p>
                {customer.phone && <p>Ph: {customer.phone}</p>}
                {customer.gst_number && <p>GSTIN: {customer.gst_number}</p>}
              </div>
            </>
          )}

          <div className="border-t border-dashed border-foreground/30 my-2" />

          {/* Items */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-dashed border-foreground/30">
                <th className="text-left py-1">Item</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Amt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="py-1">
                    <div>{item.item.name.slice(0, 15)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      GST: {item.gst_rate}%
                    </div>
                  </td>
                  <td className="text-right align-top">{item.quantity}</td>
                  <td className="text-right align-top">{item.unit_price.toFixed(0)}</td>
                  <td className="text-right align-top">{item.subtotal.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-foreground/30 my-2" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount ({totals.discountPercent}%):</span>
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
                <span>
                  {totals.roundOff > 0 ? "+" : ""}
                  {totals.roundOff.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-foreground/30 my-2" />

          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>{formatCurrency(totals.roundedTotal)}</span>
          </div>

          {/* Amount in words */}
          <div className="mt-2 text-[10px]">
            <p className="italic">{numberToWords(totals.roundedTotal)}</p>
          </div>

          <div className="border-t border-dashed border-foreground/30 my-3" />

          {/* Footer */}
          <div className="text-center text-[10px]">
            <p>Thank you for your business!</p>
            <p className="mt-1">Goods once sold will not be taken back</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
