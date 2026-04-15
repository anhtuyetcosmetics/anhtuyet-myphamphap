import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Minus,
  Trash2,
  Loader2,
  Percent,
  DollarSign,
  ScanBarcode,
  ShoppingBag,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { useAddSale, useAddSaleItem } from '@/hooks/useSales';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { CustomerSearchSelect } from './CustomerSearchSelect';
import { ProductSearchDialog } from './ProductSearchDialog';
import BarcodeScanner from './BarcodeScanner';
import { cn } from '@/lib/utils';

interface CreateSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SaleItem {
  product_id: number;
  so_luong: number;
  gia_ban: number;
  product_name?: string;
  ma_hang?: string;
}

interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}

const formatVND = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

export const CreateSaleDialog: React.FC<CreateSaleDialogProps> = ({ open, onOpenChange }) => {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [ghiChu, setGhiChu] = useState('');
  const [trangThai, setTrangThai] = useState('pending');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discount, setDiscount] = useState<Discount>({ type: 'fixed', value: 0 });
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const addSaleMutation = useAddSale();
  const addSaleItemMutation = useAddSaleItem();
  const { data: products } = useProducts();
  const { toast } = useToast();

  const handleProductSelect = (product: Product) => {
    const idx = saleItems.findIndex((it) => it.product_id === product.id);
    if (idx !== -1) {
      const updated = [...saleItems];
      updated[idx] = { ...updated[idx], so_luong: updated[idx].so_luong + 1 };
      setSaleItems(updated);
    } else {
      setSaleItems([
        ...saleItems,
        {
          product_id: product.id,
          so_luong: 1,
          gia_ban: product.gia_ban || 0,
          product_name: product.ten_hang,
          ma_hang: product.ma_hang,
        },
      ]);
    }
    setShowProductSearch(false);
  };

  const handleBarcodeDetected = (barcode: string) => {
    const product = products?.find((p) => p.ma_hang === barcode);
    if (product) {
      handleProductSelect(product);
      toast({
        title: 'Đã thêm',
        description: `${product.ten_hang}`,
      });
    } else {
      toast({
        title: 'Không tìm thấy sản phẩm',
        description: `Không có sản phẩm nào với mã vạch ${barcode}`,
        variant: 'destructive',
      });
    }
  };

  const removeSaleItem = (index: number) =>
    setSaleItems(saleItems.filter((_, i) => i !== index));

  const updateSaleItem = (index: number, patch: Partial<SaleItem>) => {
    setSaleItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const incQty = (i: number) =>
    updateSaleItem(i, { so_luong: saleItems[i].so_luong + 1 });
  const decQty = (i: number) => {
    const next = saleItems[i].so_luong - 1;
    if (next <= 0) removeSaleItem(i);
    else updateSaleItem(i, { so_luong: next });
  };

  const generateOrderCode = () => `DH${Date.now().toString().slice(-8)}`;

  const subtotal = useMemo(
    () => saleItems.reduce((s, it) => s + it.so_luong * it.gia_ban, 0),
    [saleItems]
  );
  const discountAmount = useMemo(() => {
    if (discount.type === 'percentage') return (subtotal * discount.value) / 100;
    return discount.value;
  }, [discount, subtotal]);
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = saleItems.reduce((s, it) => s + it.so_luong, 0);

  const reset = () => {
    setCustomerId(null);
    setGhiChu('');
    setTrangThai('pending');
    setSaleItems([]);
    setDiscount({ type: 'fixed', value: 0 });
    setShowDetails(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      toast({ title: 'Giỏ hàng trống', description: 'Vui lòng thêm ít nhất một sản phẩm', variant: 'destructive' });
      return;
    }
    const invalid = saleItems.filter((it) => !it.product_id || it.so_luong <= 0 || it.gia_ban <= 0);
    if (invalid.length) {
      toast({ title: 'Thiếu thông tin', description: 'Kiểm tra lại số lượng và giá bán', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const ma = generateOrderCode();
      const saleData = await addSaleMutation.mutateAsync({
        ma_don_hang: ma,
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
        await Promise.all(
          saleItems.map((it) =>
            addSaleItemMutation.mutateAsync({
              sale_id: saleId,
              product_id: it.product_id,
              so_luong: it.so_luong,
              gia_ban: it.gia_ban,
            })
          )
        );
        toast({ title: 'Thành công', description: `Đơn hàng ${ma} đã được tạo` });
        reset();
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Lỗi', description: 'Có lỗi xảy ra khi tạo đơn hàng', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="p-0 gap-0 max-w-2xl w-full sm:h-[92vh] h-[100dvh] sm:rounded-2xl rounded-none flex flex-col overflow-hidden"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <DialogHeader className="px-4 py-3 border-b bg-background/95 backdrop-blur-md shrink-0 pt-safe">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-brand-gradient grid place-items-center shadow-pop">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base">Đơn hàng mới</DialogTitle>
                <DialogDescription className="text-xs">
                  {itemCount > 0 ? `${itemCount} sản phẩm • ${formatVND(total)}` : 'Quét mã hoặc tìm sản phẩm'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            {/* Quick action buttons */}
            <div className="px-4 pt-3 grid grid-cols-2 gap-2 shrink-0">
              <Button
                type="button"
                onClick={() => setShowScanner(true)}
                className="h-12 bg-brand-gradient text-white shadow-pop hover:opacity-90"
              >
                <ScanBarcode className="h-5 w-5 mr-2" />
                Quét mã vạch
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductSearch(true)}
                className="h-12"
              >
                <Search className="h-5 w-5 mr-2" />
                Tìm sản phẩm
              </Button>
            </div>

            {/* Scrollable cart */}
            <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 scrollbar-thin">
              {saleItems.length === 0 ? (
                <EmptyCart />
              ) : (
                <ul className="space-y-2">
                  {saleItems.map((item, index) => {
                    const lineTotal = item.so_luong * item.gia_ban;
                    return (
                      <li
                        key={`${item.product_id}-${index}`}
                        className="bg-card border rounded-xl p-3 shadow-soft"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-snug line-clamp-2">
                              {item.product_name}
                            </p>
                            {item.ma_hang && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {item.ma_hang}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSaleItem(index)}
                            className="p-1.5 -m-1 text-muted-foreground hover:text-destructive"
                            aria-label="Xoá"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          {/* Qty stepper */}
                          <div className="inline-flex items-center bg-secondary rounded-full">
                            <button
                              type="button"
                              onClick={() => decQty(index)}
                              className="h-9 w-9 grid place-items-center rounded-full hover:bg-primary/10"
                              aria-label="Giảm"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.so_luong}
                              onChange={(e) => {
                                const v = parseInt(e.target.value) || 1;
                                updateSaleItem(index, { so_luong: Math.max(1, v) });
                              }}
                              className="w-10 text-center bg-transparent text-sm font-semibold outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => incQty(index)}
                              className="h-9 w-9 grid place-items-center rounded-full hover:bg-primary/10"
                              aria-label="Tăng"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={item.gia_ban}
                              onChange={(e) =>
                                updateSaleItem(index, { gia_ban: parseFloat(e.target.value) || 0 })
                              }
                              className="h-9 text-right w-28 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">₫</span>
                          </div>
                        </div>

                        <div className="mt-2 text-right text-sm">
                          <span className="text-muted-foreground">Thành tiền: </span>
                          <span className="font-semibold text-primary">{formatVND(lineTotal)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Details toggle */}
              {saleItems.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowDetails((v) => !v)}
                    className="text-sm text-primary font-medium"
                  >
                    {showDetails ? 'Ẩn chi tiết' : 'Thêm khách hàng, giảm giá, ghi chú…'}
                  </button>

                  {showDetails && (
                    <div className="mt-3 space-y-4 bg-muted/40 rounded-xl p-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Khách hàng</Label>
                        <CustomerSearchSelect
                          selectedCustomerId={customerId}
                          onCustomerSelect={setCustomerId}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Trạng thái</Label>
                        <Select value={trangThai} onValueChange={setTrangThai}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Đang xử lý</SelectItem>
                            <SelectItem value="completed">Hoàn thành</SelectItem>
                            <SelectItem value="cancelled">Đã huỷ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Giảm giá</Label>
                        <div className="flex gap-2">
                          <div className="inline-flex rounded-lg border p-0.5 bg-background">
                            <button
                              type="button"
                              onClick={() => setDiscount({ type: 'fixed', value: 0 })}
                              className={cn(
                                'h-9 px-3 rounded-md text-sm flex items-center gap-1',
                                discount.type === 'fixed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                              )}
                            >
                              <DollarSign className="h-3.5 w-3.5" /> ₫
                            </button>
                            <button
                              type="button"
                              onClick={() => setDiscount({ type: 'percentage', value: 0 })}
                              className={cn(
                                'h-9 px-3 rounded-md text-sm flex items-center gap-1',
                                discount.type === 'percentage' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                              )}
                            >
                              <Percent className="h-3.5 w-3.5" /> %
                            </button>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max={discount.type === 'percentage' ? 100 : undefined}
                            inputMode="numeric"
                            value={discount.value || ''}
                            onChange={(e) => {
                              const n = parseFloat(e.target.value) || 0;
                              const v = discount.type === 'percentage' ? Math.min(100, Math.max(0, n)) : Math.max(0, n);
                              setDiscount({ ...discount, value: v });
                            }}
                            placeholder={discount.type === 'percentage' ? 'Nhập %' : 'Nhập số tiền'}
                            className="flex-1 h-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ghi_chu" className="text-xs">Ghi chú</Label>
                        <Textarea
                          id="ghi_chu"
                          value={ghiChu}
                          onChange={(e) => setGhiChu(e.target.value)}
                          placeholder="Nhập ghi chú cho đơn hàng"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky footer summary */}
            <div className="border-t bg-background/95 backdrop-blur-md px-4 py-3 shrink-0 pb-safe space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatVND(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Giảm giá</span>
                  <span className="text-destructive">-{formatVND(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tổng tiền</span>
                <span className="text-xl font-bold text-brand-gradient">{formatVND(total)}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="h-12 flex-1"
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || saleItems.length === 0}
                  className="h-12 flex-[2] bg-brand-gradient text-white shadow-pop hover:opacity-90"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  Tạo đơn hàng
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ProductSearchDialog
        open={showProductSearch}
        onOpenChange={setShowProductSearch}
        onProductSelect={handleProductSelect}
      />

      {showScanner && (
        <div className="fixed inset-0 z-[60] bg-black">
          <BarcodeScanner
            continuous
            onBarcodeDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
            onError={(msg) => {
              toast({ variant: 'destructive', title: 'Lỗi', description: msg });
            }}
          />
        </div>
      )}
    </>
  );
};

const EmptyCart: React.FC = () => (
  <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 gap-3">
    <div className="h-16 w-16 rounded-2xl bg-primary/10 grid place-items-center">
      <ShoppingCart className="h-8 w-8 text-primary" />
    </div>
    <p className="font-medium">Giỏ hàng trống</p>
    <p className="text-sm text-muted-foreground max-w-xs">
      Bấm <b>Quét mã vạch</b> hoặc <b>Tìm sản phẩm</b> ở trên để thêm vào đơn hàng.
    </p>
  </div>
);
