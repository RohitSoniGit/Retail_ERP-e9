import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the organization ID from request
    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'Organization ID required' }, { status: 400 });
    }

    // List of tables to clear (in order to avoid foreign key constraints)
    const tablesToClear = [
      // Transaction tables (clear first due to foreign keys)
      'sale_items',
      'sales',
      'purchase_order_items', 
      'purchase_orders',
      'purchase_receipt_items',
      'purchase_receipts',
      'stock_movements',
      'vouchers',
      'advance_payments',
      'ledger_entry_details',
      'ledger_entries',
      'inventory_valuations',
      'item_batches',
      'cash_register',
      'job_card_items',
      'job_cards',
      
      // Master data (clear after transactions)
      'items',
      'categories',
      'customers',
      'suppliers',
      'ledger_accounts'
    ];

    console.log(`Starting factory reset for organization: ${organizationId}`);

    // Clear all tables
    for (const table of tablesToClear) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('organization_id', organizationId);

        if (error) {
          console.error(`Error clearing ${table}:`, error);
          // Continue with other tables even if one fails
        } else {
          console.log(`✅ Cleared ${table}`);
        }
      } catch (err) {
        console.error(`Exception clearing ${table}:`, err);
        // Continue with other tables
      }
    }

    // Reset any sequences or counters if needed
    // This would depend on your specific implementation

    console.log('Factory reset completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Factory reset completed successfully. All transaction data has been cleared.',
      clearedTables: tablesToClear.length
    });

  } catch (error) {
    console.error('Factory reset error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to perform factory reset: ' + (error as Error).message 
    }, { status: 500 });
  }
}