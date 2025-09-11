'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Share } from 'lucide-react';

export function PWAInstallHint() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Handle beforeinstallprompt for Android/Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show hint for iOS if not already installed
    if (iOS && !isStandaloneMode) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember user dismissed (optional)
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isVisible || isStandalone) return null;

  return (
    <Card className="mx-auto max-w-sm border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Download className="mr-2 h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">ติดตั้งแอป</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="mb-3">
          {isIOS
            ? 'เพิ่มเข้า Home Screen สำหรับการเข้าถึงที่ง่ายขึ้น'
            : 'ติดตั้งแอปเพื่อการใช้งานที่สะดวกขึ้น'}
        </CardDescription>
        
        {isIOS ? (
          <div className="text-sm text-gray-600">
            <div className="flex items-center mb-2">
              <Share className="mr-2 h-4 w-4" />
              <span>กดปุ่ม Share ด้านล่าง</span>
            </div>
            <div className="ml-6">
              <span>แล้วเลือก "เพิ่มที่หน้าจอโฮม"</span>
            </div>
          </div>
        ) : (
          <Button size="sm" onClick={handleInstall} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            ติดตั้งแอป
          </Button>
        )}
      </CardContent>
    </Card>
  );
}