import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';

/**
 * PWA Install Prompt Component
 * 
 * Displays a dismissible banner prompting users to install the app.
 * - Detects beforeinstallprompt event
 * - Handles installation flow
 * - Bilingual support (English/Arabic)
 * - Stores dismissal state in localStorage
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const translations = {
    en: {
      title: 'Install SimpleIT',
      description: 'Install our app for quick access and offline capabilities.',
      install: 'Install',
      dismiss: 'Not now',
    },
    ar: {
      title: 'تثبيت SimpleIT',
      description: 'قم بتثبيت التطبيق للوصول السريع والعمل دون اتصال.',
      install: 'تثبيت',
      dismiss: 'ليس الآن',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      return;
    }

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // @ts-ignore - navigator.standalone is iOS specific
    const isIOSStandalone = window.navigator.standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      return; // Already installed
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing
      e.preventDefault();
      
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom install prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    // Track the outcome (optional: send to analytics)
    if (outcome === 'accepted') {
      console.log('[PWA] App installed successfully');
    }
  };

  const handleDismiss = () => {
    // Store dismissal in localStorage
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
  };

  // Don't render if prompt shouldn't be shown
  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <Card className="shadow-lg border-2 border-primary/20">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{t.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleInstallClick}
                className="flex-1"
              >
                {t.install}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDismiss}
              >
                {t.dismiss}
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
