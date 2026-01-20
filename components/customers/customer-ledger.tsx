"use client";

import { createBrowserClient } from "@supabase/ssr";
import useSWR from "swr";
import { useOrganization } from "@/lib/context/organization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, type Customer, type Sale, type Voucher } from "@/lib/types";
import { ArrowLeft, Phone, MapPin, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { ReceivePaymentDialog } from "./receive-payment-dialog";
import { useState } from "react";

interface CustomerLedgerProps {
  customerId: string;
}

interface LedgerEntry {
  id: string;
  date: string;
  type: "sale" | "payment" | "opening";
  description: string;
  debit: number;
  credit: number;
  reference?: string;
}

export function CustomerLedger({ customerId }: CustomerLedgerProps) {
  const { organizationId } = useOrganization();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: customer, isLoading: loadingCustomer } = useSWR(
    customerId ? `customer-${customerId}` : null,
    async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (error) throw error;
      return data as Customer;
    }
  );

  const { data: ledgerData, isLoading: loadingLedger, mutate } = useSWR(
    customerId && organizationId ? `ledger-${customerId}` : null,
    async () => {
      // Fetch credit sales for this customer
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true });

      if (salesError) throw salesError;

      // Fetch payment vouchers for this customer
      const { data: vouchers, error: vouchersError } = await supabase
        .from("vouchers")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("party_id", customerId)
        .eq("voucher_type", "receipt")
        .order("voucher_date", { ascending: true });

      if (vouchersError) throw vouchersError;

      // Build ledger entries
      const entries: LedgerEntry[] = [];

      // Add sales (debit entries - money owed to us)
      (sales as Sale[])?.forEach((sale) => {
        if (sale.is_credit && sale.credit_amount > 0) {
          entries.push({
            id: sale.id,
            date: sale.created_at,
            type: "sale",
            description: `Invoice ${sale.invoice_number}`,
            debit: sale.credit_amount,
            credit: 0,
            reference: sale.invoice_number,
          });
        }
      });

      // Add payments (credit entries - money received)
      (vouchers as Voucher[])?.forEach((voucher) => {
        entries.push({
          id: voucher.id,
          date: voucher.voucher_date,
          type: "payment",
          description: voucher.narration || `Receipt ${voucher.voucher_number}`,
          debit: 0,
          credit: voucher.amount,
          reference: voucher.voucher_number,
        });
      });

      // Sort by date
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return entries;
    }
  );

  // Calculate running balance
  let runningBalance = 0;
  const entriesWithBalance = ledgerData?.map((entry) => {
    runningBalance += entry.debit - entry.credit;
    return { ...entry, balance: runningBalance };
  });

  if (!organizationId || loadingCustomer) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 text-center text-muted-foreground">Customer not found</div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "wholesale":
        return "bg-blue-100 text-blue-700";
      case "distributor":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Link href="/customers">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      {/* Customer Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {customer.name}
                <Badge variant="outline" className={getTypeColor(customer.customer_type)}>
                  {customer.customer_type}
                </Badge>
              </CardTitle>
              {customer.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </p>
              )}
              {customer.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {customer.address}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Balance Due</p>
              <p className={`text-xl font-bold ${customer.current_balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {formatCurrency(customer.current_balance)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => setShowPaymentDialog(true)}>
              Receive Payment
            </Button>
            <Link href={`/billing?customer=${customerId}`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                <FileText className="h-4 w-4 mr-1" />
                New Bill
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Account Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLedger ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[90px]">Date</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead className="text-right w-[80px]">Debit</TableHead>
                  <TableHead className="text-right w-[80px]">Credit</TableHead>
                  <TableHead className="text-right w-[90px]">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entriesWithBalance?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  entriesWithBalance?.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">
                        {new Date(entry.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{entry.description}</p>
                        {entry.reference && (
                          <p className="text-xs text-muted-foreground">{entry.reference}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                      </TableCell>
                      <TableCell className={`text-right text-sm font-medium ${entry.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {formatCurrency(Math.abs(entry.balance))}
                        <span className="text-xs ml-1">{entry.balance > 0 ? "Dr" : "Cr"}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Receive Payment Dialog */}
      <ReceivePaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        customer={customer}
        onSuccess={() => {
          mutate();
          setShowPaymentDialog(false);
        }}
      />
    </div>
  );
}
