"use client";

import { CustomerLedger } from "@/components/customers/customer-ledger";
import { use } from "react";

interface CustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CustomerPage({ params }: CustomerPageProps) {
  const { id } = use(params);

  return (
    <div className="p-4 pb-24 md:pb-4">
      <CustomerLedger customerId={id} />
    </div>
  );
}