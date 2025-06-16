import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Barcode } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/use-debounce';

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (product: Product) => void;
}

export const ProductSearchDialog: React.FC<ProductSearchDialogProps> = ({
  open,
  onOpenChange,
  onProductSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'text' | 'barcode'>('text');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: products } = useProducts();
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset search and focus when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchMode('text');
      // Use setTimeout to ensure the input is rendered
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [open]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!debouncedSearch) return products;

    return products.filter(product => {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        product.ten_hang.toLowerCase().includes(searchLower) ||
        product.ma_hang.toLowerCase().includes(searchLower)
      );
    });
  }, [products, debouncedSearch]);

  const handleProductSelect = useCallback((product: Product) => {
    onProductSelect(product);
    onOpenChange(false);
  }, [onProductSelect, onOpenChange]);

  const handleBarcodeScan = useCallback((barcode: string) => {
    setSearchQuery(barcode);
    setSearchMode('text');
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tìm kiếm sản phẩm</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4 md:hidden">
          <Button
            variant={searchMode === 'text' ? 'default' : 'outline'}
            onClick={() => setSearchMode('text')}
            className="flex-1"
          >
            <Search className="w-4 h-4 mr-2" />
            Tìm theo tên
          </Button>
          <Button
            variant={searchMode === 'barcode' ? 'default' : 'outline'}
            onClick={() => setSearchMode('barcode')}
            className="flex-1"
          >
            <Barcode className="w-4 h-4 mr-2" />
            Quét mã vạch
          </Button>
        </div>
        <div className="relative">
          <Input
            ref={inputRef}
            type={searchMode === 'barcode' ? 'text' : 'text'}
            placeholder={searchMode === 'barcode' ? 'Quét mã vạch...' : 'Tìm kiếm sản phẩm...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (searchMode === 'barcode' && e.key === 'Enter') {
                handleBarcodeScan(searchQuery);
              }
            }}
            className="w-full"
          />
        </div>
        <div className="mt-4 max-h-[400px] overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              Không tìm thấy sản phẩm
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="p-3 hover:bg-accent rounded-lg cursor-pointer"
                >
                  <div className="font-medium">{product.ten_hang}</div>
                  <div className="text-sm text-muted-foreground">
                    Mã vạch: {product.ma_hang}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Giá: {product.gia_ban?.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
