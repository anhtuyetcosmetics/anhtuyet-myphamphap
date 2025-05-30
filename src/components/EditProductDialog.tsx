
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useUpdateProduct, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProductDialog: React.FC<EditProductDialogProps> = ({ 
  product, 
  open, 
  onOpenChange 
}) => {
  const { register, handleSubmit, reset, setValue } = useForm<Omit<Product, 'id'>>();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setValue('ma_hang', product.ma_hang);
      setValue('ten_hang', product.ten_hang);
      setValue('nhom_hang', product.nhom_hang || '');
      setValue('gia_ban', product.gia_ban || 0);
      setValue('gia_von', product.gia_von || 0);
      setValue('ton_kho', product.ton_kho || 0);
      setValue('thuong_hieu', product.thuong_hieu || '');
      setValue('du_kien_het_hang', product.du_kien_het_hang || '');
      setValue('ton_kho_lon_nhat', product.ton_kho_lon_nhat || '');
    }
  }, [product, setValue]);

  const onSubmit = async (data: Omit<Product, 'id'>) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        ...data,
        gia_ban: data.gia_ban ? Number(data.gia_ban) : null,
        gia_von: data.gia_von ? Number(data.gia_von) : null,
        ton_kho: data.ton_kho ? Number(data.ton_kho) : null,
      });
      toast({
        title: "Thành công",
        description: "Đã cập nhật sản phẩm thành công",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật sản phẩm",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="ma_hang">Mã hàng</Label>
            <Input
              id="ma_hang"
              {...register('ma_hang')}
              placeholder="Nhập mã hàng"
            />
          </div>

          <div>
            <Label htmlFor="ten_hang">Tên hàng</Label>
            <Input
              id="ten_hang"
              {...register('ten_hang')}
              placeholder="Nhập tên hàng"
            />
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
            <Button type="submit" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
