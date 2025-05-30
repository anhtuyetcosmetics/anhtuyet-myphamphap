
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useAddInventoryTransaction, InventoryTransaction } from '@/hooks/useInventory';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddInventoryDialog: React.FC<AddInventoryDialogProps> = ({ open, onOpenChange }) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Omit<InventoryTransaction, 'id' | 'ngay_giao_dich'>>();
  const addTransaction = useAddInventoryTransaction();
  const { data: products } = useProducts();
  const { toast } = useToast();

  const watchedType = watch('loai_giao_dich');

  const onSubmit = async (data: Omit<InventoryTransaction, 'id' | 'ngay_giao_dich'>) => {
    try {
      await addTransaction.mutateAsync({
        ...data,
        product_id: Number(data.product_id),
        so_luong: Number(data.so_luong),
        gia_tri: data.gia_tri ? Number(data.gia_tri) : null,
      });
      toast({
        title: "Thành công",
        description: "Đã thêm giao dịch kho thành công",
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm giao dịch kho",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm giao dịch kho</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="product_id">Sản phẩm *</Label>
            <select
              id="product_id"
              {...register('product_id', { required: 'Sản phẩm là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn sản phẩm</option>
              {products?.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.ten_hang} ({product.ma_hang})
                </option>
              ))}
            </select>
            {errors.product_id && (
              <p className="text-sm text-red-600 mt-1">{errors.product_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="loai_giao_dich">Loại giao dịch *</Label>
            <select
              id="loai_giao_dich"
              {...register('loai_giao_dich', { required: 'Loại giao dịch là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn loại giao dịch</option>
              <option value="nhap">Nhập kho</option>
              <option value="xuat">Xuất kho</option>
              <option value="dieu_chinh">Điều chỉnh tồn kho</option>
            </select>
            {errors.loai_giao_dich && (
              <p className="text-sm text-red-600 mt-1">{errors.loai_giao_dich.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="so_luong">
              Số lượng * {watchedType === 'dieu_chinh' && '(Tồn kho mới)'}
            </Label>
            <Input
              id="so_luong"
              type="number"
              {...register('so_luong', { 
                required: 'Số lượng là bắt buộc',
                min: { value: 1, message: 'Số lượng phải lớn hơn 0' }
              })}
              placeholder="Nhập số lượng"
            />
            {errors.so_luong && (
              <p className="text-sm text-red-600 mt-1">{errors.so_luong.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="gia_tri">Giá trị</Label>
            <Input
              id="gia_tri"
              type="number"
              {...register('gia_tri')}
              placeholder="Nhập giá trị"
            />
          </div>

          <div>
            <Label htmlFor="nguoi_thuc_hien">Người thực hiện</Label>
            <Input
              id="nguoi_thuc_hien"
              {...register('nguoi_thuc_hien')}
              placeholder="Nhập tên người thực hiện"
            />
          </div>

          <div>
            <Label htmlFor="ghi_chu">Ghi chú</Label>
            <Input
              id="ghi_chu"
              {...register('ghi_chu')}
              placeholder="Nhập ghi chú"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={addTransaction.isPending}>
              {addTransaction.isPending ? 'Đang thêm...' : 'Thêm giao dịch'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
