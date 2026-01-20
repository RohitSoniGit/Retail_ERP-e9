"use client";

import { VouchersList } from "@/components/vouchers/vouchers-list";

export default function VouchersPage() {
  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Vouchers</h1>
        <p className="text-sm text-muted-foreground">Manage receipts and payments</p>
      </div>
      <VouchersList />
    </div>
  );
}
