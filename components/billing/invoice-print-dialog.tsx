"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, CheckCircle, Cloud } from "lucide-react";
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

    // Debug logging
    console.log('InvoicePrintDialog received items:', items);
    console.log('Items length:', items?.length || 0);

    // Keyboard shortcuts for A4 format
    useEffect(() => {
        if (!open || format !== 'a4') return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onOpenChange(false);
            } else if (event.ctrlKey || event.metaKey) {
                switch (event.key.toLowerCase()) {
                    case 'p':
                        event.preventDefault();
                        handlePrint();
                        break;
                    case 's':
                        event.preventDefault();
                        handleDownloadPDF();
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, format]);

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
            
            // Show user-friendly error and offer fallback
            toast.error("PDF generation failed. Try using the Print button instead.", {
                action: {
                    label: "Print",
                    onClick: () => handlePrint()
                }
            });
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
            toast.error("Failed to generate PDF for cloud storage. Try printing instead.", {
                action: {
                    label: "Print",
                    onClick: () => handlePrint()
                }
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`${
                format === 'a4' 
                    ? 'max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] sm:max-w-[90vw] sm:w-[90vw]' 
                    : 'max-w-sm max-h-[90vh] w-[95vw] sm:w-auto'
            } overflow-y-auto glass border-0 shadow-2xl p-0`}>
                <DialogHeader className="sr-only">
                    <DialogTitle>Invoice Preview and Print</DialogTitle>
                </DialogHeader>
                <div className={`sticky top-0 z-10 flex ${format === 'a4' ? 'flex-col sm:flex-row sm:justify-between' : 'justify-end'} gap-2 p-3 sm:p-4 bg-white/10 backdrop-blur-md border-b border-white/10 no-print`}>
                    {format === 'a4' && (
                        <div className="flex items-center justify-center sm:justify-start mb-2 sm:mb-0">
                            <h3 className="text-base sm:text-lg font-semibold text-white">Invoice Preview</h3>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                        <Button variant="outline" size={format === 'a4' ? 'sm' : 'sm'} onClick={handlePrint} className="holographic text-white border-0 shadow-md flex-1 sm:flex-none min-w-[120px]">
                            <Printer className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Print Invoice</span>
                            <span className="sm:hidden">Print</span>
                            {format === 'a4' && <span className="hidden lg:inline"> (Ctrl+P)</span>}
                        </Button>
                        <Button variant="outline" size={format === 'a4' ? 'sm' : 'sm'} onClick={handleDownloadPDF} className="holographic text-white border-0 shadow-md flex-1 sm:flex-none min-w-[120px]">
                            <Download className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Download PDF</span>
                            <span className="sm:hidden">PDF</span>
                            {format === 'a4' && <span className="hidden lg:inline"> (Ctrl+S)</span>}
                        </Button>
                        <Button
                            variant="outline"
                            size={format === 'a4' ? 'sm' : 'sm'}
                            onClick={handleSaveToCloud}
                            disabled={isUploading || isUploaded}
                            className="holographic text-white border-0 shadow-md flex-1 sm:flex-none min-w-[120px]"
                        >
                        {isUploading ? (
                            <>
                                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                                <span className="hidden sm:inline">Saving...</span>
                                <span className="sm:hidden">Save...</span>
                            </>
                        ) : isUploaded ? (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Saved to Cloud</span>
                                <span className="sm:hidden">Saved</span>
                            </>
                        ) : (
                            <>
                                <Cloud className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Save to Cloud</span>
                                <span className="sm:hidden">Cloud</span>
                            </>
                        )}
                    </Button>
                    {format === 'a4' && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onOpenChange(false)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/50 shadow-md flex-1 sm:flex-none min-w-[100px]"
                        >
                            <span className="hidden sm:inline">Close (Esc)</span>
                            <span className="sm:hidden">Close</span>
                        </Button>
                    )}
                    </div>
                </div>

                <div className={`p-0 bg-white/95 overflow-hidden flex justify-center ${format === 'a4' ? 'min-h-[calc(95vh-120px)] sm:min-h-[calc(95vh-80px)]' : ''}`}>
                    <div
                        ref={componentRef}
                        className="bg-white text-black transition-all origin-top"
                        style={{
                            width: format === 'thermal' ? '78mm' : '210mm',
                            padding: format === 'thermal' ? '4mm' : '20mm',
                            minHeight: format === 'thermal' ? 'auto' : '297mm',
                            margin: '0 auto',
                            transform: format === 'a4' ? 'scale(0.8) sm:scale(1) lg:scale(1.2)' : 'scale(1)',
                            transformOrigin: 'top center'
                        }}
                    >
                        {format === 'thermal' ? (
                            // Thermal Layout (80mm)
                            <div className="font-mono text-xs space-y-2 w-full">
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
                            <div className="font-sans text-sm space-y-6 h-full">
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
