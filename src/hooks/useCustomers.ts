import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: number;
  ma_khach_hang: string;
  ten_khach_hang: string;
  dien_thoai: string | null;
  email: string | null;
  dia_chi: string | null;
  ngay_tao: string | null;
  tong_mua: number | null;
}

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      let allCustomers: Customer[] = [];
      let lastId = 0;
      const pageSize = 2000; // Tăng lên 2000 bản ghi mỗi lần
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .order('id')
            .gt('id', lastId)
            .limit(pageSize);

        if (error) {
          console.error('Error fetching customers:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        allCustomers = [...allCustomers, ...data];
        lastId = data[data.length - 1].id;

        console.log(`Fetched ${data.length} customers, total so far: ${allCustomers.length}`);
      }

      console.log('Total customers fetched:', allCustomers.length);

      // Sắp xếp lại theo tên khách hàng
      allCustomers.sort((a, b) => a.ten_khach_hang.localeCompare(b.ten_khach_hang));

      return {
        data: allCustomers as Customer[],
        count: allCustomers.length
      };
    },
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 30 * 60 * 1000, // 30 phút
  });
};

export const useAddCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'ngay_tao' | 'tong_mua'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select();
      
      if (error) {
        console.error('Error adding customer:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<Customer> & { id: number }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting customer:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    },
  });
};

export const useCustomersList = () => {
  return useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      let allCustomers: Customer[] = [];
      let lastId = 0;
      const pageSize = 2000; // Tăng lên 2000 bản ghi mỗi lần
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .order('id')
          .gt('id', lastId)
          .limit(pageSize);

        if (error) {
          console.error('Error fetching customers:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        allCustomers = [...allCustomers, ...data];
        lastId = data[data.length - 1].id;

        console.log(`Fetched ${data.length} customers, total so far: ${allCustomers.length}`);
      }

      console.log('Total customers fetched:', allCustomers.length);
      
      // Sắp xếp lại theo tên khách hàng
      allCustomers.sort((a, b) => a.ten_khach_hang.localeCompare(b.ten_khach_hang));
      
      return { 
        data: allCustomers as Customer[], 
        count: allCustomers.length 
      };
    },
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 30 * 60 * 1000, // 30 phút
  });
};
