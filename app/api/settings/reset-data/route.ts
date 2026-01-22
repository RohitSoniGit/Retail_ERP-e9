import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ success: false, error: "Missing Service Role Key" }, { status: 500 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        // Define deletion steps in strict dependency order (Child -> Parent)
        // We execute these sequentially to avoid Foreign Key constraint violations.
        const steps = [
            { table: "purchase_receipt_items", label: "Receipt Items" },
            { table: "purchase_order_items", label: "PO Items" }, // Referenced by receipt items
            { table: "sale_items", label: "Sale Items" },
            { table: "job_card_items", label: "Job Card Items" },
            { table: "ledger_entry_details", label: "Ledger Details" },

            // Documents that might reference others or be referenced
            { table: "purchase_receipts", label: "Purchase Receipts" }, // References POs
            { table: "stock_movements", label: "Stock Movements" },
            { table: "item_batches", label: "Item Batches" },
            { table: "inventory_valuations", label: "Valuations" },

            // Vouchers (References Sales/Customers)
            { table: "vouchers", label: "Vouchers" },
            { table: "advance_payments", label: "Advance Payments" },

            // Core Transaction Headers
            { table: "sales", label: "Sales" },
            { table: "purchase_orders", label: "Purchase Orders" },
            { table: "job_cards", label: "Job Cards" },
            { table: "ledger_entries", label: "Ledger Entries" },
            { table: "cash_register", label: "Cash Register" },
        ];

        // Execute deletions sequentially
        for (const step of steps) {
            const { error } = await supabase
                .from(step.table)
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete ALL rows

            if (error) {
                // Ignore "relation does not exist" errors in case a table is missing
                if (error.code === '42P01') {
                    console.warn(`Table ${step.table} does not exist, skipping.`);
                    continue;
                }
                console.error(`Error deleting ${step.label}:`, error);
                throw new Error(`Failed to clear ${step.label}: ${error.code} - ${error.message}`);
            }
        }

        // Reset Items Stock
        const { error: stockError } = await supabase
            .from("items")
            .update({ current_stock: 0 })
            .neq("id", "00000000-0000-0000-0000-000000000000");

        if (stockError) throw stockError;

        // Reset Balances for Masters
        await supabase.from("customers").update({ current_balance: 0 }).neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("suppliers").update({ current_balance: 0 }).neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("ledger_accounts").update({ current_balance: 0 }).neq("id", "00000000-0000-0000-0000-000000000000");

        return NextResponse.json({ success: true, message: "System reset successfully" });
    } catch (error: any) {
        console.error("Reset Data Fatal Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Unknown error occurred" },
            { status: 500 }
        );
    }
}
