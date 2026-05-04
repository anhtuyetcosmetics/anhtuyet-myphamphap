import { usePWA } from '@/hooks/use-pwa';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function PWAStatus() {
  const { needRefresh, offlineReady, isOnline, updateServiceWorker } = usePWA();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOnline) {
      toast({
        title: 'Đang ở chế độ offline',
        description: 'Bạn đang offline — một số tính năng có thể không dùng được.',
        variant: 'destructive',
      });
    }
  }, [isOnline, toast]);

  useEffect(() => {
    if (offlineReady) {
      toast({
        title: 'Sẵn sàng dùng offline',
        description: 'App đã được cache, bạn vẫn dùng được khi mất mạng.',
      });
    }
  }, [offlineReady, toast]);

  useEffect(() => {
    if (needRefresh) {
      toast({
        title: 'Đã có phiên bản mới',
        description: 'Bấm để cập nhật và tải lại app.',
        action: (
          <Button
            variant="default"
            onClick={updateServiceWorker}
            className="ml-2"
          >
            Cập nhật ngay
          </Button>
        ),
      });
    }
  }, [needRefresh, updateServiceWorker, toast]);

  return null;
} 