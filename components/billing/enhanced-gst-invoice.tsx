"use client";

import { forwardRef } from "react";
import type { Organization, Customer, BillItem, BankDetails } from "@/lib/types";
import { formatCurrency, numberToWords } from "@/lib/types";

interface EnhancedGSTInvoiceProps {
  organization: Organization;
  invoiceNumber: string;
  date: string;
  customer?: Customer | null;
  items: BillItem[] | any[]; // Allow any[] to handle both BillItem and EnhancedBillItem
  totals: {
    subtotal: number;
    discountAmount: number;
    discountPercent?: number; // Make this optional for compatibility
    cgst: number;
    sgst: number;
    igst: number;
    roundedTotal: number;
    roundOff: number;
    isIGST: boolean;
  };
  format?: "thermal" | "a4";
}

export const EnhancedGSTInvoice = forwardRef<HTMLDivElement, EnhancedGSTInvoiceProps>(
  ({ organization, invoiceNumber, date, customer, items, totals, format = "a4" }, ref) => {
    const bankDetails = organization.settings?.bank_details;

    if (format === "thermal") {
      return (
        <div
          ref={ref}
          className="bg-white text-black font-mono text-xs"
          style={{
            width: '78mm',
            padding: '4mm',
            margin: '0 auto',
          }}
        >
          {/* Thermal format - simplified version */}
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
            {items && items.length > 0 ? items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="font-medium">{item.item?.name || item.name || 'Unknown Item'}</div>
                <div className="flex justify-between text-xs">
                  <span>{item.quantity || 0} x {formatCurrency(item.unit_price || 0)}</span>
                  <span>{formatCurrency(item.total || item.subtotal || 0)}</span>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500">No items</div>
            )}
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

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
      );
    }

    // A4 Format - Enhanced GST Invoice
    return (
      <div
        ref={ref}
        className="bg-white text-black font-sans text-sm block"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '10mm',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Main Border Container */}
        <div className="border-2 border-black h-full flex flex-col min-h-[277mm]">

          {/* Header Section */}
          <div className="border-b-2 border-black">
            <div className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-black mb-1 uppercase tracking-wider">{organization.name}</h1>
                  <div className="text-sm text-gray-800 space-y-1">
                    {organization.address && <p>{organization.address}</p>}
                    <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                      {organization.phone && <span>(M) {organization.phone}</span>}
                      {organization.email && <span>{organization.email}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Tax Invoice Label Strip */}
            <div className="border-t-2 border-black flex">
              <div className="flex-1 border-r-2 border-black p-1 px-2 text-sm font-bold">
                GSTIN: {organization.gstin}
              </div>
              <div className="flex-1 p-1 text-center font-bold bg-gray-100 text-black uppercase tracking-wide">
                Tax Invoice
              </div>
              <div className="flex-1 border-l-2 border-black p-1 px-2 text-right text-sm font-bold">
                Original
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="border-b-2 border-black grid grid-cols-2">
            {/* Left: Bill To */}
            <div className="p-2 border-r-2 border-black">
              <div className="text-xs font-bold mb-1 text-gray-500 uppercase">Billed To:</div>
              {customer ? (
                <div className="text-sm font-bold space-y-0.5">
                  <p className="uppercase">{customer.name}</p>
                  {customer.address && <p className="font-normal text-xs">{customer.address}</p>}
                  {customer.phone && <p className="font-normal text-xs">Ph: {customer.phone}</p>}
                  {customer.gst_number && <p className="font-normal text-xs">GSTIN: {customer.gst_number}</p>}
                </div>
              ) : (
                <p className="text-sm font-bold uppercase">Walk-in Customer</p>
              )}
            </div>

            {/* Right: Invoice Info */}
            <div className="p-2">
              <div className="grid grid-cols-2 gap-x-2 text-sm">
                <div className="font-semibold text-gray-600">Invoice No. :</div>
                <div className="font-bold">{invoiceNumber}</div>

                <div className="font-semibold text-gray-600">Date :</div>
                <div className="font-bold">{new Date(date).toLocaleDateString("en-IN")}</div>

                <div className="font-semibold text-gray-600">State Code :</div>
                <div className="font-bold">{organization.state_code || '27'}</div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-grow flex flex-col">
            <table className="w-full text-xs border-collapse h-full">
              <thead>
                <tr className="border-b-2 border-black bg-gray-50">
                  <th className="border-r-2 border-black p-2 text-center w-12 font-bold">Sr.</th>
                  <th className="border-r-2 border-black p-2 text-left font-bold">Product Description</th>
                  <th className="border-r-2 border-black p-2 text-center w-20 font-bold">HSN/SAC</th>
                  <th className="border-r-2 border-black p-2 text-center w-16 font-bold">Qty</th>
                  <th className="border-r-2 border-black p-2 text-center w-14 font-bold">Unit</th>
                  <th className="border-r-2 border-black p-2 text-right w-20 font-bold">Rate</th>
                  <th className="border-r-2 border-black p-2 text-center w-14 font-bold">GST%</th>
                  <th className="p-2 text-right w-24 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y-0">
                {items && items.length > 0 ? items.map((item, index) => (
                  <tr key={index}>
                    <td className="border-r-2 border-black p-2 text-center align-top">{index + 1}</td>
                    <td className="border-r-2 border-black p-2 align-top">
                      <div className="font-bold uppercase text-xs">{item.item?.name || item.name || 'Item'}</div>
                    </td>
                    <td className="border-r-2 border-black p-2 text-center align-top">
                      {item.item?.hsn_code || item.hsn_code || '-'}
                    </td>
                    <td className="border-r-2 border-black p-2 text-center align-top font-bold">
                      {(item.quantity || 0)}
                    </td>
                    <td className="border-r-2 border-black p-2 text-center align-top text-[10px] uppercase">
                      {item.item?.unit_type || item.unit_type || 'PCS'}
                    </td>
                    <td className="border-r-2 border-black p-2 text-right align-top">
                      {formatCurrency(item.unit_price || 0)}
                    </td>
                    <td className="border-r-2 border-black p-2 text-center align-top">
                      {(item.gst_rate || 0)}%
                    </td>
                    <td className="p-2 text-right align-top font-bold">
                      {formatCurrency(item.subtotal || item.total || 0)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500 italic border-r-2 border-black">
                      No items added to this invoice
                    </td>
                  </tr>
                )}
                {/* Visual filler to extend vertical lines if needed? 
                    User requested NO blank rows. 
                    However, without them, the vertical borders stop.
                    The image has them going down.
                    I will add ONE variable height row to fill space, but it's tricky in PDF.
                    I'll stick to NO blank rows as requested. The outer border handles the frame.
                */}
              </tbody>
            </table>
          </div>

          {/* Footer / Totals Section */}
          <div className="border-t-2 border-black">
            <div className="grid grid-cols-12">
              {/* Left Side: Bank & Terms */}
              <div className="col-span-7 border-r-2 border-black flex flex-col justify-between">
                <div className="p-2 border-b border-black">
                  <div className="font-bold text-xs uppercase underline mb-1">Total in Words</div>
                  <div className="text-xs italic pl-1">{numberToWords(totals.roundedTotal)} ONLY</div>
                </div>

                <div className="p-2 border-b border-black flex-grow">
                  <div className="font-bold text-xs uppercase underline mb-1">Bank Details</div>
                  <div className="text-xs space-y-0.5 pl-1">
                    {bankDetails ? (
                      <>
                        <div className="flex"><span className="w-20 font-semibold">Bank Name:</span> <span>{bankDetails.bank_name}</span></div>
                        <div className="flex"><span className="w-20 font-semibold">A/C No.:</span> <span>{bankDetails.account_number}</span></div>
                        <div className="flex"><span className="w-20 font-semibold">IFSC Code:</span> <span>{bankDetails.ifsc_code}</span></div>
                        {bankDetails.branch_name && <div className="flex"><span className="w-20 font-semibold">Branch:</span> <span>{bankDetails.branch_name}</span></div>}
                      </>
                    ) : (
                      <div className="italic text-gray-500">No bank details configured</div>
                    )}
                  </div>
                </div>

                <div className="p-2">
                  <div className="font-bold text-xs uppercase underline mb-1">Terms & Conditions</div>
                  <ul className="text-[10px] list-decimal pl-4 space-y-0.5 text-gray-700">
                    <li>Goods once sold will not be taken back.</li>
                    <li>Interest @ 18% p.a will be charged if payment delayed.</li>
                    <li>Subject to {organization.state_code === '27' ? 'Maharashtra' : 'local'} jurisdiction.</li>
                  </ul>
                </div>
              </div>

              {/* Right Side: Calculation */}
              <div className="col-span-12 sm:col-span-5 text-xs">
                <div className="p-1 px-2 flex justify-between border-b border-gray-300">
                  <span className="font-semibold">Sub Total</span>
                  <span className="font-bold">{formatCurrency(totals.subtotal)}</span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="p-1 px-2 flex justify-between border-b border-gray-300 text-green-700">
                    <span>Discount {totals.discountPercent ? `(${totals.discountPercent}%)` : ''}</span>
                    <span>-{formatCurrency(totals.discountAmount)}</span>
                  </div>
                )}

                {/* Tax Breakdown */}
                {totals.isIGST ? (
                  <div className="p-1 px-2 flex justify-between border-b border-gray-300">
                    <span>IGST</span>
                    <span>{formatCurrency(totals.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="p-1 px-2 flex justify-between border-b border-gray-300">
                      <span>CGST</span>
                      <span>{formatCurrency(totals.cgst)}</span>
                    </div>
                    <div className="p-1 px-2 flex justify-between border-b border-gray-300">
                      <span>SGST</span>
                      <span>{formatCurrency(totals.sgst)}</span>
                    </div>
                  </>
                )}

                {totals.roundOff !== 0 && (
                  <div className="p-1 px-2 flex justify-between border-b border-gray-300 text-gray-500">
                    <span>Round Off</span>
                    <span>{totals.roundOff > 0 ? '+' : ''}{totals.roundOff.toFixed(2)}</span>
                  </div>
                )}

                <div className="p-2 border-t-2 border-black bg-gray-100 flex justify-between items-center mt-auto">
                  <span className="font-bold text-sm uppercase">Grand Total</span>
                  <span className="font-bold text-base">{formatCurrency(totals.roundedTotal)}</span>
                </div>

                <div className="p-4 mt-8 text-center">
                  <div className="h-12 border-b border-black mb-1"></div>
                  <div className="font-bold text-[10px]">Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }
);

EnhancedGSTInvoice.displayName = "EnhancedGSTInvoice";