"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Share2, Mail, Cloud, CheckCircle } from "lucide-react";
import type { Organization, Customer, BillItem } from "@/lib/types";
import { formatCurrency, numberToWords } from "@/lib/types";
import { useReactToPrint } from "react-to-print";
import { PDFGenerator } from "@/lib/pdf-generator";
import { InvoiceStorageService } from "@/lib/supabase/storage";
import { toast } from "sonner";

interface InvoicePrintDialogProps {
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
    format: "thermal" | "a4";
}

export function InvoicePrintDialog({
    open,
    onOpenChange,
    organization,
    invoiceNumber,
    date,
    customer,
    items,
    totals,
    format,
}: InvoicePrintDialogProps) {
    const componentRef = useRef<HTMLDivElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploaded, setIsUploaded] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
    });

    const handleDownloadPDF = async () => {
        if (!componentRef.current) return;

        try {
            const filename = `Invoice_${invoiceNumber}_${new Date(date).toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`;
            await PDFGenerator.downloadPDF(componentRef.current, filename, { format });
            toast.success("PDF downloaded successfully!");
        } catch (error) {
            console.error('Download error:', error);
            toast.error("Failed to download PDF");
        }
    };

    const handleSaveToCloud = async () => {
        if (!componentRef.current) return;

        setIsUploading(true);
        try {
            // Generate PDF blob
            const pdfBlob = await PDFGenerator.generatePDFFromElement(componentRef.current, { format });

            // Upload to Supabase Storage
            const result = await InvoiceStorageService.uploadInvoicePDF(pdfBlob, {
                invoiceNumber,
                customerName: customer?.name || 'Walk-in Customer',
                totalAmount: totals.roundedTotal,
                invoiceDate: date,
                organizationId: organization.id,
            });

            if (result.success) {
                setIsUploaded(true);
                toast.success("Invoice saved to cloud successfully!");
            } else {
                toast.error(result.error || "Failed to save invoice to cloud");
            }
        } catch (error) {
            console.error('Cloud save error:', error);
            toast.error("Failed to save invoice to cloud");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`${format === 'a4' ? 'max-w-4xl' : 'max-w-sm'} max-h-[90vh] overflow-y-auto glass border-0 shadow-2xl p-0`}>
                <div className="sticky top-0 z-10 flex justify-end gap-2 p-4 bg-white/10 backdrop-blur-md border-b border-white/10 no-print">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="holographic text-white border-0 shadow-md">
                        <Printer className="h-4 w-4 mr-2" />
                        Print Invoice
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="holographic text-white border-0 shadow-md">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveToCloud}
                        disabled={isUploading || isUploaded}
                        className="holographic text-white border-0 shadow-md"
                    >
                        {isUploading ? (
                            <>
                                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                                Saving...
                            </>
                        ) : isUploaded ? (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Saved to Cloud
                            </>
                        ) : (
                            <>
                                <Cloud className="h-4 w-4 mr-2" />
                                Save to Cloud
                            </>
                        )}
                    </Button>
                </div>

                <div className="p-6 bg-white/95">
                    <div ref={componentRef} className="bg-white text-black p-4">
                        {format === 'thermal' ? (
                            // Thermal Layout (80mm)
                            <div className="font-mono text-xs space-y-2 max-w-[80mm] mx-auto">
                                <div className="text-center space-y-1">
                                    <div className="font-bold text-sm">{organization.name}</div>
                                    {organization.address && <div>{organization.address}</div>}
                                    {organization.phone && <div>Ph: {organization.phone}</div>}
                                    {organization.gstin && <div>GSTIN: {organization.gstin}</div>}
                                </div>
                                <div className="border-b border-dashed border-gray-400 my-2"></div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span>Inv: {invoiceNumber}</span>
                                        <span>{new Date(date).toLocaleDateString("en-IN")}</span>
                                    </div>
                                    {customer && (
                                        <div>
                                            <div>Cust: {customer.name}</div>
                                            {customer.phone && <div>Ph: {customer.phone}</div>}
                                        </div>
                                    )}
                                </div>
                                <div className="border-b border-dashed border-gray-400 my-2"></div>
                                <div className="space-y-1">
                                    {items.map((item, index) => (
                                        <div key={index} className="space-y-1">
                                            <div className="font-medium">{item.item.name}</div>
                                            <div className="flex justify-between text-xs">
                                                <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                                                <span>{formatCurrency(item.total)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-b border-dashed border-gray-400 my-2"></div>
                                <div className="space-y-1">
                                    <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(totals.subtotal)}</span></div>
                                    {totals.discountAmount > 0 && (
                                        <div className="flex justify-between"><span>Discount:</span><span>-{formatCurrency(totals.discountAmount)}</span></div>
                                    )}
                                    {totals.isIGST ? (
                                        <div className="flex justify-between"><span>IGST:</span><span>{formatCurrency(totals.igst)}</span></div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between"><span>CGST:</span><span>{formatCurrency(totals.cgst)}</span></div>
                                            <div className="flex justify-between"><span>SGST:</span><span>{formatCurrency(totals.sgst)}</span></div>
                                        </>
                                    )}
                                    <div className="border-t border-gray-400 pt-1 flex justify-between font-bold text-sm">
                                        <span>TOTAL:</span>
                                        <span>{formatCurrency(totals.roundedTotal)}</span>
                                    </div>
                                </div>
                                <div className="border-b border-dashed border-gray-400 my-2"></div>
                                <div className="text-center text-xs">
                                    <div>Thank you for your business!</div>
                                </div>
                            </div>
                        ) : (
                            // A4 Layout
                            <div className="font-sans text-sm space-y-6 p-8 min-h-[1000px] border border-gray-100">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                                        <div className="text-gray-600 mt-2 space-y-1">
                                            <p>{organization.address}</p>
                                            <p>Phone: {organization.phone} | Email: {organization.email}</p>
                                            {organization.gstin && <p className="font-semibold">GSTIN: {organization.gstin}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">TAX INVOICE</h2>
                                        <div className="space-y-1 text-gray-600">
                                            <p><span className="font-semibold text-gray-800">Invoice #:</span> {invoiceNumber}</p>
                                            <p><span className="font-semibold text-gray-800">Date:</span> {new Date(date).toLocaleDateString("en-IN")}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-200" />

                                {/* Bill To */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="uppercase tracking-wider text-xs font-bold text-gray-500 mb-4">Bill To</h3>
                                        {customer ? (
                                            <div className="space-y-1 text-gray-800">
                                                <p className="font-bold text-lg">{customer.name}</p>
                                                <p>{customer.address}</p>
                                                <p>Ph: {customer.phone}</p>
                                                {customer.gst_number && <p>GSTIN: {customer.gst_number}</p>}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">Walk-in Customer</p>
                                        )}
                                    </div>
                                </div>

                                {/* Items Table */}
                                <table className="w-full border-collapse rounded-lg overflow-hidden">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-700 border-b border-gray-200">
                                            <th className="py-3 px-4 text-left w-12 font-semibold">#</th>
                                            <th className="py-3 px-4 text-left font-semibold">Item Description</th>
                                            <th className="py-3 px-4 text-left w-24 font-semibold">HSN</th>
                                            <th className="py-3 px-4 text-right w-24 font-semibold">Qty</th>
                                            <th className="py-3 px-4 text-right w-32 font-semibold">Rate</th>
                                            <th className="py-3 px-4 text-right w-24 font-semibold">Disc</th>
                                            <th className="py-3 px-4 text-right w-32 font-bold">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-3 px-4 text-center text-gray-500">{index + 1}</td>
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-gray-900">{item.item.name}</p>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">{item.item.hsn_code || '-'}</td>
                                                <td className="py-3 px-4 text-right text-gray-800">{item.quantity} {item.item.unit_type}</td>
                                                <td className="py-3 px-4 text-right text-gray-800">{formatCurrency(item.unit_price)}</td>
                                                <td className="py-3 px-4 text-right text-gray-600">{item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}</td>
                                                <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totals Section */}
                                <div className="flex justify-end pt-4">
                                    <div className="w-5/12 space-y-3">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span className="font-medium text-gray-900">{formatCurrency(totals.subtotal)}</span>
                                        </div>

                                        {totals.discountAmount > 0 && (
                                            <div className="flex justify-between text-emerald-600">
                                                <span>Discount Amount</span>
                                                <span>-{formatCurrency(totals.discountAmount)}</span>
                                            </div>
                                        )}

                                        <div className="border-t border-gray-100 my-2"></div>

                                        {totals.isIGST ? (
                                            <div className="flex justify-between text-gray-600">
                                                <span>IGST</span>
                                                <span>{formatCurrency(totals.igst)}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>CGST</span>
                                                    <span>{formatCurrency(totals.cgst)}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>SGST</span>
                                                    <span>{formatCurrency(totals.sgst)}</span>
                                                </div>
                                            </>
                                        )}

                                        {totals.roundOff !== 0 && (
                                            <div className="flex justify-between text-gray-500 text-xs">
                                                <span>Round Off</span>
                                                <span>{totals.roundOff > 0 ? "+" : ""}{totals.roundOff.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between py-4 border-t-2 border-gray-900 mt-2">
                                            <span className="text-xl font-bold text-gray-900">Grand Total</span>
                                            <span className="text-xl font-bold text-primary">{formatCurrency(totals.roundedTotal)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-8 mt-12">
                                    <div className="flex justify-between items-end">
                                        <div className="text-sm text-gray-600">
                                            <p className="font-semibold mb-1 text-gray-900">Amount in Words:</p>
                                            <p className="capitalize italic">{numberToWords(totals.roundedTotal)} only</p>
                                        </div>
                                        <div className="text-center text-sm">
                                            <div className="h-16 w-32 mb-2"></div>
                                            <p className="font-bold border-t-2 border-gray-300 pt-2 px-8 text-gray-800">Authorized Signature</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center text-xs text-gray-400 mt-12 pt-8">
                                    <p>Terms & Conditions Apply</p>
                                    <p>Thank you for your business!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
