// Multi-tenant organization
export interface Organization {
  id: string;
  name: string;
  gst_number?: string;
  address?: string;
  phone?: string;
  state_code: string;
  gstin: string | null;
  logo_url?: string;
  settings?: OrganizationSettings;
  created_at: string;
}

export interface OrganizationSettings {
  currency: string;
  tax_inclusive: boolean;
  default_gst_rate: number;
  thermal_printer_width: number;
  invoice_prefix: string;
  low_stock_threshold: number;
}

// Customer/Party
export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  state_code?: string;
  customer_type: "retail" | "wholesale" | "distributor";
  credit_limit: number;
  current_balance: number;
  created_at: string;
}

// Item with unit conversion
export interface Item {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  category?: string;
  hsn_code?: string;
  wholesale_price: number;
  retail_price: number;
  purchase_cost: number;
  current_stock: number;
  min_stock_level: number;
  gst_rate: number;
  unit_type: string;
  unit_name?: string;
  pieces_per_unit: number;
  conversion_unit?: string;
  conversion_factor: number;
  is_rate_variable: boolean;
  last_purchase_date?: string;
  created_at: string;
}

// Daily Rate (Bhav) for variable items like gold/silver
export interface DailyRate {
  id: string;
  organization_id: string;
  item_id?: string;
  rate_name: string;
  rate_per_unit: number;
  unit: string;
  effective_date: string;
  created_at: string;
}

// Sale/Invoice
export interface Sale {
  id: string;
  organization_id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string | null;
  customer_phone?: string;
  customer_state_code: string;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  round_off: number;
  total_amount: number;
  payment_mode: "cash" | "upi" | "card" | "credit" | "mixed";
  amount_paid: number;
  credit_amount: number;
  is_credit: boolean;
  is_paid: boolean;
  notes?: string;
  sale_date: string;
  created_at: string;
  customer?: Customer;
  sale_items?: SaleItem[];
}

// Sale Item
export interface SaleItem {
  id: string;
  sale_id: string;
  item_id: string;
  item_name?: string;
  hsn_code?: string;
  quantity: number;
  unit_name?: string;
  unit_price: number;
  purchase_price?: number;
  discount_percent: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_price: number;
  item?: Item;
}

// Stock Movement
export interface StockMovement {
  id: string;
  organization_id: string;
  item_id: string;
  movement_type: "purchase" | "sale" | "adjustment" | "return" | "damage";
  quantity_change: number;
  unit_price?: number;
  reference_id?: string | null;
  notes?: string | null;
  created_at: string;
  item?: Item;
}

// Voucher for accounting entries
export interface Voucher {
  id: string;
  organization_id: string;
  voucher_number: string;
  voucher_type: "receipt" | "payment" | "contra" | "journal";
  party_id?: string;
  party_name?: string;
  amount: number;
  narration?: string;
  reference_number?: string;
  voucher_date: string;
  created_at: string;
  customer?: Customer;
}

// Cash Register
export interface CashRegister {
  id: string;
  organization_id: string;
  register_date: string;
  opening_balance: number;
  cash_in: number;
  cash_out: number;
  closing_balance: number;
  notes?: string;
  is_closed: boolean;
  created_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  yesterdaySales: number;
  weekSales: number;
  monthSales: number;
  lowStockItems: Item[];
  lowStockCount: number;
  outstandingCredit: number;
  cashInHand: number;
  topSellingItems: TopSellingItem[];
  salesTrend: SalesTrend[];
}

export interface TopSellingItem {
  item_id: string;
  item_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface SalesTrend {
  date: string;
  total: number;
  count: number;
}

// Profit/Loss Report
export interface ProfitLossEntry {
  item_id?: string;
  item_name: string;
  quantity_sold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin_percent?: number;
}

// Ledger Entry
export interface LedgerEntry {
  id: string;
  date: string;
  type: "sale" | "payment" | "credit" | "opening";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference_id?: string;
}

// GST Calculation
export interface GSTCalculation {
  subtotal: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;
  grand_total: number;
  is_igst: boolean;
}

// Bill Item for Quick Bill
export interface BillItem {
  item_id: string;
  item: Item;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  gst_rate: number;
  subtotal: number;
  tax_amount: number;
  total: number;
}

// Indian States for GST
export const INDIAN_STATES = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra & Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
] as const;

export type StateCode = (typeof INDIAN_STATES)[number]["code"];

// GST Rate Options
export const GST_RATES = [0, 5, 12, 18, 28];

// Payment Modes
export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "credit", label: "Credit (Udhari)" },
  { value: "mixed", label: "Mixed" },
] as const;

// Customer Types
export const CUSTOMER_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "distributor", label: "Distributor" },
] as const;

// Helper function to calculate GST
export function calculateGST(
  subtotal: number,
  gstRate: number,
  sellerStateCode: string,
  buyerStateCode?: string
): GSTCalculation {
  const isIGST = buyerStateCode && sellerStateCode !== buyerStateCode;
  const taxAmount = (subtotal * gstRate) / 100;

  if (isIGST) {
    return {
      subtotal,
      cgst_rate: 0,
      sgst_rate: 0,
      igst_rate: gstRate,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: taxAmount,
      total_tax: taxAmount,
      grand_total: subtotal + taxAmount,
      is_igst: true,
    };
  }

  const halfRate = gstRate / 2;
  const halfTax = taxAmount / 2;

  return {
    subtotal,
    cgst_rate: halfRate,
    sgst_rate: halfRate,
    igst_rate: 0,
    cgst_amount: halfTax,
    sgst_amount: halfTax,
    igst_amount: 0,
    total_tax: taxAmount,
    grand_total: subtotal + taxAmount,
    is_igst: false,
  };
}

// Format currency in Indian format
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format short currency (for display)
export function formatShortCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
}

// Round off to nearest rupee
export function roundOff(amount: number): { rounded: number; diff: number } {
  const rounded = Math.round(amount);
  return {
    rounded,
    diff: rounded - amount,
  };
}

// Generate invoice number
export function generateInvoiceNumber(prefix: string, counter: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${prefix}${year}${month}-${counter.toString().padStart(4, "0")}`;
}

// Convert quantity between units
export function convertQuantity(
  quantity: number,
  conversionFactor: number,
  toBase: boolean = true
): number {
  if (toBase) {
    return quantity * conversionFactor;
  }
  return quantity / conversionFactor;
}

// Number to words for Indian currency
export function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  if (num === 0) return "Zero";

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convertLessThanThousand(n % 100) : "");
  };

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  let result = "";
  
  if (intPart >= 10000000) {
    result += convertLessThanThousand(Math.floor(intPart / 10000000)) + " Crore ";
  }
  if (intPart >= 100000) {
    result += convertLessThanThousand(Math.floor((intPart % 10000000) / 100000)) + " Lakh ";
  }
  if (intPart >= 1000) {
    result += convertLessThanThousand(Math.floor((intPart % 100000) / 1000)) + " Thousand ";
  }
  result += convertLessThanThousand(intPart % 1000);

  result = result.trim() + " Rupees";
  
  if (decPart > 0) {
    result += " and " + convertLessThanThousand(decPart) + " Paise";
  }

  return result.trim() + " Only";
}
