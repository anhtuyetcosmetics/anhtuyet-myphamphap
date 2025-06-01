import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Barcode, Camera } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useDebounce } from '@/hooks/use-debounce';

interface ProductSearchSelectProps {
  selectedProductId: number;
  onProductSelect: (productId: number) => void;
  placeholder?: string;
}

const ITEMS_PER_PAGE = 50; // Số lượng sản phẩm hiển thị tối đa

export const ProductSearchSelect: React.FC<ProductSearchSelectProps> = ({
  selectedProductId,
  onProductSelect,
  placeholder = "Chọn sản phẩm"
}) => {
  const [open, setOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: products } = useProducts();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const selectedProduct = useMemo(() => 
    products?.find(p => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    if (!debouncedSearch) {
      return products.slice(0, ITEMS_PER_PAGE);
    }
    
    const searchLower = debouncedSearch.toLowerCase();
    return products
      .filter(product => 
        product.ten_hang.toLowerCase().includes(searchLower) ||
        product.ma_hang.toLowerCase().includes(searchLower)
      )
      .slice(0, ITEMS_PER_PAGE);
  }, [products, debouncedSearch]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleBarcodeSearch = useCallback(() => {
    if (barcodeInput.trim()) {
      const product = products?.find(p => 
        p.ma_hang.toLowerCase().includes(barcodeInput.toLowerCase()) ||
        p.ten_hang.toLowerCase().includes(barcodeInput.toLowerCase())
      );
      if (product) {
        onProductSelect(product.id);
        setOpen(false);
        setBarcodeInput('');
        toast({
          title: "Tìm thấy sản phẩm",
          description: `Đã chọn: ${product.ten_hang}`,
        });
      } else {
        toast({
          title: "Không tìm thấy",
          description: "Không tìm thấy sản phẩm với mã này",
          variant: "destructive",
        });
      }
    }
  }, [barcodeInput, products, onProductSelect, toast]);

  const handleBarcodeKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSearch();
    }
  }, [handleBarcodeSearch]);

  const handleCameraCapture = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsScanning(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }
        // Đọc barcode từ video bằng zxing
        const codeReader = new BrowserMultiFormatReader();
        let result = null;
        try {
          result = await codeReader.decodeOnceFromVideoElement(videoRef.current!);
        } catch (err) {
          // Không tìm thấy barcode
        }
        // Dừng camera
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setIsScanning(false);
        if (result && result.text) {
          setBarcodeInput(result.text);
          toast({
            title: "Quét thành công",
            description: `Đã phát hiện mã vạch: ${result.text}, nhấn tìm kiếm để chọn sản phẩm`,
          });
        } else {
          toast({
            title: "Không tìm thấy mã vạch",
            description: "Không phát hiện được mã vạch trong khung hình. Vui lòng thử lại hoặc nhập mã thủ công.",
            variant: "destructive",
          });
        }
      } catch (error) {
        setIsScanning(false);
        setMediaStream(null);
        console.error('Lỗi truy cập camera hoặc quét mã vạch:', error);
        let description = "Không thể truy cập camera hoặc quét mã vạch. Vui lòng nhập mã thủ công.";
        if (error && error.name === 'NotAllowedError') {
          description = "Bạn chưa cấp quyền truy cập camera. Hãy kiểm tra lại quyền trong trình duyệt.";
        } else if (error && error.name === 'NotFoundError') {
          description = "Thiết bị không có camera hoặc camera đang bị tắt.";
        } else if (error && error.name === 'NotReadableError') {
          description = "Camera đang được ứng dụng khác sử dụng hoặc bị lỗi phần cứng.";
        } else if (error && error.name === 'OverconstrainedError') {
          description = "Không tìm thấy camera phù hợp (ví dụ: camera sau). Hãy thử đổi thiết bị hoặc trình duyệt.";
        } else if (error && error.message && error.message.includes('Only secure origins are allowed')) {
          description = "Bạn cần truy cập ứng dụng qua HTTPS để sử dụng camera.";
        }
        toast({
          title: "Lỗi camera",
          description,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Không hỗ trợ",
        description: "Thiết bị hoặc trình duyệt không hỗ trợ camera. Hãy thử dùng Chrome/Safari mới nhất và đảm bảo truy cập qua HTTPS.",
        variant: "destructive",
      });
    }
  };

  // Dừng camera khi đóng popover hoặc khi không quét nữa
  React.useEffect(() => {
    if (!isScanning && mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    // eslint-disable-next-line
  }, [isScanning]);

  return (
    <div className="space-y-2">
      <Label>Sản phẩm</Label>
      <Popover open={open} onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setIsScanning(false);
          setSearchQuery('');
          setBarcodeInput('');
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white border-blue-200 hover:border-blue-400 text-left"
          >
            <span className="truncate">
              {selectedProduct ? selectedProduct.ten_hang : placeholder}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white border-blue-200" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Tìm kiếm sản phẩm..." 
              value={searchQuery}
              onValueChange={handleSearch}
              className="border-none" 
            />
            <div className="p-3 border-b border-gray-100">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Quét/nhập mã vạch..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={handleBarcodeKeyPress}
                    className="flex-1 border-blue-200"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleBarcodeSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!barcodeInput.trim()}
                  >
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCameraCapture}
                  disabled={isScanning}
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isScanning ? 'Đang quét...' : 'Quét bằng camera'}
                </Button>
                {isScanning && (
                  <div className="w-full flex justify-center mt-2">
                    <video
                      ref={videoRef}
                      style={{ width: '100%', maxWidth: 320, height: 240, background: '#000' }}
                      autoPlay
                      muted
                      playsInline
                    />
                  </div>
                )}
              </div>
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>Không tìm thấy sản phẩm</CommandEmpty>
              <CommandGroup>
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => {
                      onProductSelect(product.id);
                      setOpen(false);
                    }}
                    className="hover:bg-blue-50"
                  >
                    <div className="flex flex-col w-full">
                      <span className="font-medium">{product.ten_hang}</span>
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
