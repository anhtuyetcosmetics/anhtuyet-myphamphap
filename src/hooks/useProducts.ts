import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: number;
  ma_hang: string;
  ten_hang: string;
  nhom_hang: string | null;
  gia_ban: number | null;
  gia_von: number | null;
  ton_kho: number | null;
  thuong_hieu: string | null;
  du_kien_het_hang: string | null;
  ton_kho_lon_nhat: string | null;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      let allProducts: Product[] = [];
      let lastId = 0;
      const pageSize = 2000; // Tăng lên 2000 bản ghi mỗi lần
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
          .order('id')
          .gt('id', lastId)
          .limit(pageSize);

        if (error) {
          console.error('Error fetching products:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        allProducts = [...allProducts, ...data];
        lastId = data[data.length - 1].id;

        console.log(`Fetched ${data.length} products, total so far: ${allProducts.length}`);
      }

      console.log('Total products fetched:', allProducts.length);
      
      // Sắp xếp lại theo tên sản phẩm
      allProducts.sort((a, b) => a.ten_hang.localeCompare(b.ten_hang));
      
      return allProducts as Product[];
    },
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 30 * 60 * 1000, // 30 phút
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();
      
      if (error) {
        console.error('Error adding product:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: number }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating product:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting product:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
