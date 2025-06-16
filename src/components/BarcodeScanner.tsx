import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBarcodeDetected: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  open,
  onOpenChange,
  onBarcodeDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open]);

  const startScanning = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Demander la permission de la caméra
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      const selectedDeviceId = videoInputDevices[0]?.deviceId;

      if (selectedDeviceId && videoRef.current) {
        await reader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result) => {
            if (result) {
              onBarcodeDetected(result.getText());
              stopScanning();
              onOpenChange(false);
            }
          }
        );
      }
    } catch (error) {
      console.error('Error starting barcode scanner:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Vui lòng cho phép truy cập camera để quét mã vạch');
        } else if (error.name === 'NotFoundError') {
          setError('Không tìm thấy camera');
        } else {
          setError('Có lỗi xảy ra khi khởi tạo camera');
        }
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-none w-full h-full md:max-w-[600px] md:h-auto">
        <div className="relative w-full h-full md:aspect-video">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-lg font-medium text-red-500 mb-4">{error}</p>
              <Button onClick={() => startScanning()}>Thử lại</Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
              />
              <div className="absolute inset-0 border-2 border-white/50 rounded-lg pointer-events-none" />
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white">Đang khởi tạo camera...</div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner; 