
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
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('ngay_tao', { ascending: false });
      
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      
      return data as Customer[];
    },
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
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
