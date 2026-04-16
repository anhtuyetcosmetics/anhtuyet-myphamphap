import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useUpdateProduct, useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { ScanBarcode } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProductDialog: React.FC<EditProductDialogProps> = ({
  product,
  open,
  onOpenChange,
}) => {
  const { register, handleSubmit, reset, setValue } = useForm<Omit<Product, 'id'>>();
  const updateProduct = useUpdateProduct();
  const { data: products } = useProducts();
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);

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

  const handleBarcodeDetected = (code: string) => {
    const conflict = products?.find((p) => p.ma_hang === code && p.id !== product.id);
    if (conflict) {
      toast({
        title: 'Mã đã tồn tại',
        description: `Mã "${code}" đang dùng cho sản phẩm "${conflict.ten_hang}".`,
        variant: 'destructive',
      });
      return;
    }
    setValue('ma_hang', code, { shouldDirty: true });
    setShowScanner(false);
    toast({ title: 'Đã quét mã', description: `Mã hàng: ${code}` });
  };

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
        title: 'Thành công',
        description: 'Đã cập nhật sản phẩm thành công',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật sản phẩm',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md sm:rounded-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="ma_hang">Mã hàng</Label>
              <div className="flex gap-2">
                <Input
                  id="ma_hang"
                  {...register('ma_hang')}
                  placeholder="Nhập hoặc quét mã hàng"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowScanner(true)}
                  aria-label="Quét mã vạch"
                  className="shrink-0 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <ScanBarcode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="ten_hang">Tên hàng</Label>
              <Input id="ten_hang" {...register('ten_hang')} placeholder="Nhập tên hàng" />
            </div>

            <div>
              <Label htmlFor="nhom_hang">Nhóm hàng</Label>
              <Input id="nhom_hang" {...register('nhom_hang')} placeholder="Nhập nhóm hàng" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gia_ban">Giá bán</Label>
                <Input id="gia_ban" type="number" inputMode="numeric" {...register('gia_ban')} placeholder="Giá bán" />
              </div>

              <div>
                <Label htmlFor="gia_von">Giá vốn</Label>
                <Input id="gia_von" type="number" inputMode="numeric" {...register('gia_von')} placeholder="Giá vốn" />
              </div>
            </div>

            <div>
              <Label htmlFor="ton_kho">Tồn kho</Label>
              <Input id="ton_kho" type="number" inputMode="numeric" {...register('ton_kho')} placeholder="Số lượng tồn kho" />
            </div>

            <div>
              <Label htmlFor="thuong_hieu">Thương hiệu</Label>
              <Input id="thuong_hieu" {...register('thuong_hieu')} placeholder="Thương hiệu" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={updateProduct.isPending}
                className="bg-brand-gradient text-white shadow-pop hover:opacity-90"
              >
                {updateProduct.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showScanner && (
        <div className="fixed inset-0 z-[70] bg-black">
          <BarcodeScanner
            continuous={false}
            onBarcodeDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
            onError={(msg) => {
              toast({ variant: 'destructive', title: 'Lỗi camera', description: msg });
            }}
          />
        </div>
      )}
    </>
  );
};
