"use client";

import { CustomerLedger } from "@/components/customers/customer-ledger";

interface CustomerPageProps {
  params: {
    id: string;
  };
}

export default function CustomerPage({ params }: CustomerPageProps) {
  return (
    <div className="p-4 pb-24 md:pb-4">
      <CustomerLedger customerId={params.id} />
    </div>
  );
}