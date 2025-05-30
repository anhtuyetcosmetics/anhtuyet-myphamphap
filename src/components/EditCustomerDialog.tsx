
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useUpdateCustomer, Customer } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';

interface EditCustomerDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditCustomerDialog: React.FC<EditCustomerDialogProps> = ({ 
  customer, 
  open, 
  onOpenChange 
}) => {
  const { register, handleSubmit, reset, setValue } = useForm<Omit<Customer, 'id' | 'ngay_tao' | 'tong_mua'>>();
  const updateCustomer = useUpdateCustomer();
  const { toast } = useToast();

  useEffect(() => {
    if (customer) {
      setValue('ma_khach_hang', customer.ma_khach_hang);
      setValue('ten_khach_hang', customer.ten_khach_hang);
      setValue('dien_thoai', customer.dien_thoai || '');
      setValue('email', customer.email || '');
      setValue('dia_chi', customer.dia_chi || '');
    }
  }, [customer, setValue]);

  const onSubmit = async (data: Omit<Customer, 'id' | 'ngay_tao' | 'tong_mua'>) => {
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        ...data,
      });
      toast({
        title: "Thành công",
        description: "Đã cập nhật khách hàng thành công",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật khách hàng",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="ma_khach_hang">Mã khách hàng</Label>
            <Input
              id="ma_khach_hang"
              {...register('ma_khach_hang')}
              placeholder="Nhập mã khách hàng"
            />
          </div>

          <div>
            <Label htmlFor="ten_khach_hang">Tên khách hàng</Label>
            <Input
              id="ten_khach_hang"
              {...register('ten_khach_hang')}
              placeholder="Nhập tên khách hàng"
            />
          </div>

          <div>
            <Label htmlFor="dien_thoai">Số điện thoại</Label>
            <Input
              id="dien_thoai"
              {...register('dien_thoai')}
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Nhập email"
            />
          </div>

          <div>
            <Label htmlFor="dia_chi">Địa chỉ</Label>
            <Input
              id="dia_chi"
              {...register('dia_chi')}
              placeholder="Nhập địa chỉ"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={updateCustomer.isPending}>
              {updateCustomer.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
