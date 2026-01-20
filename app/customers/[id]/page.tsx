"use client";

import { use } from "react";
import { CustomerLedger } from "@/components/customers/customer-ledger";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="p-4 pb-24 md:pb-4">
      <CustomerLedger customerId={id} />
    </div>
  );
}
