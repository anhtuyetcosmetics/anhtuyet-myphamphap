
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Barcode } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';

interface ProductSearchSelectProps {
  selectedProductId: number;
  onProductSelect: (productId: number) => void;
  placeholder?: string;
}

export const ProductSearchSelect: React.FC<ProductSearchSelectProps> = ({
  selectedProductId,
  onProductSelect,
  placeholder = "Chọn sản phẩm"
}) => {
  const [open, setOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const { data: products } = useProducts();

  const selectedProduct = products?.find(p => p.id === selectedProductId);

  const handleBarcodeSearch = () => {
    if (barcodeInput.trim()) {
      const product = products?.find(p => 
        p.ma_hang.toLowerCase().includes(barcodeInput.toLowerCase())
      );
      if (product) {
        onProductSelect(product.id);
        setOpen(false);
        setBarcodeInput('');
      }
    }
  };

  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBarcodeSearch();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Sản phẩm</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedProduct ? selectedProduct.ten_hang : placeholder}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Tìm kiếm sản phẩm..." />
            <div className="p-2 border-b">
              <div className="flex gap-2">
                <Input
                  placeholder="Quét/nhập mã vạch..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={handleBarcodeKeyPress}
                />
                <Button size="sm" onClick={handleBarcodeSearch}>
                  <Barcode className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CommandList>
              <CommandEmpty>Không tìm thấy sản phẩm</CommandEmpty>
              <CommandGroup>
                {products?.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => {
                      onProductSelect(product.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{product.ten_hang}</span>
                      <span className="text-sm text-gray-500">Mã: {product.ma_hang}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
