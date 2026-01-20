"use client";

import { CustomersTable } from "@/components/customers/customers-table";

export default function CustomersPage() {
  return (
    <div className="p-4 pb-24 md:pb-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground">Manage your customers and view ledgers</p>
      </div>
      <CustomersTable />
    </div>
  );
}
