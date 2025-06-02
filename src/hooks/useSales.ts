import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Sale {
  id: number;
  ma_don_hang: string;
  customer_id: number | null;
  ngay_ban: string | null;
  tong_tien: number;
  thanh_tien: number;
  giam_gia_loai: 'percentage' | 'fixed' | null;
  giam_gia_gia_tri: number | null;
  giam_gia_so_tien: number | null;
  trang_thai: string | null;
  ghi_chu: string | null;
}

export interface SaleItem {
  id: number;
  sale_id: number | null;
  product_id: number | null;
  so_luong: number;
  gia_ban: number;
  thanh_tien: number | null;
}

export interface SaleWithDetails extends Sale {
  customers?: {
    ten_khach_hang: string;
    ma_khach_hang: string;
    dia_chi: string | null;
    dien_thoai: string | null;
  };
  sale_items?: Array<SaleItem & {
    products?: {
      ten_hang: string;
      ma_hang: string;
    };
  }>;
}

export const useSales = () => {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers (ten_khach_hang, ma_khach_hang, dien_thoai, dia_chi),
          sale_items (
            *,
            products (ten_hang, ma_hang)
          )
        `)
        .order('ngay_ban', { ascending: false });
      
      if (error) {
        console.error('Error fetching sales:', error);
        throw error;
      }
      
      return data as SaleWithDetails[];
    },
  });
};

export const useAddSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sale: Omit<Sale, 'id' | 'ngay_ban'>) => {
      const { data, error } = await supabase
        .from('sales')
        .insert([sale])
        .select();
      
      if (error) {
        console.error('Error adding sale:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};

export const useAddSaleItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (saleItem: Omit<SaleItem, 'id' | 'thanh_tien'>) => {
      const { data, error } = await supabase
        .from('sale_items')
        .insert([saleItem])
        .select();
      
      if (error) {
        console.error('Error adding sale item:', error);
        throw error;
      }
      
      // Also create inventory transaction for the sale
      await supabase
        .from('inventory_transactions')
        .insert([{
          product_id: saleItem.product_id,
          loai_giao_dich: 'xuat',
          so_luong: saleItem.so_luong,
          gia_tri: saleItem.gia_ban * saleItem.so_luong,
          ghi_chu: `Bán hàng - Đơn ${saleItem.sale_id}`
        }]);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
