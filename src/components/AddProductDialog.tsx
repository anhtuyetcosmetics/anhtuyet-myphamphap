import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useAddProduct, useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { ScanBarcode } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Omit<Product, 'id'>>();
  const addProduct = useAddProduct();
  const { data: products } = useProducts();
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);

  const currentMaHang = watch('ma_hang');

  const handleBarcodeDetected = (code: string) => {
    const existing = products?.find((p) => p.ma_hang === code);
    if (existing) {
      toast({
        title: 'Mã đã tồn tại',
        description: `Mã "${code}" đã được dùng cho sản phẩm "${existing.ten_hang}". Vui lòng quét mã khác.`,
        variant: 'destructive',
      });
      return;
    }
    setValue('ma_hang', code, { shouldValidate: true, shouldDirty: true });
    setShowScanner(false);
    toast({
      title: 'Đã quét mã',
      description: `Mã hàng: ${code}`,
    });
  };

  const onSubmit = async (data: Omit<Product, 'id'>) => {
    try {
      await addProduct.mutateAsync({
        ...data,
        gia_ban: data.gia_ban ? Number(data.gia_ban) : null,
        gia_von: data.gia_von ? Number(data.gia_von) : null,
        ton_kho: data.ton_kho ? Number(data.ton_kho) : null,
      });
      toast({
        title: 'Thành công',
        description: 'Đã thêm sản phẩm mới thành công',
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm sản phẩm',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md sm:rounded-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm mới</DialogTitle>
            <DialogDescription>
              Nhập mã hàng thủ công hoặc bấm biểu tượng quét để quét mã vạch sản phẩm.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="ma_hang">Mã hàng *</Label>
              <div className="flex gap-2">
                <Input
                  id="ma_hang"
                  {...register('ma_hang', { required: 'Mã hàng là bắt buộc' })}
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
              {errors.ma_hang && (
                <p className="text-sm text-destructive mt-1">{errors.ma_hang.message}</p>
              )}
              {currentMaHang && products?.some((p) => p.ma_hang === currentMaHang) && (
                <p className="text-sm text-destructive mt-1">Mã hàng này đã tồn tại</p>
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
                <p className="text-sm text-destructive mt-1">{errors.ten_hang.message}</p>
              )}
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
                disabled={addProduct.isPending}
                className="bg-brand-gradient text-white shadow-pop hover:opacity-90"
              >
                {addProduct.isPending ? 'Đang thêm...' : 'Thêm sản phẩm'}
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
