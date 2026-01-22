"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  User, 
  IndianRupee,
  ExternalLink,
  Trash2,
  RefreshCw
} from "lucide-react";
import { InvoiceStorageService } from "@/lib/supabase/storage";
import { formatCurrency } from "@/lib/types";
import { toast } from "sonner";

interface SavedInvoicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

interface InvoiceFile {
  id: string;
  invoice_number: string;
  customer_name?: string;
  total_amount: number;
  invoice_date: string;
  file_url: string;
  uploaded_at: string;
}

export function SavedInvoicesDialog({
  open,
  onOpenChange,
  organizationId,
}: SavedInvoicesDialogProps) {
  const [invoices, setInvoices] = useState<InvoiceFile[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceFile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await InvoiceStorageService.listInvoices(organizationId);
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error('Load invoices error:', error);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadInvoices();
    }
  }, [open, organizationId]);

  useEffect(() => {
    const filtered = invoices.filter(invoice =>
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(filtered);
  }, [searchTerm, invoices]);

  const handleDownload = (invoice: InvoiceFile) => {
    window.open(invoice.file_url, '_blank');
  };

  const handleDelete = async (invoice: InvoiceFile) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      return;
    }

    try {
      const result = await InvoiceStorageService.deleteInvoice(
        organizationId,
        invoice.invoice_number
      );

      if (result.success) {
        toast.success("Invoice deleted successfully");
        loadInvoices(); // Refresh list
      } else {
        toast.error(result.error || "Failed to delete invoice");
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] glass border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Saved Invoices
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Refresh */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by invoice number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadInvoices}
              disabled={isLoading}
              className="holographic text-white border-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Invoices List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {searchTerm ? 'No invoices found matching your search' : 'No saved invoices found'}
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-white border-white/20">
                        {invoice.invoice_number}
                      </Badge>
                      <span className="text-sm text-gray-300">
                        {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {invoice.customer_name || 'Walk-in Customer'}
                      </div>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {formatCurrency(invoice.total_amount)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Saved {new Date(invoice.uploaded_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(invoice)}
                      className="text-white hover:bg-white/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(invoice)}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          {!isLoading && filteredInvoices.length > 0 && (
            <div className="text-sm text-gray-400 text-center pt-2 border-t border-white/10">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}