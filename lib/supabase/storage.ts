import { createClient } from './server';
import { supabase } from './browser-client';

export interface InvoiceUploadData {
  invoiceNumber: string;
  customerName?: string;
  totalAmount: number;
  invoiceDate: string;
  organizationId: string;
}

export class InvoiceStorageService {
  private static BUCKET_NAME = 'invoices';

  /**
   * Upload invoice PDF to Supabase Storage (Client-side)
   */
  static async uploadInvoicePDF(
    pdfBlob: Blob,
    invoiceData: InvoiceUploadData
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Generate file path: org_id/year/month/invoice_number.pdf
      const date = new Date(invoiceData.invoiceDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const fileName = `${invoiceData.invoiceNumber}.pdf`;
      const filePath = `${invoiceData.organizationId}/${year}/${month}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true, // Replace if exists
        });

      if (error) {
        console.error('Storage upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      // Store invoice metadata in database
      await this.saveInvoiceMetadata(invoiceData, filePath, urlData.publicUrl);

      return { 
        success: true, 
        url: urlData.publicUrl 
      };
    } catch (error) {
      console.error('Invoice upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save invoice metadata to database (Client-side)
   */
  private static async saveInvoiceMetadata(
    invoiceData: InvoiceUploadData,
    filePath: string,
    publicUrl: string
  ) {
    const { error } = await supabase
      .from('invoice_files')
      .upsert({
        invoice_number: invoiceData.invoiceNumber,
        organization_id: invoiceData.organizationId,
        customer_name: invoiceData.customerName,
        total_amount: invoiceData.totalAmount,
        invoice_date: invoiceData.invoiceDate,
        file_path: filePath,
        file_url: publicUrl,
        uploaded_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Database save error:', error);
      throw error;
    }
  }

  /**
   * Get invoice file URL (Client-side)
   */
  static async getInvoiceUrl(
    organizationId: string,
    invoiceNumber: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('invoice_files')
        .select('file_url')
        .eq('organization_id', organizationId)
        .eq('invoice_number', invoiceNumber)
        .single();

      if (error || !data) {
        return null;
      }

      return data.file_url;
    } catch (error) {
      console.error('Get invoice URL error:', error);
      return null;
    }
  }

  /**
   * List all invoices for an organization (Client-side)
   */
  static async listInvoices(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('invoice_files')
        .select('*')
        .eq('organization_id', organizationId)
        .order('invoice_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('List invoices error:', error);
      return [];
    }
  }

  /**
   * Delete invoice file (Client-side)
   */
  static async deleteInvoice(
    organizationId: string,
    invoiceNumber: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get file path first
      const { data: fileData } = await supabase
        .from('invoice_files')
        .select('file_path')
        .eq('organization_id', organizationId)
        .eq('invoice_number', invoiceNumber)
        .single();

      if (fileData?.file_path) {
        // Delete from storage
        await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([fileData.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('invoice_files')
        .delete()
        .eq('organization_id', organizationId)
        .eq('invoice_number', invoiceNumber);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Delete invoice error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}