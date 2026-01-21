"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Share2, Mail } from "lucide-react";
import type { Organization, Customer, BillItem } from "@/lib/types";
import { formatCurrency, numberToWords } from "@/lib/types";
import { useReactToPrint } from "react-to-print";

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

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`${format === 'a4' ? 'max-w-4xl' : 'max-w-sm'} max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-end gap-2 mb-4 no-print">
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                </div>

                <div ref={componentRef} className="bg-white p-4 text-black">
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
                        <div className="font-sans text-sm space-y-6 p-8 min-h-[1000px]">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-primary">{organization.name}</h1>
                                    <div className="text-gray-600 mt-2 space-y-1">
                                        <p>{organization.address}</p>
                                        <p>Phone: {organization.phone} | Email: {organization.email}</p>
                                        {organization.gstin && <p className="font-semibold">GSTIN: {organization.gstin}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-xl font-semibold mb-2">TAX INVOICE</h2>
                                    <div className="space-y-1">
                                        <p><span className="font-medium">Invoice #:</span> {invoiceNumber}</p>
                                        <p><span className="font-medium">Date:</span> {new Date(date).toLocaleDateString("en-IN")}</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            {/* Bill To */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
                                    {customer ? (
                                        <div className="space-y-1">
                                            <p className="font-bold">{customer.name}</p>
                                            <p>{customer.address}</p>
                                            <p>Ph: {customer.phone}</p>
                                            {customer.gst_number && <p>GSTIN: {customer.gst_number}</p>}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground italic">Walk-in Customer</p>
                                    )}
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-700">
                                        <th className="border p-2 text-left w-12">#</th>
                                        <th className="border p-2 text-left">Item Description</th>
                                        <th className="border p-2 text-left w-24">HSN</th>
                                        <th className="border p-2 text-right w-24">Qty</th>
                                        <th className="border p-2 text-right w-32">Rate</th>
                                        <th className="border p-2 text-right w-24">Disc</th>
                                        <th className="border p-2 text-right w-32">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="border p-2 text-center">{index + 1}</td>
                                            <td className="border p-2">
                                                <p className="font-medium">{item.item.name}</p>
                                            </td>
                                            <td className="border p-2">{item.item.hsn_code || '-'}</td>
                                            <td className="border p-2 text-right">{item.quantity} {item.item.unit_type}</td>
                                            <td className="border p-2 text-right">{formatCurrency(item.unit_price)}</td>
                                            <td className="border p-2 text-right">{item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}</td>
                                            <td className="border p-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                    {/* Empty rows to fill space if needed */}
                                </tbody>
                            </table>

                            {/* Totals Section */}
                            <div className="flex justify-end">
                                <div className="w-1/2 space-y-2">
                                    <div className="flex justify-between py-1 border-b border-gray-100">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                                    </div>

                                    {totals.discountAmount > 0 && (
                                        <div className="flex justify-between py-1 border-b border-gray-100">
                                            <span className="text-gray-600">Discount Amount</span>
                                            <span className="text-emerald-600">-{formatCurrency(totals.discountAmount)}</span>
                                        </div>
                                    )}

                                    {totals.isIGST ? (
                                        <div className="flex justify-between py-1 border-b border-gray-100">
                                            <span className="text-gray-600">IGST</span>
                                            <span>{formatCurrency(totals.igst)}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between py-1 border-b border-gray-100">
                                                <span className="text-gray-600">CGST</span>
                                                <span>{formatCurrency(totals.cgst)}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-gray-100">
                                                <span className="text-gray-600">SGST</span>
                                                <span>{formatCurrency(totals.sgst)}</span>
                                            </div>
                                        </>
                                    )}

                                    {totals.roundOff !== 0 && (
                                        <div className="flex justify-between py-1 border-b border-gray-100">
                                            <span className="text-gray-600">Round Off</span>
                                            <span>{totals.roundOff > 0 ? "+" : ""}{totals.roundOff.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between py-3 border-t-2 border-gray-300">
                                        <span className="text-lg font-bold">Grand Total</span>
                                        <span className="text-lg font-bold">{formatCurrency(totals.roundedTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-8">
                                <div className="flex justify-between items-end">
                                    <div className="text-sm text-gray-600">
                                        <p className="font-semibold mb-1">Amount in Words:</p>
                                        <p className="capitalize">{numberToWords(totals.roundedTotal)} only</p>
                                    </div>
                                    <div className="text-center text-sm">
                                        <div className="h-16 w-32 mb-2"></div>
                                        <p className="font-medium border-t border-gray-400 pt-1 px-4">Authorized Signature</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-xs text-muted-foreground mt-8 pt-8">
                                <p>Terms & Conditions Apply</p>
                                <p>Thank you for your business!</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
