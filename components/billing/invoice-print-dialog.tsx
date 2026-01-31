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
import { EnhancedGSTInvoice } from "./enhanced-gst-invoice";
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
                    <EnhancedGSTInvoice
                        ref={componentRef}
                        organization={organization}
                        invoiceNumber={invoiceNumber}
                        date={date}
                        customer={customer}
                        items={items}
                        totals={totals}
                        format={format}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
