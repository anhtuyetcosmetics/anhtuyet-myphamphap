
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useAddCustomer, Customer } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddCustomerDialog: React.FC<AddCustomerDialogProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<Customer, 'id' | 'ngay_tao' | 'tong_mua'>>();
  const addCustomer = useAddCustomer();
  const { toast } = useToast();

  const onSubmit = async (data: Omit<Customer, 'id' | 'ngay_tao' | 'tong_mua'>) => {
    try {
      await addCustomer.mutateAsync(data);
      toast({
        title: "Thành công",
        description: "Đã thêm khách hàng mới thành công",
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm khách hàng",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm khách hàng mới</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="ma_khach_hang">Mã khách hàng *</Label>
            <Input
              id="ma_khach_hang"
              {...register('ma_khach_hang', { required: 'Mã khách hàng là bắt buộc' })}
              placeholder="Nhập mã khách hàng"
            />
            {errors.ma_khach_hang && (
              <p className="text-sm text-red-600 mt-1">{errors.ma_khach_hang.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="ten_khach_hang">Tên khách hàng *</Label>
            <Input
              id="ten_khach_hang"
              {...register('ten_khach_hang', { required: 'Tên khách hàng là bắt buộc' })}
              placeholder="Nhập tên khách hàng"
            />
            {errors.ten_khach_hang && (
              <p className="text-sm text-red-600 mt-1">{errors.ten_khach_hang.message}</p>
            )}
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
            <Button type="submit" disabled={addCustomer.isPending}>
              {addCustomer.isPending ? 'Đang thêm...' : 'Thêm khách hàng'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
