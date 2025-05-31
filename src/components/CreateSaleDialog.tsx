
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useAddSale, useAddSaleItem } from '@/hooks/useSales';
import { useToast } from '@/hooks/use-toast';
import { CustomerSearchSelect } from './CustomerSearchSelect';
import { ProductSearchSelect } from './ProductSearchSelect';

interface CreateSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SaleItem {
  product_id: number;
  so_luong: number;
  gia_ban: number;
  product_name?: string;
}

export const CreateSaleDialog: React.FC<CreateSaleDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [ghiChu, setGhiChu] = useState('');
  const [trangThai, setTrangThai] = useState('pending');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSaleMutation = useAddSale();
  const addSaleItemMutation = useAddSaleItem();
  const { toast } = useToast();

  const addSaleItem = () => {
    setSaleItems([...saleItems, { product_id: 0, so_luong: 1, gia_ban: 0 }]);
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const updateSaleItem = (index: number, field: keyof SaleItem, value: any) => {
    const updated = [...saleItems];
    updated[index] = { ...updated[index], [field]: value };
    setSaleItems(updated);
  };

  const generateOrderCode = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8);
    return `DH${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saleItems.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một sản phẩm",
        variant: "destructive",
      });
      return;
    }

    const invalidItems = saleItems.filter(item => 
      !item.product_id || item.so_luong <= 0 || item.gia_ban <= 0
    );

    if (invalidItems.length > 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin sản phẩm",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const maDoHang = generateOrderCode();
      
      // Create sale
      const saleData = await addSaleMutation.mutateAsync({
        ma_don_hang: maDoHang,
        customer_id: customerId,
        trang_thai: trangThai,
        ghi_chu: ghiChu || null,
      });

      if (saleData && saleData[0]) {
        const saleId = saleData[0].id;

        // Add sale items
        for (const item of saleItems) {
          await addSaleItemMutation.mutateAsync({
            sale_id: saleId,
            product_id: item.product_id,
            so_luong: item.so_luong,
            gia_ban: item.gia_ban,
          });
        }

        toast({
          title: "Thành công",
          description: `Đơn hàng ${maDoHang} đã được tạo thành công`,
        });

        // Reset form
        setCustomerId(null);
        setGhiChu('');
        setTrangThai('pending');
        setSaleItems([]);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo đơn hàng",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = saleItems.reduce((sum, item) => sum + (item.so_luong * item.gia_ban), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đơn hàng mới</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <CustomerSearchSelect
              selectedCustomerId={customerId}
              onCustomerSelect={setCustomerId}
            />
            
            <div className="space-y-2">
              <Label htmlFor="trang_thai">Trạng thái</Label>
              <Select value={trangThai} onValueChange={setTrangThai}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Đang xử lý</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Sản phẩm</Label>
              <Button type="button" onClick={addSaleItem} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Thêm sản phẩm
              </Button>
            </div>

            <div className="space-y-3">
              {saleItems.map((item, index) => (
                <div key={index} className="grid grid-cols-5 gap-3 items-end p-3 border rounded-lg">
                  <ProductSearchSelect
                    selectedProductId={item.product_id}
                    onProductSelect={(productId) => updateSaleItem(index, 'product_id', productId)}
                    placeholder="Chọn sản phẩm"
                  />
                  
                  <div>
                    <Label>Số lượng</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.so_luong}
                      onChange={(e) => updateSaleItem(index, 'so_luong', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label>Giá bán</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.gia_ban}
                      onChange={(e) => updateSaleItem(index, 'gia_ban', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label>Thành tiền</Label>
                    <Input
                      value={(item.so_luong * item.gia_ban).toLocaleString('vi-VN')}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSaleItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {saleItems.length > 0 && (
              <div className="text-right">
                <Label className="text-lg font-semibold">
                  Tổng tiền: {totalAmount.toLocaleString('vi-VN')} ₫
                </Label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ghi_chu">Ghi chú</Label>
            <Textarea
              id="ghi_chu"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Nhập ghi chú cho đơn hàng"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo đơn hàng
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
