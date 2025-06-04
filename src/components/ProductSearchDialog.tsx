
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Barcode, Camera } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useDebounce } from '@/hooks/use-debounce';

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (productId: number) => void;
  autoScan?: boolean;
}

const ITEMS_PER_PAGE = 50;

export const ProductSearchDialog: React.FC<ProductSearchDialogProps> = ({
  open,
  onOpenChange,
  onProductSelect,
  autoScan = false
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'text' | 'barcode'>(autoScan ? 'barcode' : 'text');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: products } = useProducts();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

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
        setBarcodeInput('');
        onOpenChange(false);
        toast({
          title: "Tìm thấy sản phẩm",
          description: `Đã thêm: ${product.ten_hang}`,
        });
      } else {
        toast({
          title: "Không tìm thấy",
          description: "Không tìm thấy sản phẩm với mã này",
          variant: "destructive",
        });
      }
    }
  }, [barcodeInput, products, onProductSelect, onOpenChange, toast]);

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
        
        const codeReader = new BrowserMultiFormatReader();
        let result = null;
        try {
          result = await codeReader.decodeOnceFromVideoElement(videoRef.current!);
        } catch (err) {
          // Không tìm thấy barcode
        }
        
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setIsScanning(false);
        
        if (result && result.text) {
          const product = products?.find(p => 
            p.ma_hang.toLowerCase().includes(result.text.toLowerCase()) ||
            p.ten_hang.toLowerCase().includes(result.text.toLowerCase())
          );
          
          if (product) {
            onProductSelect(product.id);
            onOpenChange(false);
            toast({
              title: "Quét thành công",
              description: `Đã thêm sản phẩm: ${product.ten_hang}`,
            });
          } else {
            setBarcodeInput(result.text);
            toast({
              title: "Quét thành công",
              description: `Đã phát hiện mã vạch: ${result.text}, nhấn tìm kiếm để chọn sản phẩm`,
            });
          }
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
        description: "Thiết bị hoặc trình duyệt không hỗ trợ camera.",
        variant: "destructive",
      });
    }
  };

  // Auto-trigger camera scan when dialog opens with autoScan=true
  useEffect(() => {
    if (open && autoScan) {
      setSearchMode('barcode');
      handleCameraCapture();
    } else if (open && !autoScan) {
      setSearchMode('text');
    }
  }, [open, autoScan]);

  // Cleanup media stream
  useEffect(() => {
    if (!isScanning && mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  }, [isScanning, mediaStream]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setBarcodeInput('');
      setIsScanning(false);
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
    }
  }, [open, mediaStream]);

  const handleProductSelectAndClose = (productId: number) => {
    onProductSelect(productId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Chọn sản phẩm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={searchMode === 'text' ? 'default' : 'outline'}
              onClick={() => setSearchMode('text')}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Tìm theo tên/mã
            </Button>
            <Button
              variant={searchMode === 'barcode' ? 'default' : 'outline'}
              onClick={() => setSearchMode('barcode')}
              className="flex-1"
            >
              <Barcode className="h-4 w-4 mr-2" />
              Quét mã vạch
            </Button>
          </div>

          {/* Text Search Mode */}
          {searchMode === 'text' && (
            <Command shouldFilter={false} className="border rounded-lg">
              <CommandInput 
                placeholder="Tìm kiếm sản phẩm..." 
                value={searchQuery}
                onValueChange={handleSearch}
              />
              <CommandList className="max-h-[300px] overflow-y-auto">
                <CommandEmpty>Không tìm thấy sản phẩm</CommandEmpty>
                <CommandGroup>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => handleProductSelectAndClose(product.id)}
                      className="hover:bg-blue-50 cursor-pointer"
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
          )}

          {/* Barcode Search Mode */}
          {searchMode === 'barcode' && (
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
                  onClick={handleBarcodeSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!barcodeInput.trim()}
                >
                  <Barcode className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="outline"
                onClick={handleCameraCapture}
                disabled={isScanning}
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
              >
                <Camera className="h-4 w-4 mr-2" />
                {isScanning ? 'Đang quét...' : 'Quét bằng camera'}
              </Button>
              {isScanning && (
                <div className="w-full flex justify-center">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
