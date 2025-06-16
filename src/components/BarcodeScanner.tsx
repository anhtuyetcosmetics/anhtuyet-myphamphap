import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onError?: (error: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBarcodeDetected, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Arrêter le stream existant s'il y en a un
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Demander la permission de la caméra
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Attendre que la vidéo soit prête avant de commencer la lecture
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                if (videoRef.current) {
                  videoRef.current.play().then(resolve).catch((err) => {
                    console.error('Erreur lors de la lecture de la vidéo:', err);
                    resolve(true); // Continuer même en cas d'erreur
                  });
                }
              };
            }
          });
        }

        // Initialiser le lecteur de code-barres
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        setIsScanning(true);
        reader.decodeFromVideoDevice(
          null,
          videoRef.current,
          (result) => {
            if (result) {
              onBarcodeDetected(result.getText());
            }
          }
        );

        setIsInitializing(false);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de la caméra:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        if (onError) {
          onError(err instanceof Error ? err.message : 'Erreur inconnue');
        }
        setIsInitializing(false);
      }
    };

    initializeScanner();

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [onBarcodeDetected, onError]);

  const handleRetry = () => {
    setError(null);
    setIsInitializing(true);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
    }
    // Réinitialiser le scanner
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setIsScanning(true);
  };

  return (
    <div className="relative w-full h-full">
      {isInitializing ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Đang khởi tạo camera...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleRetry}>Thử lại</Button>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
          />
          {/* Overlay avec cadre de scan */}
          <div className="absolute inset-0 bg-black/50">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                {/* Coin supérieur gauche */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-white"></div>
                {/* Coin supérieur droit */}
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-white"></div>
                {/* Coin inférieur gauche */}
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-white"></div>
                {/* Coin inférieur droit */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-white"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner; 