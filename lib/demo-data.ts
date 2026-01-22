import type { Item, Customer, Sale, DashboardStats, Supplier, PurchaseOrder, AdvancePayment, Category, JobCard, JobCardItem } from './types'
import { DEMO_ORG_ID } from './constants'

// Data storage (Mutable for demo persistence)
export const demoCategories: Category[] = [
  {
    id: 'cat-1',
    organization_id: DEMO_ORG_ID,
    name: 'Gold Jewelry',
    description: '22k and 24k Gold Items',
    created_at: new Date().toISOString()
  },
  {
    id: 'cat-2',
    organization_id: DEMO_ORG_ID,
    name: 'Silver Utensils',
    description: 'Pure silver plates and bowls',
    created_at: new Date().toISOString()
  }
];

export const demoJobCards: JobCard[] = [
  {
    id: 'demo-id',
    organization_id: DEMO_ORG_ID,
    job_number: 'JOB-000001',
    customer_id: 'customer-1',
    customer_name: 'Rajesh Kumar',
    status: 'in_progress',
    date_in: new Date().toISOString(),
    estimated_cost: 1500,
    final_cost: 0,
    notes: 'Ring sizing and polishing',
    created_at: new Date().toISOString()
  }
];

export const demoJobCardItems: JobCardItem[] = [
  {
    id: 'item-1',
    job_card_id: 'demo-id',
    item_name: 'Gold Ring',
    quantity: 1,
    type: 'inward',
    cost: 0,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-2',
    job_card_id: 'demo-id',
    item_name: 'Polishing Service',
    quantity: 1,
    type: 'service',
    cost: 500,
    created_at: new Date().toISOString()
  }
];

export const demoSuppliers: Supplier[] = [
  {
    id: 'supplier-1',
    organization_id: DEMO_ORG_ID,
    supplier_code: 'SUP001',
    name: 'ABC Distributors Pvt Ltd',
    contact_person: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@abcdist.com',
    address: '123 Wholesale Market, Andheri East, Mumbai',
    city: 'Mumbai',
    state_code: '27',
    pincode: '400069',
    gstin: '27ABCDE1234F1Z5',
    pan_number: 'ABCDE1234F',
    bank_name: 'HDFC Bank',
    bank_account: '12345678901234',
    ifsc_code: 'HDFC0001234',
    payment_terms: 30,
    credit_limit: 100000,
    current_balance: 25000,
    supplier_type: 'distributor',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'supplier-2',
    organization_id: DEMO_ORG_ID,
    supplier_code: 'SUP002',
    name: 'XYZ Manufacturing Co',
    contact_person: 'Suresh Patel',
    phone: '9876543211',
    email: 'suresh@xyzmfg.com',
    address: '456 Industrial Area, Bhiwandi, Thane',
    city: 'Thane',
    state_code: '27',
    pincode: '421302',
    payment_terms: 45,
    credit_limit: 200000,
    current_balance: 0,
    supplier_type: 'manufacturer',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const demoPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1',
    organization_id: DEMO_ORG_ID,
    po_number: 'PO2501-0001',
    supplier_id: 'supplier-1',
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'confirmed',
    subtotal: 15000,
    discount_percent: 5,
    discount_amount: 750,
    cgst_amount: 1287.5,
    sgst_amount: 1287.5,
    igst_amount: 0,
    other_charges: 500,
    round_off: 0.5,
    total_amount: 17325,
    advance_paid: 5000,
    balance_amount: 12325,
    payment_terms: 30,
    notes: 'Urgent delivery required',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const demoAdvancePayments: AdvancePayment[] = [
  {
    id: 'advance-1',
    organization_id: DEMO_ORG_ID,
    payment_number: 'SA2501-001',
    payment_type: 'supplier_advance',
    party_id: 'supplier-1',
    party_name: 'ABC Distributors Pvt Ltd',
    party_type: 'supplier',
    po_id: 'po-1',
    advance_amount: 5000,
    utilized_amount: 0,
    balance_amount: 5000,
    payment_mode: 'bank_transfer',
    reference_number: 'TXN123456789',
    payment_date: new Date().toISOString().split('T')[0],
    purpose: 'Purchase order advance',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'advance-2',
    organization_id: DEMO_ORG_ID,
    payment_number: 'CA2501-001',
    payment_type: 'customer_advance',
    party_id: 'customer-1',
    party_name: 'Rajesh Kumar',
    party_type: 'customer',
    advance_amount: 2000,
    utilized_amount: 500,
    balance_amount: 1500,
    payment_mode: 'upi',
    payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    purpose: 'Order advance',
    status: 'active',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const demoItems: Item[] = [
  {
    id: 'item-1',
    organization_id: DEMO_ORG_ID,
    sku: 'ITM001',
    name: 'Premium Tea Packets',
    category: 'Beverages',
    hsn_code: '0902',
    wholesale_price: 45,
    retail_price: 50,
    purchase_cost: 40,
    current_stock: 25,
    min_stock_level: 10,
    gst_rate: 5,
    unit_type: 'pcs',
    unit_name: 'Packet',
    pieces_per_unit: 1,
    conversion_unit: 'pcs',
    conversion_factor: 1,
    is_rate_variable: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'item-2',
    organization_id: DEMO_ORG_ID,
    sku: 'ITM002',
    name: 'Rice Bags (5kg)',
    category: 'Groceries',
    hsn_code: '1006',
    wholesale_price: 280,
    retail_price: 320,
    purchase_cost: 250,
    current_stock: 8,
    min_stock_level: 5,
    gst_rate: 5,
    unit_type: 'bag',
    unit_name: 'Bag',
    pieces_per_unit: 1,
    conversion_unit: 'kg',
    conversion_factor: 5,
    is_rate_variable: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'item-3',
    organization_id: DEMO_ORG_ID,
    sku: 'ITM003',
    name: 'Cooking Oil (1L)',
    category: 'Cooking',
    hsn_code: '1511',
    wholesale_price: 120,
    retail_price: 135,
    current_stock: 15,
    min_stock_level: 8,
    purchase_cost: 110,
    gst_rate: 5,
    unit_type: 'bottle',
    unit_name: 'Bottle',
    pieces_per_unit: 1,
    conversion_unit: 'ltr',
    conversion_factor: 1,
    is_rate_variable: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'item-4',
    organization_id: DEMO_ORG_ID,
    sku: 'ITM004',
    name: 'Soap Bars (Pack of 4)',
    category: 'Personal Care',
    hsn_code: '3401',
    wholesale_price: 85,
    retail_price: 100,
    purchase_cost: 75,
    current_stock: 3,
    min_stock_level: 5,
    gst_rate: 18,
    unit_type: 'pack',
    unit_name: 'Pack',
    pieces_per_unit: 4,
    conversion_unit: 'pcs',
    conversion_factor: 4,
    is_rate_variable: false,
    created_at: new Date().toISOString(),
  },
]

export const demoCustomers: Customer[] = [
  {
    id: 'customer-1',
    organization_id: DEMO_ORG_ID,
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@example.com',
    address: '456 Market Street, Mumbai',
    gst_number: '27ABCDE1234F1Z5',
    state_code: '27',
    customer_type: 'retail',
    credit_limit: 5000,
    current_balance: 1250,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'customer-2',
    organization_id: DEMO_ORG_ID,
    name: 'Sharma General Store',
    phone: '9988776655',
    address: '789 Commercial Complex, Andheri',
    customer_type: 'wholesale',
    credit_limit: 25000,
    current_balance: 3500,
    state_code: '27',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'customer-3',
    organization_id: DEMO_ORG_ID,
    name: 'Priya Traders',
    phone: '9123456789',
    address: '321 Business Park, Bandra',
    customer_type: 'distributor',
    credit_limit: 50000,
    current_balance: 0,
    state_code: '27',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const demoSales: Sale[] = [
  {
    id: 'sale-1',
    organization_id: DEMO_ORG_ID,
    invoice_number: 'INV2501-0001',
    customer_id: 'customer-1',
    customer_name: 'Rajesh Kumar',
    customer_phone: '9876543210',
    customer_state_code: '27',
    subtotal: 500,
    discount_amount: 25,
    discount_percent: 5,
    cgst_amount: 11.88,
    sgst_amount: 11.88,
    igst_amount: 0,
    round_off: 0.24,
    total_amount: 500,
    payment_mode: 'cash',
    amount_paid: 500,
    credit_amount: 0,
    is_credit: false,
    is_paid: true,
    sale_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'sale-2',
    organization_id: DEMO_ORG_ID,
    invoice_number: 'INV2501-0002',
    customer_name: 'Walk-in Customer',
    customer_state_code: '27',
    subtotal: 320,
    discount_amount: 0,
    discount_percent: 0,
    cgst_amount: 8,
    sgst_amount: 8,
    igst_amount: 0,
    round_off: 0,
    total_amount: 336,
    payment_mode: 'upi',
    amount_paid: 336,
    credit_amount: 0,
    is_credit: false,
    is_paid: true,
    sale_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

const demoOrganizations = [{
  id: DEMO_ORG_ID,
  name: 'Demo Retail Store',
  gst_number: '27ABCDE1234F1Z5',
  address: '123 Demo Street, Mumbai, Maharashtra 400001',
  phone: '+91 9876543210',
  state_code: '27',
  gstin: '27ABCDE1234F1Z5',
  created_at: new Date().toISOString(),
}];


// Demo dashboard stats
export const demoDashboardStats: DashboardStats = {
  todaySales: 1250,
  todayTransactions: 8,
  yesterdaySales: 980,
  weekSales: 7500,
  monthSales: 28500,
  lowStockItems: demoItems.filter(item => item.current_stock <= item.min_stock_level),
  lowStockCount: 2,
  outstandingCredit: 4750,
  cashInHand: 15000,
  topSellingItems: [
    {
      item_id: 'item-1',
      item_name: 'Premium Tea Packets',
      total_quantity: 45,
      total_revenue: 2250,
    },
    {
      item_id: 'item-3',
      item_name: 'Cooking Oil (1L)',
      total_quantity: 28,
      total_revenue: 3780,
    },
  ],
  salesTrend: [
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total: 850, count: 5 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total: 1200, count: 7 },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total: 950, count: 6 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total: 1100, count: 8 },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total: 1350, count: 9 },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total: 980, count: 6 },
    { date: new Date().toISOString().split('T')[0], total: 1250, count: 8 },
  ],
}

// Demo mode detection
export const isDemoMode = () => {
  return false; // User requested to remove demo mode
}

// Mock Supabase responses for demo
export const createDemoSupabaseClient = () => {
  const getDataForTable = (table: string) => {
    switch (table) {
      case 'items': return demoItems;
      case 'customers': return demoCustomers;
      case 'sales': return demoSales;
      case 'suppliers': return demoSuppliers;
      case 'purchase_orders': return demoPurchaseOrders;
      case 'advance_payments': return demoAdvancePayments;
      case 'categories': return demoCategories;
      case 'job_cards': return demoJobCards;
      case 'job_card_items': return demoJobCardItems;
      case 'organizations': return demoOrganizations;
      default: return [];
    }
  }

  const mockQuery = (table: string) => {
    let currentData = getDataForTable(table);

    const createBuilder = (workingData: any[]) => ({
      select: (columns?: string) => createBuilder(workingData),
      eq: (column: string, value: any) => {
        const filtered = workingData.filter(item => {
          if (item[column] === undefined) return true;
          return item[column] == value;
        });
        return createBuilder(filtered);
      },
      order: (column: string, options?: any) => {
        // Simple sort string/number
        const sorted = [...workingData].sort((a, b) => {
          if (a[column] < b[column]) return options?.ascending === false ? 1 : -1;
          if (a[column] > b[column]) return options?.ascending === false ? -1 : 1;
          return 0;
        });
        return createBuilder(sorted);
      },
      limit: (count: number) => createBuilder(workingData.slice(0, count)),
      gt: (column: string, value: any) => createBuilder(workingData.filter(i => i[column] > value)),
      lt: (column: string, value: any) => createBuilder(workingData.filter(i => i[column] < value)),
      gte: (column: string, value: any) => createBuilder(workingData.filter(i => i[column] >= value)),
      lte: (column: string, value: any) => createBuilder(workingData.filter(i => i[column] <= value)),

      single: () => Promise.resolve({
        data: workingData.length > 0 ? workingData[0] : null,
        error: null
      }),

      then: (callback: any) => Promise.resolve(callback({
        data: workingData,
        error: null
      })),
    });

    return {
      select: (columns?: string) => createBuilder(currentData),

      insert: (insertData: any) => {
        const newItem = { id: `new-${Date.now()}`, created_at: new Date().toISOString(), ...insertData };
        // Mutate the source array
        currentData.push(newItem);

        return {
          select: () => ({
            single: () => Promise.resolve({ data: newItem, error: null }),
          }),
          then: (callback: any) => Promise.resolve(callback({ data: newItem, error: null })),
        }
      },

      update: (updateData: any) => ({
        eq: (column: string, value: any) => ({
          then: (callback: any) => {
            // Simulate update
            const index = currentData.findIndex((d: any) => d[column] === value);
            if (index !== -1) {
              currentData[index] = { ...currentData[index], ...updateData };
            }
            return Promise.resolve(callback({ data: null, error: null }));
          }
        }),
      }),

      delete: () => ({
        eq: (column: string, value: any) => ({
          then: (callback: any) => {
            // Simulate delete by splicing
            const index = currentData.findIndex((d: any) => d[column] === value);
            if (index !== -1) {
              currentData.splice(index, 1);
            }
            return Promise.resolve(callback({ error: null }));
          }
        })
      })
    };
  };

  return {
    from: (table: string) => mockQuery(table),
  };
};