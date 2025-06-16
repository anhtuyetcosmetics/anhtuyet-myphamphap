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
import { Plus, Trash2, Loader2, Percent, DollarSign, ScanBarcode } from 'lucide-react';
import { useAddSale, useAddSaleItem } from '@/hooks/useSales';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { CustomerSearchSelect } from './CustomerSearchSelect';
import { ProductSearchDialog } from './ProductSearchDialog';

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

interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
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
  const [discount, setDiscount] = useState<Discount>({ type: 'fixed', value: 0 });
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchMode, setProductSearchMode] = useState<'select' | 'scan'>('select');

  const addSaleMutation = useAddSale();
  const addSaleItemMutation = useAddSaleItem();
  const { data: products } = useProducts();
  const { toast } = useToast();

  const addSaleItem = () => {
    setProductSearchMode('select');
    setShowProductSearch(true);
  };

  const handleScanProduct = () => {
    setProductSearchMode('scan');
    setShowProductSearch(true);
  };

  const handleProductSelect = (product: Product) => {
    // Check if product already exists in the list
    const existingItemIndex = saleItems.findIndex(item => item.product_id === product.id);
    
    if (existingItemIndex !== -1) {
      // Product exists, update quantity
      const updatedItems = [...saleItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        so_luong: updatedItems[existingItemIndex].so_luong + 1
      };
      setSaleItems(updatedItems);
    } else {
      // Product doesn't exist, add new item
      setSaleItems([...saleItems, {
        product_id: product.id,
        so_luong: 1,
        gia_ban: product.gia_ban || 0,
        product_name: product.ten_hang
      }]);
    }
    setShowProductSearch(false);
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

  const calculateSubtotal = () => {
    return saleItems.reduce((sum, item) => sum + (item.so_luong * item.gia_ban), 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100;
    }
    return discount.value;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return Math.max(0, subtotal - discountAmount);
  };

  const handleDiscountTypeChange = (type: 'percentage' | 'fixed') => {
    setDiscount({ type, value: 0 });
  };

  const handleDiscountValueChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    if (discount.type === 'percentage') {
      setDiscount({ ...discount, value: Math.min(100, Math.max(0, numValue)) });
    } else {
      setDiscount({ ...discount, value: Math.max(0, numValue) });
    }
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
      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscountAmount();
      const total = calculateTotal();
      
      // Create sale
      const saleData = await addSaleMutation.mutateAsync({
        ma_don_hang: maDoHang,
        customer_id: customerId,
        trang_thai: trangThai,
        ghi_chu: ghiChu || null,
        tong_tien: subtotal,
        thanh_tien: total,
        giam_gia_loai: discount.value > 0 ? discount.type : null,
        giam_gia_gia_tri: discount.value > 0 ? discount.value : null,
        giam_gia_so_tien: discount.value > 0 ? discountAmount : null,
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
        setDiscount({ type: 'fixed', value: 0 });
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

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscountAmount();
  const total = calculateTotal();

  return (
    <>
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
                <div className="flex gap-2">
                  <Button type="button" onClick={addSaleItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm sản phẩm
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleScanProduct} 
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <ScanBarcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {saleItems.length > 0 && (
                <div className="space-y-3">
                  {/* Header for mobile-optimized layout */}
                  <div className="grid grid-cols-[2fr_0.5fr_1fr] gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                    <div>Sản phẩm</div>
                    <div className="text-center">SL</div>
                    <div className="text-center">Giá</div>
                  </div>

                  {saleItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-[2fr_0.5fr_1fr] gap-3 items-center p-3 border rounded-lg relative">
                      <div>
                        <div className="text-sm font-medium leading-tight">{item.product_name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {products?.find(p => p.id === item.product_id)?.ma_hang}
                        </div>
                      </div>
                      
                      <div>
                        <Input
                          type="number"
                          min="1"
                          value={item.so_luong}
                          onChange={(e) => updateSaleItem(index, 'so_luong', parseInt(e.target.value))}
                          className="text-center text-sm w-[50px] mx-auto"
                        />
                      </div>
                      
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          value={item.gia_ban}
                          onChange={(e) => updateSaleItem(index, 'gia_ban', parseFloat(e.target.value))}
                          className="text-sm pr-8"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSaleItem(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Subtotal display for each item */}
                      <div className="col-span-4 text-right text-xs text-gray-600 mt-1">
                        Thành tiền: {(item.so_luong * item.gia_ban).toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {saleItems.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base">Tạm tính:</Label>
                    <span className="text-lg">{subtotal.toLocaleString('vi-VN')} ₫</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label>Giảm giá</Label>
                      <div className="flex gap-2">
                        <Select
                          value={discount.type}
                          onValueChange={(value: 'percentage' | 'fixed') => handleDiscountTypeChange(value)}
                        >
                          <SelectTrigger className="w-[60px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              <div className="flex items-center justify-center">
                                <Percent className="h-4 w-4" />
                              </div>
                            </SelectItem>
                            <SelectItem value="fixed">
                              <div className="flex items-center justify-center">
                                <DollarSign className="h-4 w-4" />
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="0"
                          max={discount.type === 'percentage' ? 100 : undefined}
                          value={discount.value}
                          onChange={(e) => handleDiscountValueChange(e.target.value)}
                          className="flex-1 text-base"
                          placeholder={discount.type === 'percentage' ? 'Nhập % giảm giá' : 'Nhập số tiền giảm'}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label>Số tiền giảm:</Label>
                      <div className="text-lg font-medium text-red-600">
                        -{discountAmount.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-3">
                    <Label className="text-lg font-semibold">Tổng tiền:</Label>
                    <span className="text-xl font-bold text-blue-600">
                      {total.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
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

      <ProductSearchDialog
        open={showProductSearch}
        onOpenChange={setShowProductSearch}
        onProductSelect={handleProductSelect}
      />
    </>
  );
};
