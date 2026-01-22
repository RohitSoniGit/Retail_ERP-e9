import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('invoice_files')
      .select('*')
      .eq('organization_id', organizationId)
      .order('invoice_date', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoices: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const invoiceNumber = searchParams.get('invoiceNumber');

    if (!organizationId || !invoiceNumber) {
      return NextResponse.json(
        { error: 'Organization ID and Invoice Number are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get file path first
    const { data: fileData } = await supabase
      .from('invoice_files')
      .select('file_path')
      .eq('organization_id', organizationId)
      .eq('invoice_number', invoiceNumber)
      .single();

    if (fileData?.file_path) {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('invoices')
        .remove([fileData.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('invoice_files')
      .delete()
      .eq('organization_id', organizationId)
      .eq('invoice_number', invoiceNumber);

    if (error) {
      console.error('Database delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}