import { getSupabaseBrowserClient } from './supabase/client';

export interface InventoryCostLayer {
  id: string;
  organization_id: string;
  item_id: string;
  layer_date: string;
  transaction_type: 'purchase' | 'adjustment' | 'opening';
  reference_id?: string;
  reference_number?: string;
  quantity_in: number;
  quantity_remaining: number;
  unit_cost: number;
  total_cost: number;
  supplier_id?: string;
  batch_number?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  organization_id: string;
  item_id: string;
  transaction_date: string;
  transaction_type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'opening';
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  running_quantity: number;
  running_value: number;
  average_cost: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface CostingMethod {
  id: string;
  organization_id: string;
  item_id?: string;
  method: 'fifo' | 'lifo' | 'weighted_average' | 'specific_identification';
  is_default: boolean;
  effective_from: string;
  created_at: string;
}

export interface InventoryValuation {
  item_id: string;
  item_name: string;
  sku: string;
  current_stock: number;
  average_cost: number;
  total_value: number;
  last_purchase_cost: number;
  last_purchase_date?: string;
}

export class InventoryCostingService {
  private supabase = getSupabaseBrowserClient();

  /**
   * Get current inventory valuation for all items
   */
  async getInventoryValuation(organizationId: string): Promise<InventoryValuation[]> {
    const { data, error } = await this.supabase.rpc('get_inventory_valuation', {
      p_organization_id: organizationId
    });

    if (error) {
      console.error('Error getting inventory valuation:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get current stock and average cost for a specific item
   */
  async getItemCostInfo(organizationId: string, itemId: string) {
    const { data: stockData, error: stockError } = await this.supabase.rpc('get_current_stock', {
      p_organization_id: organizationId,
      p_item_id: itemId
    });

    if (stockError) {
      console.error('Error getting current stock:', stockError);
      throw stockError;
    }

    const { data: costData, error: costError } = await this.supabase.rpc('get_current_average_cost', {
      p_organization_id: organizationId,
      p_item_id: itemId
    });

    if (costError) {
      console.error('Error getting average cost:', costError);
      throw costError;
    }

    return {
      current_stock: stockData || 0,
      average_cost: costData || 0,
      total_value: (stockData || 0) * (costData || 0)
    };
  }

  /**
   * Get cost layers for an item (for FIFO/LIFO analysis)
   */
  async getItemCostLayers(organizationId: string, itemId: string): Promise<InventoryCostLayer[]> {
    const { data, error } = await this.supabase
      .from('inventory_cost_layers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('item_id', itemId)
      .gt('quantity_remaining', 0)
      .order('layer_date', { ascending: true });

    if (error) {
      console.error('Error getting cost layers:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get inventory transactions for an item
   */
  async getItemTransactions(
    organizationId: string, 
    itemId: string, 
    fromDate?: string, 
    toDate?: string
  ): Promise<InventoryTransaction[]> {
    let query = this.supabase
      .from('inventory_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('item_id', itemId)
      .order('transaction_date', { ascending: false });

    if (fromDate) {
      query = query.gte('transaction_date', fromDate);
    }
    if (toDate) {
      query = query.lte('transaction_date', toDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting inventory transactions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Process purchase receipt for costing
   */
  async processPurchaseCosting(receiptId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('process_purchase_costing', {
      p_receipt_id: receiptId
    });

    if (error) {
      console.error('Error processing purchase costing:', error);
      throw error;
    }

    return data || false;
  }

  /**
   * Calculate cost of goods sold for a sale using FIFO method
   */
  async calculateCOGS(
    organizationId: string, 
    itemId: string, 
    quantitySold: number,
    method: 'fifo' | 'lifo' | 'weighted_average' = 'weighted_average'
  ): Promise<{ totalCost: number; averageCost: number; layers: any[] }> {
    if (method === 'weighted_average') {
      const avgCost = await this.getItemCostInfo(organizationId, itemId);
      return {
        totalCost: quantitySold * avgCost.average_cost,
        averageCost: avgCost.average_cost,
        layers: []
      };
    }

    // For FIFO/LIFO, get cost layers
    const layers = await this.getItemCostLayers(organizationId, itemId);
    
    if (method === 'lifo') {
      layers.reverse(); // LIFO uses newest layers first
    }

    let remainingQty = quantitySold;
    let totalCost = 0;
    const usedLayers = [];

    for (const layer of layers) {
      if (remainingQty <= 0) break;

      const qtyFromLayer = Math.min(remainingQty, layer.quantity_remaining);
      const costFromLayer = qtyFromLayer * layer.unit_cost;

      totalCost += costFromLayer;
      remainingQty -= qtyFromLayer;

      usedLayers.push({
        layer_id: layer.id,
        quantity_used: qtyFromLayer,
        unit_cost: layer.unit_cost,
        total_cost: costFromLayer
      });
    }

    return {
      totalCost,
      averageCost: quantitySold > 0 ? totalCost / quantitySold : 0,
      layers: usedLayers
    };
  }

  /**
   * Create inventory adjustment
   */
  async createInventoryAdjustment(
    organizationId: string,
    itemId: string,
    adjustmentQuantity: number,
    adjustmentCost: number,
    reason: string,
    referenceNumber?: string
  ): Promise<boolean> {
    try {
      // Create cost layer for positive adjustments
      if (adjustmentQuantity > 0) {
        await this.supabase
          .from('inventory_cost_layers')
          .insert({
            organization_id: organizationId,
            item_id: itemId,
            transaction_type: 'adjustment',
            reference_number: referenceNumber,
            quantity_in: adjustmentQuantity,
            quantity_remaining: adjustmentQuantity,
            unit_cost: adjustmentCost,
            total_cost: adjustmentQuantity * adjustmentCost
          });
      }

      // Create inventory transaction
      const currentInfo = await this.getItemCostInfo(organizationId, itemId);
      
      await this.supabase
        .from('inventory_transactions')
        .insert({
          organization_id: organizationId,
          item_id: itemId,
          transaction_type: 'adjustment',
          reference_number: referenceNumber,
          quantity: adjustmentQuantity,
          unit_cost: adjustmentCost,
          total_cost: adjustmentQuantity * adjustmentCost,
          running_quantity: currentInfo.current_stock + adjustmentQuantity,
          running_value: currentInfo.total_value + (adjustmentQuantity * adjustmentCost),
          average_cost: currentInfo.average_cost,
          notes: reason
        });

      // Update item stock
      await this.supabase
        .from('items')
        .update({
          current_stock: currentInfo.current_stock + adjustmentQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      return true;
    } catch (error) {
      console.error('Error creating inventory adjustment:', error);
      throw error;
    }
  }

  /**
   * Get costing method for an item or organization default
   */
  async getCostingMethod(organizationId: string, itemId?: string): Promise<CostingMethod | null> {
    let query = this.supabase
      .from('costing_methods')
      .select('*')
      .eq('organization_id', organizationId);

    if (itemId) {
      query = query.eq('item_id', itemId);
    } else {
      query = query.is('item_id', null).eq('is_default', true);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting costing method:', error);
      throw error;
    }

    return data;
  }

  /**
   * Set costing method for an item or organization
   */
  async setCostingMethod(
    organizationId: string,
    method: 'fifo' | 'lifo' | 'weighted_average' | 'specific_identification',
    itemId?: string,
    isDefault: boolean = false
  ): Promise<boolean> {
    try {
      await this.supabase
        .from('costing_methods')
        .upsert({
          organization_id: organizationId,
          item_id: itemId,
          method,
          is_default: isDefault,
          effective_from: new Date().toISOString().split('T')[0]
        });

      return true;
    } catch (error) {
      console.error('Error setting costing method:', error);
      throw error;
    }
  }

  /**
   * Generate inventory valuation report
   */
  async generateValuationReport(
    organizationId: string,
    asOfDate?: string
  ): Promise<{
    total_items: number;
    total_quantity: number;
    total_value: number;
    items: InventoryValuation[];
  }> {
    const items = await this.getInventoryValuation(organizationId);
    
    const totalQuantity = items.reduce((sum, item) => sum + item.current_stock, 0);
    const totalValue = items.reduce((sum, item) => sum + item.total_value, 0);

    return {
      total_items: items.length,
      total_quantity: totalQuantity,
      total_value: totalValue,
      items
    };
  }
}

// Export singleton instance
export const inventoryCostingService = new InventoryCostingService();