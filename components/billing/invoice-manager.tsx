"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Archive } from "lucide-react";
import { SavedInvoicesDialog } from "./saved-invoices-dialog";

interface InvoiceManagerProps {
  organizationId: string;
}

export function InvoiceManager({ organizationId }: InvoiceManagerProps) {
  const [showSavedInvoices, setShowSavedInvoices] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowSavedInvoices(true)}
        className="holographic text-white border-0 shadow-md"
      >
        <Archive className="h-4 w-4 mr-2" />
        Saved Invoices
      </Button>

      <SavedInvoicesDialog
        open={showSavedInvoices}
        onOpenChange={setShowSavedInvoices}
        organizationId={organizationId}
      />
    </>
  );
}