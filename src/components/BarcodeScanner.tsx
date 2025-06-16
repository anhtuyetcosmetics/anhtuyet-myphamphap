import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-none w-full h-full md:max-w-[600px] md:h-auto">
        <div className="relative w-full h-full md:aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
          />
          <div className="absolute inset-0 border-2 border-white/50 rounded-lg pointer-events-none" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner; 