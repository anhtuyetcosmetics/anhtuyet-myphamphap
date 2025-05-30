
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useAddProduct, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<Product, 'id'>>();
  const addProduct = useAddProduct();
  const { toast } = useToast();

  const onSubmit = async (data: Omit<Product, 'id'>) => {
    try {
      await addProduct.mutateAsync({
        ...data,
        gia_ban: data.gia_ban ? Number(data.gia_ban) : null,
        gia_von: data.gia_von ? Number(data.gia_von) : null,
        ton_kho: data.ton_kho ? Number(data.ton_kho) : null,
      });
      toast({
        title: "Thành công",
        description: "Đã thêm sản phẩm mới thành công",
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm sản phẩm",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm mới</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="ma_hang">Mã hàng *</Label>
            <Input
              id="ma_hang"
              {...register('ma_hang', { required: 'Mã hàng là bắt buộc' })}
              placeholder="Nhập mã hàng"
            />
            {errors.ma_hang && (
              <p className="text-sm text-red-600 mt-1">{errors.ma_hang.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="ten_hang">Tên hàng *</Label>
            <Input
              id="ten_hang"
              {...register('ten_hang', { required: 'Tên hàng là bắt buộc' })}
              placeholder="Nhập tên hàng"
            />
            {errors.ten_hang && (
              <p className="text-sm text-red-600 mt-1">{errors.ten_hang.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nhom_hang">Nhóm hàng</Label>
            <Input
              id="nhom_hang"
              {...register('nhom_hang')}
              placeholder="Nhập nhóm hàng"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gia_ban">Giá bán</Label>
              <Input
                id="gia_ban"
                type="number"
                {...register('gia_ban')}
                placeholder="Giá bán"
              />
            </div>

            <div>
              <Label htmlFor="gia_von">Giá vốn</Label>
              <Input
                id="gia_von"
                type="number"
                {...register('gia_von')}
                placeholder="Giá vốn"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ton_kho">Tồn kho</Label>
            <Input
              id="ton_kho"
              type="number"
              {...register('ton_kho')}
              placeholder="Số lượng tồn kho"
            />
          </div>

          <div>
            <Label htmlFor="thuong_hieu">Thương hiệu</Label>
            <Input
              id="thuong_hieu"
              {...register('thuong_hieu')}
              placeholder="Thương hiệu"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={addProduct.isPending}>
              {addProduct.isPending ? 'Đang thêm...' : 'Thêm sản phẩm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
