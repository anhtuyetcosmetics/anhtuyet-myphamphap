
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
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { useAddSale, useAddSaleItem } from '@/hooks/useSales';
import { useToast } from '@/hooks/use-toast';

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
  const [maDoHang, setMaDonHang] = useState('');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [ghiChu, setGhiChu] = useState('');
  const [trangThai, setTrangThai] = useState('pending');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
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
    
    if (field === 'product_id') {
      const product = products?.find(p => p.id === value);
      if (product) {
        updated[index].gia_ban = product.gia_ban || 0;
        updated[index].product_name = product.ten_hang;
      }
    }
    
    setSaleItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!maDoHang.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã đơn hàng",
        variant: "destructive",
      });
      return;
    }

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
          description: "Đơn hàng đã được tạo thành công",
        });

        // Reset form
        setMaDonHang('');
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
            <div className="space-y-2">
              <Label htmlFor="ma_don_hang">Mã đơn hàng *</Label>
              <Input
                id="ma_don_hang"
                value={maDoHang}
                onChange={(e) => setMaDonHang(e.target.value)}
                placeholder="Nhập mã đơn hàng"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer">Khách hàng</Label>
              <Select value={customerId?.toString() || 'walk-in'} onValueChange={(value) => setCustomerId(value === 'walk-in' ? null : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Khách lẻ</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.ten_khach_hang} ({customer.ma_khach_hang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                  <div>
                    <Label>Sản phẩm</Label>
                    <Select
                      value={item.product_id?.toString() || 'no-product'}
                      onValueChange={(value) => updateSaleItem(index, 'product_id', value === 'no-product' ? 0 : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn sản phẩm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-product">Chọn sản phẩm</SelectItem>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.ten_hang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
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
