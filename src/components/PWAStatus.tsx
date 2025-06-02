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
        title: 'Offline Mode',
        description: 'You are currently offline. Some features may be limited.',
        variant: 'destructive',
      });
    }
  }, [isOnline, toast]);

  useEffect(() => {
    if (offlineReady) {
      toast({
        title: 'Ready for Offline',
        description: 'The app is now ready for offline use.',
      });
    }
  }, [offlineReady, toast]);

  useEffect(() => {
    if (needRefresh) {
      toast({
        title: 'New Version Available',
        description: 'A new version is available. Click to update.',
        action: (
          <Button
            variant="default"
            onClick={updateServiceWorker}
            className="ml-2"
          >
            Update Now
          </Button>
        ),
      });
    }
  }, [needRefresh, updateServiceWorker, toast]);

  return null;
} 