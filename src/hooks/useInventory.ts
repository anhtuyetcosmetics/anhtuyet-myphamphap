
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InventoryTransaction {
  id: number;
  product_id: number | null;
  loai_giao_dich: string;
  so_luong: number;
  gia_tri: number | null;
  ngay_giao_dich: string | null;
  ghi_chu: string | null;
  nguoi_thuc_hien: string | null;
}

export interface InventoryTransactionWithProduct extends InventoryTransaction {
  products?: {
    ten_hang: string;
    ma_hang: string;
  };
}

export interface InventoryItem {
  id: number;
  ten_hang: string;
  ma_hang: string;
  so_luong_hien_tai: number;
  ton_kho: number;
}

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, ten_hang, ma_hang, ton_kho')
        .order('ten_hang');
      
      if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }
      
      // Map the data to match the expected format
      return data.map(product => ({
        id: product.id,
        ten_hang: product.ten_hang,
        ma_hang: product.ma_hang,
        so_luong_hien_tai: product.ton_kho || 0,
        ton_kho: product.ton_kho || 0
      })) as InventoryItem[];
    },
  });
};

export const useInventoryTransactions = () => {
  return useQuery({
    queryKey: ['inventory_transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          products (ten_hang, ma_hang)
        `)
        .order('ngay_giao_dich', { ascending: false });
      
      if (error) {
        console.error('Error fetching inventory transactions:', error);
        throw error;
      }
      
      return data as InventoryTransactionWithProduct[];
    },
  });
};

export const useAddInventoryTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: Omit<InventoryTransaction, 'id' | 'ngay_giao_dich'>) => {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .insert([transaction])
        .select();
      
      if (error) {
        console.error('Error adding inventory transaction:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
