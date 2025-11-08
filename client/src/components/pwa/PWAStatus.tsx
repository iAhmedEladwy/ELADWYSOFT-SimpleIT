import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';

/**
 * PWA Status Indicator Component
 * 
 * Displays online/offline status and PWA installation status.
 * - Real-time network status monitoring
 * - Indicates if app is installed as PWA
 * - Non-intrusive top-right corner placement
 * - Bilingual support (English/Arabic)
 */

export function PWAStatus() {
  const { language } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPWA, setIsPWA] = useState(false);

  const translations = {
    en: {
      online: 'Online',
      offline: 'Offline',
      installed: 'Installed',
      browser: 'Browser',
    },
    ar: {
      online: 'متصل',
      offline: 'غير متصل',
      installed: 'مثبت',
      browser: 'متصفح',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // @ts-ignore - navigator.standalone is iOS specific
    const isIOSStandalone = window.navigator.standalone === true;
    
    setIsPWA(isStandalone || isIOSStandalone);

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline Status */}
      <Badge
        variant={isOnline ? 'default' : 'destructive'}
        className="flex items-center gap-1.5 px-2 py-1"
      >
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            <span className="text-xs font-medium">{t.online}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span className="text-xs font-medium">{t.offline}</span>
          </>
        )}
      </Badge>

      {/* PWA Installation Status */}
      {isPWA && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-2 py-1"
        >
          <Download className="w-3 h-3" />
          <span className="text-xs font-medium">{t.installed}</span>
        </Badge>
      )}
    </div>
  );
}
