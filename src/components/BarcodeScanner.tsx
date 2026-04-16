import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, X, Flashlight, FlashlightOff, Keyboard, Camera, RefreshCcw } from 'lucide-react';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  /** Keep the camera open after each detection for continuous scanning. Default: true */
  continuous?: boolean;
}

/** Short beep using WebAudio – no asset needed. */
function playBeep() {
  try {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 120);
  } catch {
    /* no-op */
  }
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  onError,
  onClose,
  continuous = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [flash, setFlash] = useState(false);

  const stopStream = useCallback(() => {
    try { readerRef.current?.reset(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const initialize = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);
      stopStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;

      // Torch capability probing
      const track = stream.getVideoTracks()[0];
      const caps: any = typeof track?.getCapabilities === 'function' ? track.getCapabilities() : {};
      setTorchSupported(!!caps?.torch);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          const v = videoRef.current!;
          v.onloadedmetadata = () => v.play().then(() => resolve()).catch(() => resolve());
        });
      }

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      reader.decodeFromVideoDevice(null, videoRef.current, (result) => {
        if (!result) return;
        const code = result.getText();
        const now = Date.now();
        // Debounce duplicate scans for 1.5s
        if (lastCodeRef.current && lastCodeRef.current.code === code && now - lastCodeRef.current.at < 1500) return;
        lastCodeRef.current = { code, at: now };

        playBeep();
        if (navigator.vibrate) navigator.vibrate(60);
        setFlash(true);
        setTimeout(() => setFlash(false), 400);

        onBarcodeDetected(code);
        if (!continuous) stopStream();
      });

      setIsInitializing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể truy cập camera';
      setError(msg);
      onError?.(msg);
      setIsInitializing(false);
    }
  }, [continuous, onBarcodeDetected, onError, stopStream]);

  useEffect(() => {
    initialize();
    return () => stopStream();
  }, [initialize, stopStream]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn((t) => !t);
    } catch (e) {
      setTorchSupported(false);
    }
  };

  const submitManual = () => {
    const code = manualCode.trim();
    if (!code) return;
    playBeep();
    onBarcodeDetected(code);
    setManualCode('');
    if (!continuous) onClose?.();
  };

  return (
    <div className="relative w-full h-full bg-black text-white overflow-hidden">
      {/* Video */}
      {!manualMode && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          autoPlay
          muted
        />
      )}

      {/* Flash effect */}
      {flash && <div className="absolute inset-0 animate-flash-success pointer-events-none" />}

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 pt-safe z-30 pointer-events-none">
        <div className="flex items-center justify-between p-3 pointer-events-auto">
          <button
            type="button"
            className="bg-black/60 hover:bg-black/80 text-white rounded-full h-11 w-11 grid place-items-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              stopStream();
              onClose?.();
            }}
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
            Quét mã vạch
          </div>
          <button
            type="button"
            className="bg-black/60 hover:bg-black/80 text-white rounded-full h-11 w-11 grid place-items-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setManualMode((m) => !m);
            }}
            aria-label={manualMode ? 'Quay lại camera' : 'Nhập mã tay'}
          >
            {manualMode ? <Camera className="h-5 w-5" /> : <Keyboard className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Scanning UI */}
      {!manualMode && !isInitializing && !error && (
        <div className="absolute inset-0 z-10">
          {/* dim mask with clear cutout */}
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-72 h-72 max-w-[80vw] max-h-[50vh]">
              {/* clear square */}
              <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
              {/* corners */}
              <span className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
              <span className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
              <span className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
              <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
              {/* scanning line */}
              <div className="absolute inset-x-2 top-0 h-0.5 bg-primary/80 shadow-[0_0_12px_2px_hsl(var(--primary))] animate-scan-line" />
            </div>
          </div>

          <p className="absolute left-0 right-0 bottom-40 text-center text-white/80 text-sm px-8">
            Đưa mã vạch vào khung để quét. Máy sẽ rung & kêu "bíp" khi nhận diện được.
          </p>
        </div>
      )}

      {/* Loading */}
      {isInitializing && (
        <div className="absolute inset-0 z-10 grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Đang khởi tạo camera…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 z-10 grid place-items-center p-6">
          <div className="max-w-sm text-center bg-black/70 rounded-2xl p-6 border border-white/10">
            <p className="text-destructive font-medium mb-2">Lỗi camera</p>
            <p className="text-sm text-white/70 mb-4">{error}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={initialize} variant="secondary">
                <RefreshCcw className="h-4 w-4 mr-1" />
                Thử lại
              </Button>
              <Button onClick={() => setManualMode(true)} variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                <Keyboard className="h-4 w-4 mr-1" />
                Nhập tay
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  stopStream();
                  onClose?.();
                }}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual entry overlay */}
      {manualMode && (
        <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm p-6 flex flex-col justify-center">
          <label className="text-sm mb-2 text-white/80">Nhập mã vạch thủ công</label>
          <Input
            autoFocus
            inputMode="numeric"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitManual(); }}
            placeholder="VD: 8934567123456"
            className="bg-white text-foreground h-12 text-base"
          />
          <Button onClick={submitManual} className="mt-3 h-12 text-base" disabled={!manualCode.trim()}>
            Xác nhận
          </Button>
          <Button
            type="button"
            variant="outline"
            className="mt-2 h-12 text-base border-white/30 text-white hover:bg-white/10 bg-transparent"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              stopStream();
              onClose?.();
            }}
          >
            Đóng
          </Button>
        </div>
      )}

      {/* Bottom tools */}
      {!manualMode && !error && (
        <div className="absolute bottom-0 inset-x-0 z-30 pb-safe pointer-events-none">
          <div className="px-5 pt-4 pb-5 flex flex-col items-center gap-3 pointer-events-auto">
            {torchSupported && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleTorch();
                }}
                className={`h-14 w-14 rounded-full grid place-items-center ${
                  torchOn ? 'bg-primary text-white' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                aria-label={torchOn ? 'Tắt đèn pin' : 'Bật đèn pin'}
              >
                {torchOn ? <FlashlightOff className="h-6 w-6" /> : <Flashlight className="h-6 w-6" />}
              </button>
            )}

            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                stopStream();
                onClose?.();
              }}
              className="w-full max-w-sm h-12 bg-white text-foreground hover:bg-white/90 font-semibold"
            >
              <X className="h-5 w-5 mr-2" />
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
