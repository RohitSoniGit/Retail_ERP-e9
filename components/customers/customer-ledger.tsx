"use client";

import { useState } from "react";
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
import { formatCurrency, type Customer, type LedgerEntry } from "@/lib/types";
import { ArrowLeft, Phone, MapPin, CreditCard, Loader2 } from "lucide-react";
import { ReceivePaymentDialog } from "./receive-payment-dialog";
import Link from "next/link";

interface CustomerLedgerProps {
  customerId: string;
}

export function CustomerLedger({ customerId }: CustomerLedgerProps) {
  const { organizationId } = useOrganization();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: customer, isLoading: loadingCustomer, mutate: mutateCustomer } = useSWR(
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

  const { data: ledgerEntries, isLoading: loadingLedger, mutate: mutateLedger } = useSWR(
    customerId && organizationId ? `ledger-${customerId}` : null,
    async () => {
      // Fetch sales
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .eq("customer_id", customerId)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      // Fetch vouchers
      const { data: vouchers, error: vouchersError } = await supabase
        .from("vouchers")
        .select("*")
        .eq("party_id", customerId)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (vouchersError) throw vouchersError;

      // Combine and create ledger entries
      const entries: LedgerEntry[] = [];
      let runningBalance = 0;

      // Add opening balance if any
      if (customer && customer.current_balance !== 0) {
        const totalSales = sales?.reduce((sum, s) => sum + (s.is_credit ? s.total_amount : 0), 0) || 0;
        const totalPayments = vouchers?.filter(v => v.voucher_type === "receipt").reduce((sum, v) => sum + v.amount, 0) || 0;
        const openingBalance = customer.current_balance - totalSales + totalPayments;
        
        if (openingBalance !== 0) {
          entries.push({
            id: "opening",
            date: customer.created_at.split("T")[0],
            type: "opening",
            description: "Opening Balance",
            debit: openingBalance > 0 ? openingBalance : 0,
            credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
            balance: openingBalance,
          });
          runningBalance = openingBalance;
        }
      }

      // Add all transactions
      const allTransactions = [
        ...(sales?.map(s => ({
          ...s,
          transaction_type: "sale" as const,
          date: s.created_at,
        })) || []),
        ...(vouchers?.map(v => ({
          ...v,
          transaction_type: v.voucher_type as const,
          date: v.created_at,
        })) || []),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      allTransactions.forEach((transaction) => {
        let debit = 0;
        let credit = 0;
        let description = "";

        if (transaction.transaction_type === "sale") {
          const sale = transaction as any;
          if (sale.is_credit) {
            debit = sale.total_amount;
            description = `Sale: ${sale.invoice_number}`;
          }
        } else if (transaction.transaction_type === "receipt") {
          const voucher = transaction as any;
          credit = voucher.amount;
          description = `Payment: ${voucher.voucher_number}`;
        }

        if (debit > 0 || credit > 0) {
          runningBalance += debit - credit;
          entries.push({
            id: transaction.id,
            date: transaction.date.split("T")[0],
            type: transaction.transaction_type,
            description,
            debit,
            credit,
            balance: runningBalance,
            reference_id: transaction.id,
          });
        }
      });

      return entries.reverse(); // Show latest first
    }
  );

  const handlePaymentSuccess = () => {
    mutateCustomer();
    mutateLedger();
    setShowPaymentDialog(false);
  };

  if (!organizationId) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  if (loadingCustomer) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found</p>
        <Link href="/customers">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Customer Ledger</h1>
      </div>

      {/* Customer Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{customer.name}</h2>
                <Badge variant="outline" className="text-xs">
                  {customer.customer_type}
                </Badge>
              </div>
              
              {customer.phone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </div>
              )}
              
              {customer.address && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {customer.address}
                </div>
              )}
              
              {customer.credit_limit > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CreditCard className="h-3 w-3" />
                  Credit Limit: {formatCurrency(customer.credit_limit)}
                </div>
              )}
            </div>

            <div className="text-right space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className={`text-2xl font-bold ${
                  customer.current_balance > 0 ? "text-red-600" : "text-emerald-600"
                }`}>
                  {customer.current_balance > 0 ? "Due: " : "Advance: "}
                  {formatCurrency(Math.abs(customer.current_balance))}
                </p>
              </div>
              
              {customer.current_balance > 0 && (
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  Receive Payment
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLedger ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerEntries?.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {new Date(entry.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{entry.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {entry.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        entry.balance > 0 ? "text-red-600" : "text-emerald-600"
                      }`}>
                        {formatCurrency(Math.abs(entry.balance))}
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
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}